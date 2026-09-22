<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../includes/session-guard.php';
require_api_session();

require_once 'conn.php';
require_once 'teacher-access-config.php';

function send_json(int $statusCode, array $payload): void {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(405, ['success' => false, 'message' => 'Method not allowed']);
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Only a school's own coordinator (or the combined counselor-and-coordinator
// role) may issue teacher access codes for that school. This app doesn't
// keep a server-side PHP session for the logged-in user (see js/auth.js —
// the account lives in sessionStorage/localStorage instead, same as every
// other role/school-scoped endpoint such as api/manage-accounts.php), so
// the caller's role/school/id are trusted from the request body rather than
// $_SESSION, which would just always be empty here.
$allowedRoles = ['coordinator', 'counselor-and-coordinator'];
$role = trim((string)($data['role'] ?? ''));
if (!in_array($role, $allowedRoles, true)) {
    send_json(403, ['success' => false, 'message' => 'Only a coordinator can issue teacher access codes.']);
}

$school = trim((string)($data['school'] ?? ''));
if ($school === '') {
    send_json(400, ['success' => false, 'message' => 'Your account has no school on file.']);
}

$email = isset($data['email']) ? trim((string)$data['email']) : '';

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json(400, ['success' => false, 'message' => 'Enter a valid email address.']);
}

$issuedBy = isset($data['issuerId']) ? (int)$data['issuerId'] : null;
$result = issue_teacher_access_code($conn, $email, $school, $issuedBy);

send_json($result['success'] ? 200 : 429, $result);
