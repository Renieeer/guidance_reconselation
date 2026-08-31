<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'conn.php';
require_once 'teacher-access-config.php';
require_once 'email-verification.php';

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
if (!is_array($data)) {
    send_json(400, ['success' => false, 'message' => 'Invalid JSON payload']);
}

$code = trim((string)($data['code'] ?? ''));
$firstName = trim((string)($data['firstName'] ?? ''));
$lastName = trim((string)($data['lastName'] ?? ''));
$email = trim((string)($data['email'] ?? ''));
$password = (string)($data['password'] ?? '');

if ($code === '' || $firstName === '' || $lastName === '' || $email === '' || $password === '') {
    send_json(400, ['success' => false, 'message' => 'All fields are required.']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json(400, ['success' => false, 'message' => 'Invalid email format.']);
}

if (!teacher_password_is_strong($password)) {
    send_json(400, ['success' => false, 'message' => 'Password does not meet security requirements.']);
}

// Access code is checked before anything else touches this email — an OTP
// is never sent (and no account state is revealed) to an address that
// wasn't actually authorized by a coordinator for this exact email.
$accessCode = find_valid_teacher_access_code($conn, $email, $code);
if (!$accessCode) {
    send_json(401, ['success' => false, 'message' => 'Invalid or expired access code.']);
}

if (!is_mail_enabled()) {
    send_json(503, ['success' => false, 'message' => 'Email verification is not enabled for this system yet. Contact your SDO.']);
}

// Same generic success response whether the email is free or already
// registered, and nothing is sent — this form can't be used to enumerate
// existing accounts.
$checkStmt = $conn->prepare("SELECT AccountID FROM users_tables WHERE email = ?");
$checkStmt->bind_param('s', $email);
$checkStmt->execute();
$exists = $checkStmt->get_result()->fetch_assoc();
$checkStmt->close();

if ($exists) {
    send_json(200, [
        'success' => true,
        'needsVerification' => true,
        'email' => $email,
        'message' => 'If this email can be registered, a verification code has been sent to it.'
    ]);
}

$hashedPassword = password_hash($password, PASSWORD_BCRYPT);
save_pending_registration($conn, $email, $firstName, $lastName, $hashedPassword, 'teacher', $accessCode['school']);

$fullName = trim($firstName . ' ' . $lastName);
$otpResult = generate_and_send_otp($conn, $email, $fullName);

send_json(200, [
    'success' => true,
    'needsVerification' => true,
    'email' => $email,
    'message' => $otpResult['emailSent']
        ? 'Please check your email for a 6-digit verification code to finish creating your account.'
        : 'We could not send a verification email right now. Please contact your school administrator.'
]);
