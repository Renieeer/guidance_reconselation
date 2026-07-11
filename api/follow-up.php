<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'conn.php';

function send_json(int $statusCode, array $payload): void {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

/* A `follow_up` table already ships in this DB's original dump
   (guidance_tbl.sql) with a bare Status/Title/Counselor/Case_table_Id
   shape that predates this feature. CREATE TABLE IF NOT EXISTS would
   silently no-op against that older shape, so the columns this app
   actually needs are added defensively. Plain MySQL 8 (unlike MariaDB)
   has no "ADD COLUMN IF NOT EXISTS" clause, so existence is checked via
   SHOW COLUMNS/SHOW INDEX first — confirmed against this DB's actual
   MySQL 8.0.30 server, which rejects that clause outright. */
function ensure_follow_up_tables(mysqli $conn): void {
    $conn->query("
        CREATE TABLE IF NOT EXISTS follow_up (
            Follow_id INT NOT NULL AUTO_INCREMENT,
            PRIMARY KEY (Follow_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    ");

    $columns = [
        'case_uid'       => "VARCHAR(45) NOT NULL DEFAULT ''",
        'category_id'    => "VARCHAR(45) DEFAULT NULL",
        'category_name'  => "VARCHAR(150) DEFAULT NULL",
        'follow_up_date' => "DATE DEFAULT NULL",
        'counselor_id'   => "VARCHAR(45) DEFAULT NULL",
        'counselor_name' => "VARCHAR(150) DEFAULT NULL",
        'created_at'     => "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
    ];

    $existingColumns = [];
    $colResult = $conn->query('SHOW COLUMNS FROM follow_up');
    if ($colResult) {
        while ($col = $colResult->fetch_assoc()) {
            $existingColumns[$col['Field']] = true;
        }
    }

    foreach ($columns as $name => $definition) {
        if (!isset($existingColumns[$name])) {
            $conn->query("ALTER TABLE follow_up ADD COLUMN {$name} {$definition}");
        }
    }

    $indexExists = false;
    $idxResult = $conn->query("SHOW INDEX FROM follow_up WHERE Key_name = 'idx_case_uid'");
    if ($idxResult && $idxResult->num_rows > 0) {
        $indexExists = true;
    }
    if (!$indexExists) {
        $conn->query('ALTER TABLE follow_up ADD INDEX idx_case_uid (case_uid)');
    }

    $conn->query("
        CREATE TABLE IF NOT EXISTS follow_up_note (
            note_id INT NOT NULL AUTO_INCREMENT,
            follow_up_id INT NOT NULL,
            student_id VARCHAR(45) NOT NULL,
            student_name VARCHAR(150) DEFAULT NULL,
            note TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (note_id),
            KEY idx_follow_up_id (follow_up_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    ");
}

function read_json_body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

ensure_follow_up_tables($conn);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $caseUid = trim((string)($_GET['case_uid'] ?? ''));
    if ($caseUid === '') {
        send_json(400, ['success' => false, 'message' => 'case_uid is required']);
    }

    $stmt = $conn->prepare('
        SELECT fu.Follow_id AS follow_up_id, fu.category_id, fu.category_name,
               fu.follow_up_date, fu.created_at, n.student_id, n.student_name, n.note
        FROM follow_up fu
        JOIN follow_up_note n ON n.follow_up_id = fu.Follow_id
        WHERE fu.case_uid = ?
        ORDER BY fu.created_at ASC, fu.Follow_id ASC
    ');
    if (!$stmt) {
        send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    }
    $stmt->bind_param('s', $caseUid);
    if (!$stmt->execute()) {
        send_json(500, ['success' => false, 'message' => 'Execute failed: ' . $stmt->error]);
    }

    $result = $stmt->get_result();
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = [
            'followUpId'    => 'FU-' . $row['follow_up_id'] . '-' . $row['student_id'],
            'studentId'     => (string)$row['student_id'],
            'categoryId'    => (string)$row['category_id'],
            'categoryName'  => (string)$row['category_name'],
            'initialAction' => (string)$row['note'],
            'followUpDate'  => (string)$row['follow_up_date'],
            'recordedAt'    => (string)$row['created_at']
        ];
    }
    $stmt->close();

    send_json(200, ['success' => true, 'data' => $rows]);
}

if ($method === 'POST') {
    $body = read_json_body();

    $caseUid       = trim((string)($body['case_uid'] ?? ''));
    $categoryId    = trim((string)($body['category_id'] ?? ''));
    $categoryName  = trim((string)($body['category_name'] ?? ''));
    $followUpDate  = trim((string)($body['follow_up_date'] ?? ''));
    $counselorId   = trim((string)($body['counselor_id'] ?? ''));
    $counselorName = trim((string)($body['counselor_name'] ?? ''));
    $notes         = is_array($body['notes'] ?? null) ? $body['notes'] : [];

    if ($caseUid === '' || $categoryId === '' || $followUpDate === '' || count($notes) === 0) {
        send_json(400, ['success' => false, 'message' => 'Case, category, date, and at least one student are required.']);
    }

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $followUpDate)) {
        send_json(400, ['success' => false, 'message' => 'Invalid date format. Use YYYY-MM-DD']);
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare('
            INSERT INTO follow_up (case_uid, category_id, category_name, follow_up_date, counselor_id, counselor_name)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        if (!$stmt) {
            throw new RuntimeException('Prepare failed: ' . $conn->error);
        }
        $stmt->bind_param('ssssss', $caseUid, $categoryId, $categoryName, $followUpDate, $counselorId, $counselorName);
        if (!$stmt->execute()) {
            throw new RuntimeException('Failed to save follow-up: ' . $stmt->error);
        }
        $followUpId = $stmt->insert_id;
        $stmt->close();

        $noteStmt = $conn->prepare('
            INSERT INTO follow_up_note (follow_up_id, student_id, student_name, note)
            VALUES (?, ?, ?, ?)
        ');
        if (!$noteStmt) {
            throw new RuntimeException('Prepare failed: ' . $conn->error);
        }

        $savedNotes = 0;
        foreach ($notes as $entry) {
            $studentId   = trim((string)($entry['student_id'] ?? ''));
            $studentName = trim((string)($entry['student_name'] ?? ''));
            $note        = trim((string)($entry['note'] ?? ''));
            if ($studentId === '') {
                continue;
            }
            $noteStmt->bind_param('isss', $followUpId, $studentId, $studentName, $note);
            if (!$noteStmt->execute()) {
                throw new RuntimeException('Failed to save student note: ' . $noteStmt->error);
            }
            $savedNotes++;
        }
        $noteStmt->close();

        if ($savedNotes === 0) {
            throw new RuntimeException('No valid students to record a follow-up for.');
        }

        $conn->commit();
    } catch (Throwable $e) {
        $conn->rollback();
        send_json(500, ['success' => false, 'message' => $e->getMessage()]);
    }

    send_json(201, [
        'success' => true,
        'message' => 'Follow-up recorded successfully.',
        'data' => ['follow_up_id' => $followUpId]
    ]);
}

send_json(405, ['success' => false, 'message' => 'Method not allowed']);
