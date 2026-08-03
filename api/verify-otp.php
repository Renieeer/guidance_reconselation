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

    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        send_json(400, ['success' => false, 'message' => 'Invalid JSON payload']);
    }

    $email = trim((string)($payload['email'] ?? ''));
    $otp = trim((string)($payload['otp'] ?? ''));

    if ($email === '' || $otp === '') {
        send_json(400, ['success' => false, 'message' => 'Email and code are required']);
    }

    if (!preg_match('/^\d{6}$/', $otp)) {
        send_json(400, ['success' => false, 'message' => 'Code must be 6 digits']);
    }

    $result = verify_email_otp($conn, $email, $otp);

    send_json($result['success'] ? 200 : 400, $result);
} catch (Throwable $e) {
    send_json(500, ['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
