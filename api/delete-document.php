<?php
// Deletes a document's DB row and its file on disk together — see
// api/list-documents.php for the shared table shape.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        send_json(405, ['success' => false, 'message' => 'Method not allowed']);
    }

    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        send_json(400, ['success' => false, 'message' => 'Invalid JSON payload']);
    }

    $documentId = (int)($payload['document_id'] ?? 0);
    $userType = trim((string)($payload['user_type'] ?? ''));
    $school = trim((string)($payload['school_attended'] ?? ''));

    if ($documentId <= 0 || $school === '') {
        send_json(400, ['success' => false, 'message' => 'document_id and school_attended are required']);
    }
    if (strpos(strtolower($userType), 'coordinator') === false && strpos(strtolower($userType), 'counselor') === false) {
        send_json(403, ['success' => false, 'message' => 'Only guidance staff can delete documents']);
    }

    $stmt = $conn->prepare('SELECT stored_filename, school_attended FROM documents WHERE document_id = ?');
    if (!$stmt) {
        send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    }
    $stmt->bind_param('i', $documentId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        send_json(404, ['success' => false, 'message' => 'Document not found']);
    }
    if ($row['school_attended'] !== $school) {
        send_json(403, ['success' => false, 'message' => "This document isn't from your school"]);
    }

    $deleteStmt = $conn->prepare('DELETE FROM documents WHERE document_id = ?');
    $deleteStmt->bind_param('i', $documentId);
    if (!$deleteStmt->execute()) {
        send_json(500, ['success' => false, 'message' => 'Failed to delete document record: ' . $deleteStmt->error]);
    }
    $deleteStmt->close();

    $filePath = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'documents' . DIRECTORY_SEPARATOR . $row['stored_filename'];
    if (is_file($filePath)) {
        @unlink($filePath);
    }

    send_json(200, ['success' => true, 'message' => 'Document deleted successfully']);
} catch (Throwable $e) {
    send_json(500, ['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
