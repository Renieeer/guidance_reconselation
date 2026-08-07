<?php
// Streams a document's file bytes back — used directly as an <img src="...">
// by the Documents pages' preview modal, so this must NOT force a download
// (Content-Disposition: inline) and must respond with the file's real bytes,
// not JSON, on success.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'conn.php';

function send_json_error(int $statusCode, string $message): void {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        send_json_error(405, 'Method not allowed');
    }

    $documentId = (int)($_GET['document_id'] ?? 0);
    $userType = trim((string)($_GET['user_type'] ?? ''));
    $school = trim((string)($_GET['school_attended'] ?? ''));

    if ($documentId <= 0 || $school === '') {
        send_json_error(400, 'document_id and school_attended are required');
    }
    if (strpos(strtolower($userType), 'coordinator') === false && strpos(strtolower($userType), 'counselor') === false) {
        send_json_error(403, 'Only guidance staff can view documents');
    }

    $stmt = $conn->prepare('SELECT stored_filename, mime_type, original_filename, school_attended FROM documents WHERE document_id = ?');
    if (!$stmt) {
        send_json_error(500, 'Prepare failed: ' . $conn->error);
    }
    $stmt->bind_param('i', $documentId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        send_json_error(404, 'Document not found');
    }
    if ($row['school_attended'] !== $school) {
        send_json_error(403, "This document isn't from your school");
    }

    $filePath = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'documents' . DIRECTORY_SEPARATOR . $row['stored_filename'];
    if (!is_file($filePath)) {
        send_json_error(404, 'File is missing from storage');
    }

    header('Content-Type: ' . $row['mime_type']);
    header('Content-Length: ' . filesize($filePath));
    header('Content-Disposition: inline; filename="' . addslashes($row['original_filename']) . '"');
    header('Cache-Control: private, max-age=3600');
    readfile($filePath);
    exit;
} catch (Throwable $e) {
    send_json_error(500, 'Server error: ' . $e->getMessage());
}
