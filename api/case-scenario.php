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

function ensure_case_scenario_table(mysqli $conn): void {
    $sql = "
        CREATE TABLE IF NOT EXISTS counselor_case_scenarios (
            id INT NOT NULL AUTO_INCREMENT,
            case_uid VARCHAR(45) NOT NULL,
            counselor_id VARCHAR(45) DEFAULT NULL,
            counselor_name VARCHAR(150) DEFAULT NULL,
            school_attended VARCHAR(150) DEFAULT NULL,
            section_id VARCHAR(20) DEFAULT NULL,
            section_name VARCHAR(100) DEFAULT NULL,
            category_id VARCHAR(45) DEFAULT NULL,
            category_name VARCHAR(150) DEFAULT NULL,
            case_title VARCHAR(180) DEFAULT NULL,
            case_type VARCHAR(80) DEFAULT NULL,
            case_date DATE DEFAULT NULL,
            case_summary TEXT,
            case_objective TEXT,
            first_action TEXT,
            follow_up_date DATE DEFAULT NULL,
            confidentiality_ack TINYINT(1) DEFAULT 0,
            status VARCHAR(30) DEFAULT 'submitted',
            students_json LONGTEXT,
            counseling_records_json LONGTEXT,
            follow_ups_json LONGTEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_case_uid (case_uid),
            KEY idx_school_created (school_attended, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    ";

    if (!$conn->query($sql)) {
        send_json(500, ['success' => false, 'message' => 'Failed creating counselor_case_scenarios table: ' . $conn->error]);
    }
}

function read_json_body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }

    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function normalize_record(array $row): array {
    return [
        'id' => (string)($row['case_uid'] ?? ''),
        'status' => (string)($row['status'] ?? 'submitted'),
        'counselor' => (string)($row['counselor_name'] ?? ''),
        'sectionId' => (string)($row['section_id'] ?? ''),
        'sectionName' => (string)($row['section_name'] ?? ''),
        'categoryId' => (string)($row['category_id'] ?? ''),
        'categoryName' => (string)($row['category_name'] ?? ''),
        'caseTitle' => (string)($row['case_title'] ?? ''),
        'caseType' => (string)($row['case_type'] ?? ''),
        'caseDate' => (string)($row['case_date'] ?? ''),
        'caseSummary' => (string)($row['case_summary'] ?? ''),
        'caseObjective' => (string)($row['case_objective'] ?? ''),
        'firstAction' => (string)($row['first_action'] ?? ''),
        'followUpDate' => (string)($row['follow_up_date'] ?? ''),
        'confidentialityAck' => (bool)($row['confidentiality_ack'] ?? 0),
        'students' => json_decode((string)($row['students_json'] ?? '[]'), true) ?: [],
        'counselingRecords' => json_decode((string)($row['counseling_records_json'] ?? '{}'), true) ?: new stdClass(),
        'followUps' => json_decode((string)($row['follow_ups_json'] ?? '[]'), true) ?: [],
        'createdAt' => (string)($row['created_at'] ?? ''),
        'updatedAt' => (string)($row['updated_at'] ?? '')
    ];
}

ensure_case_scenario_table($conn);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $school = trim((string)($_GET['school_attended'] ?? ''));
    $limit = (int)($_GET['limit'] ?? 50);
    if ($limit <= 0 || $limit > 200) {
        $limit = 50;
    }

    if ($school !== '') {
        $stmt = $conn->prepare('
            SELECT *
            FROM counselor_case_scenarios
            WHERE school_attended = ?
            ORDER BY created_at DESC
            LIMIT ?
        ');
        if (!$stmt) {
            send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        }
        $stmt->bind_param('si', $school, $limit);
    } else {
        $stmt = $conn->prepare('
            SELECT *
            FROM counselor_case_scenarios
            ORDER BY created_at DESC
            LIMIT ?
        ');
        if (!$stmt) {
            send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        }
        $stmt->bind_param('i', $limit);
    }

    if (!$stmt->execute()) {
        send_json(500, ['success' => false, 'message' => 'Query failed: ' . $stmt->error]);
    }

    $result = $stmt->get_result();
    $records = [];
    while ($row = $result->fetch_assoc()) {
        $records[] = normalize_record($row);
    }

    $stmt->close();
    send_json(200, ['success' => true, 'data' => $records]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(405, ['success' => false, 'message' => 'Method not allowed']);
}

$body = read_json_body();
$action = trim((string)($body['action'] ?? 'create'));
$record = isset($body['record']) && is_array($body['record']) ? $body['record'] : $body;

if ($action === 'update') {
    $caseUid = trim((string)($record['id'] ?? ''));
    if ($caseUid === '') {
        send_json(400, ['success' => false, 'message' => 'Case id is required for update.']);
    }

    $status = trim((string)($record['status'] ?? 'submitted'));
    $categoryId = trim((string)($record['categoryId'] ?? ''));
    $categoryName = trim((string)($record['categoryName'] ?? ''));
    $followUpDate = trim((string)($record['followUpDate'] ?? ''));
    $studentsJson = json_encode($record['students'] ?? [], JSON_UNESCAPED_UNICODE);
    $counselingJson = json_encode($record['counselingRecords'] ?? new stdClass(), JSON_UNESCAPED_UNICODE);
    $followUpsJson = json_encode($record['followUps'] ?? [], JSON_UNESCAPED_UNICODE);

    $stmt = $conn->prepare('
        UPDATE counselor_case_scenarios
        SET status = ?,
            category_id = ?,
            category_name = ?,
            follow_up_date = NULLIF(?, ""),
            students_json = ?,
            counseling_records_json = ?,
            follow_ups_json = ?
        WHERE case_uid = ?
    ');

    if (!$stmt) {
        send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    }

    $stmt->bind_param(
        'ssssssss',
        $status,
        $categoryId,
        $categoryName,
        $followUpDate,
        $studentsJson,
        $counselingJson,
        $followUpsJson,
        $caseUid
    );

    if (!$stmt->execute()) {
        send_json(500, ['success' => false, 'message' => 'Update failed: ' . $stmt->error]);
    }

    $stmt->close();
    send_json(200, ['success' => true, 'message' => 'Case scenario updated.']);
}

$caseUid = trim((string)($record['id'] ?? ''));
$sectionId = trim((string)($record['sectionId'] ?? ''));
$categoryId = trim((string)($record['categoryId'] ?? ''));
$caseSummary = trim((string)($record['caseSummary'] ?? ''));
$students = $record['students'] ?? [];

if ($caseUid === '' || $sectionId === '' || $categoryId === '' || $caseSummary === '' || !is_array($students) || count($students) === 0) {
    send_json(400, ['success' => false, 'message' => 'Missing required case scenario fields.']);
}

$counselorId = trim((string)($record['counselorId'] ?? ''));
$counselor = trim((string)($record['counselor'] ?? ''));
$school = trim((string)($record['schoolAttended'] ?? ''));
$sectionName = trim((string)($record['sectionName'] ?? ''));
$categoryName = trim((string)($record['categoryName'] ?? ''));
$caseTitle = trim((string)($record['caseTitle'] ?? ''));
$caseType = trim((string)($record['caseType'] ?? ''));
$caseDate = trim((string)($record['caseDate'] ?? ''));
$caseObjective = trim((string)($record['caseObjective'] ?? ''));
$firstAction = trim((string)($record['firstAction'] ?? ''));
$followUpDate = trim((string)($record['followUpDate'] ?? ''));
$confidentialityAck = !empty($record['confidentialityAck']) ? 1 : 0;
$status = trim((string)($record['status'] ?? 'submitted'));

$studentsJson = json_encode($students, JSON_UNESCAPED_UNICODE);
$counselingJson = json_encode($record['counselingRecords'] ?? new stdClass(), JSON_UNESCAPED_UNICODE);
$followUpsJson = json_encode($record['followUps'] ?? [], JSON_UNESCAPED_UNICODE);

$stmt = $conn->prepare('
    INSERT INTO counselor_case_scenarios (
        case_uid,
        counselor_id,
        counselor_name,
        school_attended,
        section_id,
        section_name,
        category_id,
        category_name,
        case_title,
        case_type,
        case_date,
        case_summary,
        case_objective,
        first_action,
        follow_up_date,
        confidentiality_ack,
        status,
        students_json,
        counseling_records_json,
        follow_ups_json
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        NULLIF(?, ""), ?, ?, ?,
        NULLIF(?, ""), ?, ?, ?, ?, ?
    )
');

if (!$stmt) {
    send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
}

$stmt->bind_param(
    'sssssssssssssssissss',
    $caseUid,
    $counselorId,
    $counselor,
    $school,
    $sectionId,
    $sectionName,
    $categoryId,
    $categoryName,
    $caseTitle,
    $caseType,
    $caseDate,
    $caseSummary,
    $caseObjective,
    $firstAction,
    $followUpDate,
    $confidentialityAck,
    $status,
    $studentsJson,
    $counselingJson,
    $followUpsJson
);

if (!$stmt->execute()) {
    if ($stmt->errno === 1062) {
        send_json(409, ['success' => false, 'message' => 'Case scenario already exists.']);
    }
    send_json(500, ['success' => false, 'message' => 'Insert failed: ' . $stmt->error]);
}

$stmt->close();
send_json(201, ['success' => true, 'message' => 'Case scenario saved to database.']);
