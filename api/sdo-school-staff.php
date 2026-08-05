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
require_once 'school-config.php';
require_once 'grade-scope.php';
require_once 'account-status.php';

$transactionStarted = false;

try {
    ensure_users_table_grade_column($conn);
    ensure_users_table_active_column($conn);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo json_encode([
            'success' => true,
            'assignments' => getAssignments($conn)
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        $action = is_array($data) ? ($data['action'] ?? '') : '';

        if ($action === 'updateGrade') {
            $accountId = (int)($data['accountId'] ?? 0);
            $grade = normalizeGradeScopeInput($data['grade'] ?? '');

            if ($accountId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'accountId is required']);
                exit;
            }

            $stmt = $conn->prepare('UPDATE users_tables SET Grade = NULLIF(?, "") WHERE AccountID = ?');
            if (!$stmt) {
                throw new RuntimeException('Failed to prepare grade update statement');
            }
            $stmt->bind_param('si', $grade, $accountId);
            if (!$stmt->execute()) {
                $stmt->close();
                throw new RuntimeException('Failed to update grade assignment');
            }
            $stmt->close();

            echo json_encode(['success' => true, 'message' => 'Grade assignment updated.']);
            exit;
        }

        if ($action === 'revokeSchool') {
            $schoolCode = trim((string)($data['schoolCode'] ?? ''));

            if ($schoolCode === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'schoolCode is required']);
                exit;
            }

            $stmt = $conn->prepare('UPDATE schools SET is_active = 0 WHERE school_code = ?');
            if (!$stmt) {
                throw new RuntimeException('Failed to prepare school revoke statement');
            }
            $stmt->bind_param('s', $schoolCode);
            if (!$stmt->execute()) {
                $stmt->close();
                throw new RuntimeException('Failed to revoke school access');
            }
            $stmt->close();

            echo json_encode(['success' => true, 'message' => 'School access revoked.']);
            exit;
        }

        if ($action === 'setActive') {
            $accountId = (int)($data['accountId'] ?? 0);
            $active = !empty($data['active']) ? 1 : 0;

            if ($accountId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'accountId is required']);
                exit;
            }

            $stmt = $conn->prepare('UPDATE users_tables SET is_active = ? WHERE AccountID = ?');
            if (!$stmt) {
                throw new RuntimeException('Failed to prepare account status update statement');
            }
            $stmt->bind_param('ii', $active, $accountId);
            if (!$stmt->execute()) {
                $stmt->close();
                throw new RuntimeException('Failed to update account status');
            }
            $stmt->close();

            echo json_encode([
                'success' => true,
                'message' => $active ? 'Account activated.' : 'Account deactivated.'
            ]);
            exit;
        }

        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid request body']);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid request body']);
        exit;
    }

    $schoolName = trim((string)($data['schoolName'] ?? ''));
    $assignType = trim((string)($data['assignType'] ?? ''));

    if ($schoolName === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'School name is required']);
        exit;
    }

    if (!in_array($assignType, ['coordinator', 'counselor', 'both', 'combined'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid assignment type']);
        exit;
    }

    // schools.assignment_type only distinguishes coordinator/counselor/both;
    // "combined" (single counselor-and-coordinator login) still needs both
    // roles available at the school, so it maps onto 'both' there.
    $schoolAssignmentType = $assignType === 'combined' ? 'both' : $assignType;
    $schoolRecord = upsertSchoolRecord($conn, $schoolName, $schoolAssignmentType);

    $coordinator = normalizePerson($data['coordinator'] ?? []);
    $counselor = normalizePerson($data['counselor'] ?? []);
    $combined = normalizePerson($data['combined'] ?? []);

    if ($assignType === 'coordinator' || $assignType === 'both') {
        validatePerson($coordinator, 'Coordinator');
    }

    if ($assignType === 'counselor' || $assignType === 'both') {
        validatePerson($counselor, 'Counselor');
    }

    if ($assignType === 'combined') {
        validatePerson($combined, 'Combined coordinator/counselor');
    }

    if ($assignType === 'both' && strcasecmp($coordinator['email'], $counselor['email']) === 0) {
        throw new InvalidArgumentException('Coordinator and counselor must use different email addresses');
    }

    $conn->begin_transaction();
    $transactionStarted = true;

    $createdUsers = [];

    if ($assignType === 'coordinator' || $assignType === 'both') {
        ensureEmailAvailable($conn, $coordinator['email']);
        $createdUsers[] = createUser($conn, [
            'password' => $coordinator['password'],
            'firstName' => $coordinator['firstName'],
            'lastName' => $coordinator['lastName'],
            'email' => $coordinator['email'],
            'type' => 'coordinator',
            'school' => $schoolRecord['school_name'],
            'grade' => $coordinator['grade']
        ]);
    }

    if ($assignType === 'counselor' || $assignType === 'both') {
        ensureEmailAvailable($conn, $counselor['email']);
        $createdUsers[] = createUser($conn, [
            'password' => $counselor['password'],
            'firstName' => $counselor['firstName'],
            'lastName' => $counselor['lastName'],
            'email' => $counselor['email'],
            'type' => 'counselor',
            'school' => $schoolRecord['school_name'],
            'grade' => $counselor['grade']
        ]);
    }

    if ($assignType === 'combined') {
        ensureEmailAvailable($conn, $combined['email']);
        $createdUsers[] = createUser($conn, [
            'password' => $combined['password'],
            'firstName' => $combined['firstName'],
            'lastName' => $combined['lastName'],
            'email' => $combined['email'],
            'type' => 'counselor-and-coordinator',
            'school' => $schoolRecord['school_name'],
            'grade' => $combined['grade']
        ]);
    }

    $conn->commit();
    $transactionStarted = false;

    echo json_encode([
        'success' => true,
        'message' => 'School assignment saved successfully.',
        'createdUsers' => $createdUsers
    ]);
} catch (InvalidArgumentException $e) {
    if ($transactionStarted) {
        $conn->rollback();
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} catch (Throwable $e) {
    if ($transactionStarted) {
        $conn->rollback();
    }

    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to process request: ' . $e->getMessage()]);
}

function normalizePerson(array $person): array {
    return [
        'firstName' => trim((string)($person['firstName'] ?? '')),
        'lastName' => trim((string)($person['lastName'] ?? '')),
        'email' => strtolower(trim((string)($person['email'] ?? ''))),
        'password' => (string)($person['password'] ?? ''),
        'grade' => normalizeGradeScopeInput($person['grade'] ?? '')
    ];
}

// A grade scope is a comma-separated list of grade numbers 7-12 (e.g.
// "7", "11,12"), or "" for no restriction. Anything else collapses to "".
// Reuses the parser from grade-scope.php so this stays in sync with the
// filtering logic applied elsewhere.
function normalizeGradeScopeInput($raw): string {
    return implode(',', grade_scope_to_list((string)$raw));
}

function validatePerson(array $person, string $label): void {
    if ($person['firstName'] === '' || $person['lastName'] === '') {
        throw new InvalidArgumentException($label . ' first name and last name are required');
    }

    if (!filter_var($person['email'], FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException($label . ' email is invalid');
    }

    if (strlen($person['password']) < 8) {
        throw new InvalidArgumentException($label . ' password must be at least 8 characters');
    }
}

function ensureEmailAvailable(mysqli $conn, string $email): void {
    $check = $conn->prepare('SELECT AccountID FROM users_tables WHERE email = ? LIMIT 1');
    if (!$check) {
        throw new RuntimeException('Failed to prepare email check statement');
    }

    $check->bind_param('s', $email);
    $check->execute();
    $result = $check->get_result();
    $exists = $result->fetch_assoc();
    $check->close();

    if ($exists) {
        throw new InvalidArgumentException('Email already exists: ' . $email);
    }
}

function createUser(mysqli $conn, array $input): array {
    $hashedPassword = password_hash($input['password'], PASSWORD_BCRYPT);
    $grade = (string)($input['grade'] ?? '');

    // Middle_name is intentionally omitted — this table doesn't have that
    // column on every deployment of this schema and it was never populated
    // here anyway (always inserted as NULL).
    $stmt = $conn->prepare('INSERT INTO users_tables (Password, Grade, First_name, Last_name, Type, email, school_attended) VALUES (?, NULLIF(?, ""), ?, ?, ?, ?, ?)');
    if (!$stmt) {
        throw new RuntimeException('Failed to prepare user insert statement');
    }

    $stmt->bind_param(
        'sssssss',
        $hashedPassword,
        $grade,
        $input['firstName'],
        $input['lastName'],
        $input['type'],
        $input['email'],
        $input['school']
    );

    if (!$stmt->execute()) {
        $stmt->close();
        throw new RuntimeException('Failed to create user account');
    }

    $accountId = $stmt->insert_id;
    $stmt->close();

    return [
        'accountId' => $accountId,
        'name' => $input['firstName'] . ' ' . $input['lastName'],
        'email' => $input['email'],
        'role' => $input['type'],
        'school' => $input['school'],
        'grade' => $grade
    ];
}

function getAssignments(mysqli $conn): array {
    // Coordinators/counselors are listed one row per school in this view, so
    // only the first matching account of each type is surfaced here (a
    // school with several per-grade counselors will show one in this
    // summary table — the full list can still be queried directly if needed).
    $query = "SELECT
                s.school_code,
                s.school_name,
                s.assignment_type,
                s.district,
                COUNT(u.AccountID) AS totalAssigned,
                MAX(CASE WHEN u.Type = 'coordinator' THEN u.AccountID END) AS coordinator_id,
                MAX(CASE WHEN u.Type = 'coordinator' THEN CONCAT(u.First_name, ' ', u.Last_name) END) AS coordinator_name,
                MAX(CASE WHEN u.Type = 'coordinator' THEN u.email END) AS coordinator_email,
                MAX(CASE WHEN u.Type = 'coordinator' THEN u.Grade END) AS coordinator_grade,
                MAX(CASE WHEN u.Type = 'coordinator' THEN u.is_active END) AS coordinator_active,
                MAX(CASE WHEN u.Type = 'counselor' THEN u.AccountID END) AS counselor_id,
                MAX(CASE WHEN u.Type = 'counselor' THEN CONCAT(u.First_name, ' ', u.Last_name) END) AS counselor_name,
                MAX(CASE WHEN u.Type = 'counselor' THEN u.email END) AS counselor_email,
                MAX(CASE WHEN u.Type = 'counselor' THEN u.Grade END) AS counselor_grade,
                MAX(CASE WHEN u.Type = 'counselor' THEN u.is_active END) AS counselor_active,
                MAX(CASE WHEN u.Type = 'counselor-and-coordinator' THEN u.AccountID END) AS combined_id,
                MAX(CASE WHEN u.Type = 'counselor-and-coordinator' THEN CONCAT(u.First_name, ' ', u.Last_name) END) AS combined_name,
                MAX(CASE WHEN u.Type = 'counselor-and-coordinator' THEN u.email END) AS combined_email,
                MAX(CASE WHEN u.Type = 'counselor-and-coordinator' THEN u.Grade END) AS combined_grade,
                MAX(CASE WHEN u.Type = 'counselor-and-coordinator' THEN u.is_active END) AS combined_active
            FROM schools s
            LEFT JOIN users_tables u
                ON (u.school_attended = s.school_code OR u.school_attended = s.school_name)
                AND u.Type IN ('coordinator', 'counselor', 'counselor-and-coordinator')
            WHERE s.is_active = 1
            GROUP BY s.school_code, s.school_name, s.assignment_type, s.district
            ORDER BY s.school_name ASC";
    $result = $conn->query($query);

    if (!$result) {
        throw new RuntimeException('Failed to load assignments');
    }

    $assignments = [];

    while ($row = $result->fetch_assoc()) {
        $assignments[] = [
            'schoolName' => $row['school_name'],
            'schoolCode' => $row['school_code'],
            'assignmentType' => $row['assignment_type'],
            'district' => $row['district'],
            'coordinator' => $row['coordinator_name'] ? [
                'accountId' => (int)$row['coordinator_id'],
                'name' => $row['coordinator_name'],
                'email' => $row['coordinator_email'],
                'grade' => $row['coordinator_grade'],
                'active' => $row['coordinator_active'] === null ? true : (bool)((int)$row['coordinator_active'])
            ] : null,
            'counselor' => $row['counselor_name'] ? [
                'accountId' => (int)$row['counselor_id'],
                'name' => $row['counselor_name'],
                'email' => $row['counselor_email'],
                'grade' => $row['counselor_grade'],
                'active' => $row['counselor_active'] === null ? true : (bool)((int)$row['counselor_active'])
            ] : null,
            'combined' => $row['combined_name'] ? [
                'accountId' => (int)$row['combined_id'],
                'name' => $row['combined_name'],
                'email' => $row['combined_email'],
                'grade' => $row['combined_grade'],
                'active' => $row['combined_active'] === null ? true : (bool)((int)$row['combined_active'])
            ] : null,
            'totalAssigned' => (int)$row['totalAssigned']
        ];
    }

    return $assignments;
}

