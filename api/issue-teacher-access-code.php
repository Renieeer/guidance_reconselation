<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

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

// Only a school's own coordinator (or the combined counselor-and-coordinator
// role) may issue teacher access codes for that school — derived from the
// server-side session, never from client input, so this can't be spoofed by
// passing a different "school" in the request body.
$user = $_SESSION['user'] ?? null;
$allowedRoles = ['coordinator', 'counselor-and-coordinator'];
if (!$user || !in_array($user['role'] ?? '', $allowedRoles, true)) {
    send_json(403, ['success' => false, 'message' => 'Only a coordinator can issue teacher access codes.']);
}

$school = trim((string)($user['school'] ?? ''));
if ($school === '') {
    send_json(400, ['success' => false, 'message' => 'Your account has no school on file.']);
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);
$email = isset($data['email']) ? trim((string)$data['email']) : '';

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json(400, ['success' => false, 'message' => 'Enter a valid email address.']);
}

$issuedBy = isset($user['id']) ? (int)$user['id'] : null;
$result = issue_teacher_access_code($conn, $email, $school, $issuedBy);

send_json($result['success'] ? 200 : 429, $result);
