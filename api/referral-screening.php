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

// Stage 2 (Initial Screening) interview notes — one row per screening
// session a counselor logs against a referral (interview, observations,
// risk level assessment, per the guidance office's intake flow).
function ensure_referral_screening_table(mysqli $conn): void {
    $conn->query("
        CREATE TABLE IF NOT EXISTS referral_screening (
            screening_id INT NOT NULL AUTO_INCREMENT,
            referral_id INT NOT NULL,
            counselor_id VARCHAR(45) DEFAULT NULL,
            counselor_name VARCHAR(150) DEFAULT NULL,
            interview_notes TEXT,
            observations TEXT,
            risk_level VARCHAR(20) DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (screening_id),
            KEY idx_referral_id (referral_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    ");
}

ensure_referral_screening_table($conn);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $referralId = (int)($_GET['referral_id'] ?? 0);
    if ($referralId <= 0) {
        send_json(400, ['success' => false, 'message' => 'referral_id is required']);
    }

    $stmt = $conn->prepare('
        SELECT screening_id, referral_id, counselor_id, counselor_name, interview_notes, observations, risk_level, created_at
        FROM referral_screening
        WHERE referral_id = ?
        ORDER BY created_at DESC, screening_id DESC
    ');
    if (!$stmt) {
        send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    }
    $stmt->bind_param('i', $referralId);
    if (!$stmt->execute()) {
        send_json(500, ['success' => false, 'message' => 'Execute failed: ' . $stmt->error]);
    }

    $result = $stmt->get_result();
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $row['screening_id'] = (int)$row['screening_id'];
        $row['referral_id'] = (int)$row['referral_id'];
        $rows[] = $row;
    }
    $stmt->close();

    send_json(200, ['success' => true, 'data' => $rows]);
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true);

    if (!is_array($body)) {
        send_json(400, ['success' => false, 'message' => 'Invalid JSON payload']);
    }

    $referralId = (int)($body['referral_id'] ?? 0);
    $counselorId = trim((string)($body['counselor_id'] ?? ''));
    $counselorName = trim((string)($body['counselor_name'] ?? ''));
    $interviewNotes = trim((string)($body['interview_notes'] ?? ''));
    $observations = trim((string)($body['observations'] ?? ''));
    $riskLevel = trim((string)($body['risk_level'] ?? ''));

    if ($referralId <= 0) {
        send_json(400, ['success' => false, 'message' => 'referral_id is required']);
    }

    if ($interviewNotes === '' && $observations === '') {
        send_json(400, ['success' => false, 'message' => 'Enter interview notes or observations before saving']);
    }

    $stmt = $conn->prepare('
        INSERT INTO referral_screening (referral_id, counselor_id, counselor_name, interview_notes, observations, risk_level)
        VALUES (?, ?, ?, ?, ?, ?)
    ');
    if (!$stmt) {
        send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    }
    $stmt->bind_param('isssss', $referralId, $counselorId, $counselorName, $interviewNotes, $observations, $riskLevel);
    if (!$stmt->execute()) {
        send_json(500, ['success' => false, 'message' => 'Failed to save screening notes: ' . $stmt->error]);
    }
    $screeningId = $stmt->insert_id;
    $stmt->close();

    send_json(201, [
        'success' => true,
        'message' => 'Screening notes saved.',
        'data' => ['screening_id' => $screeningId]
    ]);
}

send_json(405, ['success' => false, 'message' => 'Method not allowed']);
