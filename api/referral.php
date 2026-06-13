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

function tableExists(mysqli $conn, string $tableName): bool {
    $result = $conn->query("SHOW TABLES LIKE '" . $conn->real_escape_string($tableName) . "'");
    return $result && $result->num_rows > 0;
}

function getColumns(mysqli $conn, string $tableName): array {
    $columns = [];
    $result = $conn->query("SHOW COLUMNS FROM `{$tableName}`");

    if (!$result) {
        return $columns;
    }

    while ($row = $result->fetch_assoc()) {
        $columns[$row['Field']] = true;
    }

    return $columns;
}

function hasColumn(array $columns, string $columnName, array $legacyNames = []): bool {
    $normalized = [];
    foreach ($columns as $name => $value) {
        $normalized[strtolower((string) $name)] = true;
    }

    if (isset($normalized[strtolower($columnName)])) {
        return true;
    }

    foreach ($legacyNames as $legacyName) {
        if (isset($normalized[strtolower($legacyName)])) {
            return true;
        }
    }

    return false;
}

function bindDynamicParams(mysqli_stmt $stmt, string $types, array &$params): void {
    $bindings = [$types];
    foreach ($params as $index => $value) {
        $bindings[] = &$params[$index];
    }

    call_user_func_array([$stmt, 'bind_param'], $bindings);
}

function nextReferralId(mysqli $conn): int {
    $result = $conn->query('SELECT COALESCE(MAX(ReferralID), 0) + 1 AS next_id FROM referral');
    if (!$result) {
        return 1;
    }

    $row = $result->fetch_assoc();
    return (int)($row['next_id'] ?? 1);
}

function ensureReferralSchema(mysqli $conn): void {
    if (!tableExists($conn, 'referral')) {
        $create = "
            CREATE TABLE referral (
                ReferralID int NOT NULL,
                StudentID varchar(45) DEFAULT NULL,
                Grade varchar(45) DEFAULT NULL,
                Schedule varchar(45) DEFAULT NULL,
                Reason text,
                TeacherID varchar(45) DEFAULT NULL,
                case_table int DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        ";

        if (!$conn->query($create)) {
            send_json(500, ['success' => false, 'message' => 'Failed to create referral table: ' . $conn->error]);
        }
    }

    $columns = getColumns($conn, 'referral');
    $requiredColumns = [
        'referral_code' => 'ALTER TABLE referral ADD COLUMN referral_code VARCHAR(64) NULL AFTER ReferralID',
        'student_name' => 'ALTER TABLE referral ADD COLUMN student_name VARCHAR(255) NULL AFTER StudentID',
        'student_id' => 'ALTER TABLE referral ADD COLUMN student_id VARCHAR(45) NULL AFTER student_name',
        'section' => 'ALTER TABLE referral ADD COLUMN section VARCHAR(45) NULL AFTER Grade',
        'age' => 'ALTER TABLE referral ADD COLUMN age VARCHAR(45) NULL AFTER section',
        'gender' => 'ALTER TABLE referral ADD COLUMN gender VARCHAR(45) NULL AFTER age',
        'description' => 'ALTER TABLE referral ADD COLUMN description TEXT NULL AFTER Reason',
        'intervention_attempts' => 'ALTER TABLE referral ADD COLUMN intervention_attempts TEXT NULL AFTER description',
        'observed_behaviors' => 'ALTER TABLE referral ADD COLUMN observed_behaviors TEXT NULL AFTER intervention_attempts',
        'parent_guardian' => 'ALTER TABLE referral ADD COLUMN parent_guardian VARCHAR(255) NULL AFTER observed_behaviors',
        'parent_contact' => 'ALTER TABLE referral ADD COLUMN parent_contact VARCHAR(100) NULL AFTER parent_guardian',
        'parent_email' => 'ALTER TABLE referral ADD COLUMN parent_email VARCHAR(255) NULL AFTER parent_contact',
        'family_background' => 'ALTER TABLE referral ADD COLUMN family_background TEXT NULL AFTER parent_email',
        'urgency' => 'ALTER TABLE referral ADD COLUMN urgency VARCHAR(45) NOT NULL DEFAULT "normal" AFTER family_background',
        'teacher_id' => 'ALTER TABLE referral ADD COLUMN teacher_id VARCHAR(45) NULL AFTER TeacherID',
        'teacher_name' => 'ALTER TABLE referral ADD COLUMN teacher_name VARCHAR(255) NULL AFTER TeacherID',
        'school_attended' => 'ALTER TABLE referral ADD COLUMN school_attended VARCHAR(255) NULL AFTER teacher_name',
        'student_school' => 'ALTER TABLE referral ADD COLUMN student_school VARCHAR(255) NULL AFTER school_attended',
        'stage' => 'ALTER TABLE referral ADD COLUMN stage INT NOT NULL DEFAULT 1 AFTER student_school',
        'status' => 'ALTER TABLE referral ADD COLUMN status VARCHAR(45) NOT NULL DEFAULT "pending" AFTER stage',
        'date_submitted' => 'ALTER TABLE referral ADD COLUMN date_submitted DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER status',
        'updated_at' => 'ALTER TABLE referral ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER date_submitted'
    ];

    foreach ($requiredColumns as $columnName => $alterSql) {
        $legacyNames = [];
        if ($columnName === 'grade') {
            $legacyNames = ['Grade'];
        } elseif ($columnName === 'referral_reason') {
            $legacyNames = ['Reason'];
        } elseif ($columnName === 'teacher_id') {
            $legacyNames = ['TeacherID'];
        } elseif ($columnName === 'student_id') {
            $legacyNames = ['StudentID'];
        }

        if (!hasColumn($columns, $columnName, $legacyNames)) {
            if (!$conn->query($alterSql)) {
                send_json(500, [
                    'success' => false,
                    'message' => 'Failed to update referral schema: ' . $conn->error
                ]);
            }
        }
    }
}

function fetchReferralRows(mysqli $conn, string $sql, string $types = '', array $params = []): array {
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    }

    if ($types !== '') {
        bindDynamicParams($stmt, $types, $params);
    }

    if (!$stmt->execute()) {
        send_json(500, ['success' => false, 'message' => 'Execute failed: ' . $stmt->error]);
    }

    $result = $stmt->get_result();
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $row['id'] = (int)($row['id'] ?? 0);
        $row['stage'] = (int)($row['stage'] ?? 1);
        $rows[] = $row;
    }

    $stmt->close();
    return $rows;
}

try {
    ensureReferralSchema($conn);

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $role = trim((string)($_GET['role'] ?? ''));
        $school = trim((string)($_GET['school'] ?? ''));
        $userId = trim((string)($_GET['user_id'] ?? ''));
        $studentId = trim((string)($_GET['student_id'] ?? ''));
        $referralId = trim((string)($_GET['id'] ?? $_GET['referral_id'] ?? ''));
        $limit = (int)($_GET['limit'] ?? 0);

        $sql = "
            SELECT
                ReferralID AS id,
                referral_code,
                student_name,
                StudentID AS student_id,
                Grade AS grade,
                section,
                age,
                gender,
                Reason AS referral_reason,
                description,
                intervention_attempts,
                observed_behaviors,
                parent_guardian,
                parent_contact,
                parent_email,
                family_background,
                urgency,
                TeacherID AS teacher_id,
                teacher_name,
                school_attended,
                student_school,
                COALESCE(stage, 1) AS stage,
                COALESCE(status, 'pending') AS status,
                date_submitted,
                updated_at
            FROM referral
            WHERE 1=1
        ";
        $types = '';
        $params = [];

        if ($referralId !== '') {
            $sql .= ' AND (ReferralID = ? OR referral_code = ?)';
            $types .= 'ss';
            $params[] = $referralId;
            $params[] = $referralId;
        } elseif ($role === 'teacher' && $userId !== '') {
            $sql .= ' AND TeacherID = ?';
            $types .= 's';
            $params[] = $userId;
            if ($school !== '') {
                $sql .= ' AND (school_attended = ? OR student_school = ?)';
                $types .= 'ss';
                $params[] = $school;
                $params[] = $school;
            }
        } elseif (($role === 'counselor' || $role === 'coordinator' || $role === 'other-school') && $school !== '') {
            $sql .= ' AND (school_attended = ? OR student_school = ?)';
            $types .= 'ss';
            $params[] = $school;
            $params[] = $school;
        } elseif ($studentId !== '') {
            $sql .= ' AND (student_id = ? OR StudentID = ?)';
            $types .= 'ss';
            $params[] = $studentId;
            $params[] = $studentId;
        }

        $sql .= ' ORDER BY date_submitted DESC, ReferralID DESC';
        if ($limit > 0) {
            $sql .= ' LIMIT ' . (int)$limit;
        }

        $rows = fetchReferralRows($conn, $sql, $types, $params);

        send_json(200, [
            'success' => true,
            'data' => $rows,
            'count' => count($rows)
        ]);
    }

    if ($method === 'POST') {
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true);

        if (!is_array($payload)) {
            send_json(400, ['success' => false, 'message' => 'Invalid JSON payload']);
        }

        $studentId = trim((string)($payload['student_id'] ?? $payload['studentId'] ?? ''));
        $studentName = trim((string)($payload['student_name'] ?? $payload['studentName'] ?? ''));
        $grade = trim((string)($payload['grade'] ?? ''));
        $section = trim((string)($payload['section'] ?? ''));
        $age = trim((string)($payload['age'] ?? ''));
        $gender = trim((string)($payload['gender'] ?? ''));
        $referralReason = trim((string)($payload['referral_reason'] ?? $payload['referralReason'] ?? ''));
        $description = trim((string)($payload['description'] ?? ''));
        $interventionAttempts = trim((string)($payload['intervention_attempts'] ?? $payload['interventionAttempts'] ?? ''));
        $observedBehaviors = trim((string)($payload['observed_behaviors'] ?? $payload['observedBehaviors'] ?? ''));
        $parentGuardian = trim((string)($payload['parent_guardian'] ?? $payload['parentGuardian'] ?? ''));
        $parentContact = trim((string)($payload['parent_contact'] ?? $payload['parentContact'] ?? ''));
        $parentEmail = trim((string)($payload['parent_email'] ?? $payload['parentEmail'] ?? ''));
        $familyBackground = trim((string)($payload['family_background'] ?? $payload['familyBackground'] ?? ''));
        $urgency = trim((string)($payload['urgency'] ?? 'normal'));
        $teacherId = trim((string)($payload['teacher_id'] ?? $payload['teacherId'] ?? ''));
        $teacherName = trim((string)($payload['teacher_name'] ?? $payload['teacherName'] ?? ''));
        $schoolAttended = trim((string)($payload['school_attended'] ?? $payload['schoolAttended'] ?? ''));
        $studentSchool = trim((string)($payload['student_school'] ?? $payload['studentSchool'] ?? $schoolAttended));
        $stage = (int)($payload['stage'] ?? 1);
        $status = trim((string)($payload['status'] ?? 'pending'));

        if ($studentId === '') {
            $studentId = null;
        }

        if ($studentName === '' || $grade === '' || $referralReason === '' || $teacherName === '') {
            send_json(400, ['success' => false, 'message' => 'Missing required fields']);
        }

        if ($schoolAttended === '') {
            $schoolAttended = $studentSchool;
        }

        if ($schoolAttended === '' && $teacherId !== '') {
            $schoolLookup = $conn->prepare('SELECT school_attended FROM users_tables WHERE AccountID = ? LIMIT 1');
            if ($schoolLookup) {
                $teacherIdInt = (int)$teacherId;
                $schoolLookup->bind_param('i', $teacherIdInt);
                if ($schoolLookup->execute()) {
                    $result = $schoolLookup->get_result();
                    if ($row = $result->fetch_assoc()) {
                        $schoolAttended = trim((string)($row['school_attended'] ?? ''));
                    }
                }
                $schoolLookup->close();
            }
        }

        if ($schoolAttended === '') {
            send_json(400, ['success' => false, 'message' => 'School is required to save a referral']);
        }

        $referralCode = 'REF-' . date('YmdHis') . '-' . strtoupper(bin2hex(random_bytes(3)));
        $referralId = nextReferralId($conn);
        $dateSubmitted = date('Y-m-d H:i:s');

        $sql = "
            INSERT INTO referral (
                ReferralID,
                StudentID,
                Grade,
                Schedule,
                Reason,
                TeacherID,
                case_table,
                referral_code,
                student_name,
                student_id,
                section,
                age,
                gender,
                description,
                intervention_attempts,
                observed_behaviors,
                parent_guardian,
                parent_contact,
                parent_email,
                family_background,
                urgency,
                teacher_name,
                school_attended,
                student_school,
                stage,
                status,
                date_submitted,
                updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        ";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        }

        $caseTable = null;
        $params = [
            $referralId,
            $studentId,
            $grade,
            $dateSubmitted,
            $referralReason,
            $teacherId,
            $caseTable,
            $referralCode,
            $studentName,
            $studentId,
            $section,
            $age,
            $gender,
            $description,
            $interventionAttempts,
            $observedBehaviors,
            $parentGuardian,
            $parentContact,
            $parentEmail,
            $familyBackground,
            $urgency,
            $teacherName,
            $schoolAttended,
            $studentSchool,
            $stage,
            $status,
            $dateSubmitted,
            $dateSubmitted
        ];
        $types = str_repeat('s', count($params));

        bindDynamicParams($stmt, $types, $params);

        if (!$stmt->execute()) {
            send_json(500, ['success' => false, 'message' => 'Failed to save referral: ' . $stmt->error]);
        }

        $stmt->close();

        send_json(201, [
            'success' => true,
            'message' => 'Referral submitted successfully',
            'referral_id' => $referralId,
            'referral_code' => $referralCode,
            'data' => [
                'id' => $referralId,
                'referral_code' => $referralCode,
                'student_name' => $studentName,
                'student_id' => $studentId,
                'grade' => $grade,
                'section' => $section,
                'age' => $age,
                'gender' => $gender,
                'referral_reason' => $referralReason,
                'description' => $description,
                'intervention_attempts' => $interventionAttempts,
                'observed_behaviors' => $observedBehaviors,
                'parent_guardian' => $parentGuardian,
                'parent_contact' => $parentContact,
                'parent_email' => $parentEmail,
                'family_background' => $familyBackground,
                'urgency' => $urgency,
                'teacher_id' => $teacherId,
                'teacher_name' => $teacherName,
                'school_attended' => $schoolAttended,
                'student_school' => $studentSchool,
                'stage' => $stage,
                'status' => $status,
                'date_submitted' => $dateSubmitted
            ]
        ]);
    }

    send_json(405, ['success' => false, 'message' => 'Method not allowed']);
} catch (Throwable $e) {
    send_json(500, ['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>