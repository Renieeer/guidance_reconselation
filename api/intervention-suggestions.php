<?php
// Stage 4's "Other Intervention" autocomplete — see
// pages/counselor/referral-status.js's loadInterventionSuggestions() and
// api/referral-intervention.php's POST handler, which is what actually
// grows this list via record_intervention_usage().
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'conn.php';
require_once 'intervention-suggestions-schema.php';

function send_json(int $statusCode, array $payload): void {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

ensure_intervention_suggestions_tables($conn);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json(405, ['success' => false, 'message' => 'Method not allowed']);
}

// Stage 4 automatically uses the referral's own Reason for Referral — the
// counselor never re-picks a reason here, see loadIntervention() in
// referral-status.js.
$referralId = (int)($_GET['referral_id'] ?? 0);
if ($referralId <= 0) {
    send_json(400, ['success' => false, 'message' => 'referral_id is required']);
}

$stmt = $conn->prepare('SELECT Reason FROM referral WHERE ReferralID = ?');
if (!$stmt) {
    send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
}
$stmt->bind_param('i', $referralId);
$stmt->execute();
$referral = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$referral) {
    send_json(404, ['success' => false, 'message' => 'Referral not found']);
}

$reasons = split_referral_reasons($referral['Reason'] ?? '');

if (empty($reasons)) {
    // No structured reasons to match against (e.g. a referral saved before
    // the reason checklist existed) — fall back to the overall most-used
    // suggestions rather than showing nothing.
    $stmt = $conn->prepare("SELECT InterventionID, InterventionName, UsageCount FROM intervention_suggestions WHERE Status = 'active' ORDER BY UsageCount DESC, InterventionName ASC LIMIT 50");
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $placeholders = implode(',', array_fill(0, count($reasons), '?'));
    $types = str_repeat('s', count($reasons));
    $stmt = $conn->prepare("
        SELECT s.InterventionID, s.InterventionName, s.UsageCount
        FROM intervention_suggestions s
        INNER JOIN intervention_reason_map m ON m.InterventionID = s.InterventionID
        WHERE m.ReasonName IN ($placeholders) AND s.Status = 'active'
        GROUP BY s.InterventionID, s.InterventionName, s.UsageCount
        ORDER BY s.UsageCount DESC, s.InterventionName ASC
        LIMIT 50
    ");
    if (!$stmt) {
        send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    }
    $stmt->bind_param($types, ...$reasons);
    $stmt->execute();
    $result = $stmt->get_result();
}

$suggestions = [];
while ($row = $result->fetch_assoc()) {
    $suggestions[] = [
        'id' => (int)$row['InterventionID'],
        'name' => $row['InterventionName'],
        'usageCount' => (int)$row['UsageCount']
    ];
}
$stmt->close();

send_json(200, [
    'success' => true,
    'data' => $suggestions,
    'reasons' => $reasons
]);
