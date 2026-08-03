<?php
// Manual resend of an appointment notification email — e.g. a "Resend
// email" button for staff if a student says they never got the original,
// or for testing the mail-config.php setup without changing an appointment's
// status just to trigger a real one.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'conn.php';
require_once 'notify-appointment.php';

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

    $requestId = trim((string)($payload['request_id'] ?? ''));
    $event = trim((string)($payload['event'] ?? ''));

    if ($requestId === '' || $event === '') {
        send_json(400, ['success' => false, 'message' => 'request_id and event are required']);
    }

    $result = notify_appointment_email($conn, $requestId, $event);

    send_json($result['success'] ? 200 : 502, [
        'success' => $result['success'],
        'message' => $result['message']
    ]);
} catch (Throwable $e) {
    send_json(500, ['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
