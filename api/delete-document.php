<?php

// Include database connection
include 'conn.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Only POST requests allowed']);
    exit;
}

// Get parameters
$data = json_decode(file_get_contents('php://input'), true);
$documentId = intval($data['document_id'] ?? 0);
$userType = htmlspecialchars($data['user_type'] ?? '');
$userSchool = htmlspecialchars($data['school_attended'] ?? '');
$userId = intval($data['user_id'] ?? 0);

if (!$documentId || !$userType || !$userId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
    exit;
}

// Get document info
$query = "SELECT * FROM document_library WHERE document_id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param('i', $documentId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Document not found']);
    exit;
}

$document = $result->fetch_assoc();
$stmt->close();

// Delete permission check
$canDelete = false;

// Only coordinator and above can delete
if ($userType === 'coordinator' && $document['school_attended'] === $userSchool) {
    // Coordinator can delete from own school
    $canDelete = true;
} elseif ($userType === 'sdo') {
    // SDO can delete any document
    $canDelete = true;
}

if (!$canDelete) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You do not have permission to delete this document']);
    exit;
}

// Delete file from server
$filePath = __DIR__ . '/../' . $document['file_path'];
if (file_exists($filePath)) {
    if (!unlink($filePath)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete file from server']);
        exit;
    }
}

// Delete record from database
$deleteQuery = "DELETE FROM document_library WHERE document_id = ?";
$deleteStmt = $conn->prepare($deleteQuery);
$deleteStmt->bind_param('i', $documentId);

if ($deleteStmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Document deleted successfully',
        'rows_affected' => $conn->affected_rows
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to delete document from database']);
}

$deleteStmt->close();
$conn->close();
?>
