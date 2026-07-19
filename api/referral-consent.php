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

// Stage 3 (Parent Consent) uploads — the signed consent form for
// assessment & interventions, filed against the referral it belongs to.
// Files live outside webroot execution reach via uploads/consent-forms/.htaccess
// (blocks script execution + directory listing) and are re-named on disk so
// the original filename never controls a path.
$consentUploadDir = __DIR__ . '/../uploads/consent-forms/';
$consentPublicPath = '/guidancemanagment/uploads/consent-forms/';
$consentAllowedExt = ['pdf', 'jpg', 'jpeg', 'png'];
$consentMaxBytes = 5 * 1024 * 1024; // 5 MB

function ensure_referral_consent_table(mysqli $conn): void {
    $conn->query("
        CREATE TABLE IF NOT EXISTS referral_consent (
            consent_id INT NOT NULL AUTO_INCREMENT,
            referral_id INT NOT NULL,
            original_filename VARCHAR(255) NOT NULL,
            stored_filename VARCHAR(255) NOT NULL,
            file_size INT DEFAULT NULL,
            uploaded_by VARCHAR(150) DEFAULT NULL,
            uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (consent_id),
            KEY idx_referral_id (referral_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    ");
}

ensure_referral_consent_table($conn);

if (!is_dir($consentUploadDir)) {
    mkdir($consentUploadDir, 0755, true);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $referralId = (int)($_GET['referral_id'] ?? 0);
    if ($referralId <= 0) {
        send_json(400, ['success' => false, 'message' => 'referral_id is required']);
    }

    $stmt = $conn->prepare('
        SELECT consent_id, referral_id, original_filename, stored_filename, file_size, uploaded_by, uploaded_at
        FROM referral_consent
        WHERE referral_id = ?
        ORDER BY uploaded_at DESC, consent_id DESC
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
        $rows[] = [
            'consentId' => (int)$row['consent_id'],
            'referralId' => (int)$row['referral_id'],
            'fileName' => $row['original_filename'],
            'fileSize' => (int)$row['file_size'],
            'uploadedBy' => $row['uploaded_by'],
            'uploadedAt' => $row['uploaded_at'],
            'url' => $consentPublicPath . rawurlencode($row['stored_filename'])
        ];
    }
    $stmt->close();

    send_json(200, ['success' => true, 'data' => $rows]);
}

if ($method === 'POST') {
    $referralId = (int)($_POST['referral_id'] ?? 0);
    $uploadedBy = trim((string)($_POST['uploaded_by'] ?? ''));

    if ($referralId <= 0) {
        send_json(400, ['success' => false, 'message' => 'referral_id is required']);
    }

    if (!isset($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
        send_json(400, ['success' => false, 'message' => 'No file was uploaded']);
    }

    $file = $_FILES['file'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        send_json(400, ['success' => false, 'message' => 'Upload failed (error code ' . $file['error'] . ')']);
    }

    if ($file['size'] > $consentMaxBytes) {
        send_json(400, ['success' => false, 'message' => 'File is too large. Maximum size is 5 MB.']);
    }

    if (!is_uploaded_file($file['tmp_name'])) {
        send_json(400, ['success' => false, 'message' => 'Invalid upload']);
    }

    $originalName = basename($file['name']);
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

    if (!in_array($ext, $consentAllowedExt, true)) {
        send_json(400, ['success' => false, 'message' => 'Only PDF, JPG, and PNG files are allowed.']);
    }

    $storedFilename = 'consent_' . $referralId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $destination = $consentUploadDir . $storedFilename;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        send_json(500, ['success' => false, 'message' => 'Failed to save the uploaded file']);
    }

    $fileSize = (int)$file['size'];

    $stmt = $conn->prepare('
        INSERT INTO referral_consent (referral_id, original_filename, stored_filename, file_size, uploaded_by)
        VALUES (?, ?, ?, ?, ?)
    ');
    if (!$stmt) {
        send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    }
    $stmt->bind_param('issis', $referralId, $originalName, $storedFilename, $fileSize, $uploadedBy);
    if (!$stmt->execute()) {
        send_json(500, ['success' => false, 'message' => 'Failed to record upload: ' . $stmt->error]);
    }
    $consentId = $stmt->insert_id;
    $stmt->close();

    send_json(201, [
        'success' => true,
        'message' => 'Consent form uploaded.',
        'data' => [
            'consentId' => $consentId,
            'fileName' => $originalName,
            'fileSize' => $fileSize,
            'uploadedBy' => $uploadedBy,
            'url' => $consentPublicPath . rawurlencode($storedFilename)
        ]
    ]);
}

send_json(405, ['success' => false, 'message' => 'Method not allowed']);
