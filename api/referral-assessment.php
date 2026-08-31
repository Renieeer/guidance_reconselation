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

// Stage 2 (Initial Risk Assessment) uploads — the completed assessment
// document a counselor attaches for a referral, same shape as Stage 3's
// referral_consent.php but a separate table/folder since they belong to
// different stages. Files live outside webroot execution reach via
// uploads/assessment-documents/.htaccess (blocks script execution +
// directory listing, written out below if missing) and are re-named on
// disk so the original filename never controls a path.
$assessmentUploadDir = __DIR__ . '/../uploads/assessment-documents/';
// Relative (not root-relative) so it resolves correctly regardless of
// whether the app is served from a /guidancemanagment/ subfolder or its
// own vhost root — every page that renders this link lives two levels
// down at pages/<role>/*.php.
$assessmentPublicPath = '../../uploads/assessment-documents/';
$assessmentAllowedExt = ['pdf', 'jpg', 'jpeg', 'png'];
$assessmentMaxBytes = 5 * 1024 * 1024; // 5 MB

function ensure_referral_assessment_table(mysqli $conn): void {
    $conn->query("
        CREATE TABLE IF NOT EXISTS referral_assessment (
            assessment_id INT NOT NULL AUTO_INCREMENT,
            referral_id INT NOT NULL,
            original_filename VARCHAR(255) NOT NULL,
            stored_filename VARCHAR(255) NOT NULL,
            file_size INT DEFAULT NULL,
            uploaded_by VARCHAR(150) DEFAULT NULL,
            uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (assessment_id),
            KEY idx_referral_id (referral_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    ");
}

ensure_referral_assessment_table($conn);

if (!is_dir($assessmentUploadDir)) {
    mkdir($assessmentUploadDir, 0755, true);
}

$assessmentHtaccess = $assessmentUploadDir . '.htaccess';
if (!file_exists($assessmentHtaccess)) {
    file_put_contents($assessmentHtaccess, "Options -Indexes\n\n<FilesMatch \"\\.(php|phtml|php3|php4|php5|pl|py|jsp|asp|aspx|sh|cgi|exe)$\">\n    <IfModule mod_authz_core.c>\n        Require all denied\n    </IfModule>\n    <IfModule !mod_authz_core.c>\n        Order allow,deny\n        Deny from all\n    </IfModule>\n</FilesMatch>\n");
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $referralId = (int)($_GET['referral_id'] ?? 0);
    if ($referralId <= 0) {
        send_json(400, ['success' => false, 'message' => 'referral_id is required']);
    }

    $stmt = $conn->prepare('
        SELECT assessment_id, referral_id, original_filename, stored_filename, file_size, uploaded_by, uploaded_at
        FROM referral_assessment
        WHERE referral_id = ?
        ORDER BY uploaded_at DESC, assessment_id DESC
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
            'assessmentId' => (int)$row['assessment_id'],
            'referralId' => (int)$row['referral_id'],
            'fileName' => $row['original_filename'],
            'fileSize' => (int)$row['file_size'],
            'uploadedBy' => $row['uploaded_by'],
            'uploadedAt' => $row['uploaded_at'],
            'url' => $assessmentPublicPath . rawurlencode($row['stored_filename'])
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

    if ($file['size'] > $assessmentMaxBytes) {
        send_json(400, ['success' => false, 'message' => 'File is too large. Maximum size is 5 MB.']);
    }

    if (!is_uploaded_file($file['tmp_name'])) {
        send_json(400, ['success' => false, 'message' => 'Invalid upload']);
    }

    $originalName = basename($file['name']);
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

    if (!in_array($ext, $assessmentAllowedExt, true)) {
        send_json(400, ['success' => false, 'message' => 'Only PDF, JPG, and PNG files are allowed.']);
    }

    $storedFilename = 'assessment_' . $referralId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $destination = $assessmentUploadDir . $storedFilename;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        send_json(500, ['success' => false, 'message' => 'Failed to save the uploaded file']);
    }

    $fileSize = (int)$file['size'];

    $stmt = $conn->prepare('
        INSERT INTO referral_assessment (referral_id, original_filename, stored_filename, file_size, uploaded_by)
        VALUES (?, ?, ?, ?, ?)
    ');
    if (!$stmt) {
        send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    }
    $stmt->bind_param('issis', $referralId, $originalName, $storedFilename, $fileSize, $uploadedBy);
    if (!$stmt->execute()) {
        send_json(500, ['success' => false, 'message' => 'Failed to record upload: ' . $stmt->error]);
    }
    $assessmentId = $stmt->insert_id;
    $stmt->close();

    send_json(201, [
        'success' => true,
        'message' => 'Assessment document uploaded.',
        'data' => [
            'assessmentId' => $assessmentId,
            'fileName' => $originalName,
            'fileSize' => $fileSize,
            'uploadedBy' => $uploadedBy,
            'url' => $assessmentPublicPath . rawurlencode($storedFilename)
        ]
    ]);
}

send_json(405, ['success' => false, 'message' => 'Method not allowed']);
