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

$transactionStarted = false;

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo json_encode([
            'success' => true,
            'assignments' => getAssignments($conn)
        ]);
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

    if (!in_array($assignType, ['coordinator', 'counselor', 'both'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid assignment type']);
        exit;
    }

    $schoolRecord = upsertSchoolRecord($conn, $schoolName, $assignType);

    $coordinator = normalizePerson($data['coordinator'] ?? []);
    $counselor = normalizePerson($data['counselor'] ?? []);

    if ($assignType === 'coordinator' || $assignType === 'both') {
        validatePerson($coordinator, 'Coordinator');
    }

    if ($assignType === 'counselor' || $assignType === 'both') {
        validatePerson($counselor, 'Counselor');
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
            'school' => $schoolRecord['school_name']
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
            'school' => $schoolRecord['school_name']
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
        'password' => (string)($person['password'] ?? '')
    ];
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

    $stmt = $conn->prepare('INSERT INTO users_tables (Password, Grade, First_name, Middle_name, Last_name, Type, email, school_attended) VALUES (?, NULL, ?, NULL, ?, ?, ?, ?)');
    if (!$stmt) {
        throw new RuntimeException('Failed to prepare user insert statement');
    }

    $stmt->bind_param(
        'ssssss',
        $hashedPassword,
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
        'school' => $input['school']
    ];
}

function getAssignments(mysqli $conn): array {
    $query = "SELECT
                s.school_code,
                s.school_name,
                s.assignment_type,
                COUNT(u.AccountID) AS totalAssigned,
                MAX(CASE WHEN u.Type = 'coordinator' THEN CONCAT(u.First_name, ' ', u.Last_name) END) AS coordinator_name,
                MAX(CASE WHEN u.Type = 'coordinator' THEN u.email END) AS coordinator_email,
                MAX(CASE WHEN u.Type = 'counselor' THEN CONCAT(u.First_name, ' ', u.Last_name) END) AS counselor_name,
                MAX(CASE WHEN u.Type = 'counselor' THEN u.email END) AS counselor_email
            FROM schools s
            LEFT JOIN users_tables u
                ON (u.school_attended = s.school_code OR u.school_attended = s.school_name)
                AND u.Type IN ('coordinator', 'counselor')
            WHERE s.is_active = 1
            GROUP BY s.school_code, s.school_name, s.assignment_type
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
            'coordinator' => $row['coordinator_name'] ? [
                'name' => $row['coordinator_name'],
                'email' => $row['coordinator_email']
            ] : null,
            'counselor' => $row['counselor_name'] ? [
                'name' => $row['counselor_name'],
                'email' => $row['counselor_email']
            ] : null,
            'totalAssigned' => (int)$row['totalAssigned']
        ];
    }

    return $assignments;
}

