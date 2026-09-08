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

// Stage 4 (Intervention) — which intervention activities were carried out
// for this referral, same shape/pattern as Stage 6's
// referral_acknowledgement.php. One row per referral (uniq_referral_id):
// saving again updates the same row instead of creating a new one.
function ensure_referral_intervention_table(mysqli $conn): void {
    $conn->query("
        CREATE TABLE IF NOT EXISTS referral_intervention (
            intervention_id INT NOT NULL AUTO_INCREMENT,
            referral_id INT NOT NULL,
            counselor_id VARCHAR(45) DEFAULT NULL,
            counselor_name VARCHAR(150) DEFAULT NULL,
            checklist_json TEXT,
            notes TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (intervention_id),
            UNIQUE KEY uniq_referral_id (referral_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    ");
}

ensure_referral_intervention_table($conn);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $referralId = (int)($_GET['referral_id'] ?? 0);
    if ($referralId <= 0) {
        send_json(400, ['success' => false, 'message' => 'referral_id is required']);
    }

    $stmt = $conn->prepare('
        SELECT intervention_id, referral_id, counselor_id, counselor_name, checklist_json, notes, created_at, updated_at
        FROM referral_intervention
        WHERE referral_id = ?
        LIMIT 1
    ');
    if (!$stmt) {
        send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    }
    $stmt->bind_param('i', $referralId);
    if (!$stmt->execute()) {
        send_json(500, ['success' => false, 'message' => 'Execute failed: ' . $stmt->error]);
    }

    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        send_json(200, ['success' => true, 'data' => null]);
    }

    $row['intervention_id'] = (int)$row['intervention_id'];
    $row['referral_id'] = (int)$row['referral_id'];
    $row['checklist'] = json_decode((string)($row['checklist_json'] ?? '{}'), true) ?: new stdClass();
    unset($row['checklist_json']);

    send_json(200, ['success' => true, 'data' => $row]);
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
    $notes = trim((string)($body['notes'] ?? ''));
    $checklist = is_array($body['checklist'] ?? null) ? $body['checklist'] : [];

    if ($referralId <= 0) {
        send_json(400, ['success' => false, 'message' => 'referral_id is required']);
    }

    $checklistJson = json_encode($checklist, JSON_UNESCAPED_UNICODE);

    $stmt = $conn->prepare('
        INSERT INTO referral_intervention (
            referral_id, counselor_id, counselor_name, checklist_json, notes
        ) VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            counselor_id = VALUES(counselor_id),
            counselor_name = VALUES(counselor_name),
            checklist_json = VALUES(checklist_json),
            notes = VALUES(notes)
    ');
    if (!$stmt) {
        send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    }
    $stmt->bind_param('issss', $referralId, $counselorId, $counselorName, $checklistJson, $notes);
    if (!$stmt->execute()) {
        send_json(500, ['success' => false, 'message' => 'Failed to save intervention: ' . $stmt->error]);
    }
    $stmt->close();

    send_json(200, ['success' => true, 'message' => 'Intervention activities saved.']);
}

send_json(405, ['success' => false, 'message' => 'Method not allowed']);
