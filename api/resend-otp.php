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
require_once 'email-verification.php';

function send_json(int $statusCode, array $payload): void {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        send_json(405, ['success' => false, 'message' => 'Method not allowed']);
    }

    ensure_email_verification_schema($conn);

    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        send_json(400, ['success' => false, 'message' => 'Invalid JSON payload']);
    }

    $email = trim((string)($payload['email'] ?? ''));
    if ($email === '') {
        send_json(400, ['success' => false, 'message' => 'Email is required']);
    }

    if (!is_mail_enabled()) {
        send_json(503, ['success' => false, 'message' => 'Email verification is not enabled for this system yet.']);
    }

    $stmt = $conn->prepare("SELECT First_name, Last_name, email_verified FROM users_tables WHERE email = ?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $account = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$account) {
        send_json(404, ['success' => false, 'message' => 'No account found with that email.']);
    }

    if ((int)$account['email_verified'] === 1) {
        send_json(200, ['success' => true, 'alreadyVerified' => true, 'message' => 'This email is already verified. You can log in now.']);
    }

    $fullName = trim($account['First_name'] . ' ' . $account['Last_name']);
    $result = generate_and_send_otp($conn, $email, $fullName);

    send_json($result['success'] ? 200 : 429, $result);
} catch (Throwable $e) {
    send_json(500, ['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
