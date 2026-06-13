<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, PUT, OPTIONS');
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

try {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);

    if (!is_array($payload)) {
        send_json(400, ['success' => false, 'message' => 'Invalid JSON payload']);
    }

    $referralId = trim((string)($payload['referral_id'] ?? $payload['id'] ?? ''));
    $stage = isset($payload['stage']) ? (int)$payload['stage'] : 0;
    $status = trim((string)($payload['status'] ?? ''));

    if ($referralId === '' || $stage <= 0 || $status === '') {
        send_json(400, ['success' => false, 'message' => 'Missing required fields']);
    }

    $stmt = $conn->prepare('UPDATE referral SET stage = ?, status = ?, updated_at = NOW() WHERE ReferralID = ? OR referral_code = ?');
    if (!$stmt) {
        send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    }

    $referralCode = $referralId;
    $stmt->bind_param('isss', $stage, $status, $referralId, $referralCode);

    if (!$stmt->execute()) {
        send_json(500, ['success' => false, 'message' => 'Update failed: ' . $stmt->error]);
    }

    $stmt->close();

    $fetch = $conn->prepare('SELECT ReferralID AS id, referral_code, student_name, StudentID AS student_id, Grade AS grade, section, age, gender, Reason AS referral_reason, description, intervention_attempts, observed_behaviors, parent_guardian, parent_contact, parent_email, family_background, urgency, TeacherID AS teacher_id, teacher_name, school_attended, student_school, stage, status, date_submitted, updated_at FROM referral WHERE ReferralID = ? OR referral_code = ? LIMIT 1');
    if (!$fetch) {
        send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    }

    $fetch->bind_param('ss', $referralId, $referralCode);
    if (!$fetch->execute()) {
        send_json(500, ['success' => false, 'message' => 'Fetch failed: ' . $fetch->error]);
    }

    $result = $fetch->get_result();
    $referral = $result ? $result->fetch_assoc() : null;
    $fetch->close();

    send_json(200, [
        'success' => true,
        'message' => 'Referral updated successfully',
        'referral' => $referral
    ]);
} catch (Throwable $e) {
    send_json(500, ['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>