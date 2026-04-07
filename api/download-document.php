<?php

// Include database connection
include 'conn.php';

// Get parameters
$documentId = intval($_GET['document_id'] ?? 0);
$userType = htmlspecialchars($_GET['user_type'] ?? '');
$userSchool = htmlspecialchars($_GET['school_attended'] ?? '');
$userId = intval($_GET['user_id'] ?? 0);

if (!$documentId || !$userType) {
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

// Access control
$hasAccess = false;

if ($userType === 'student' && $document['student_id'] === $_GET['student_id'] ?? '') {
    // Student can only view own documents
    $hasAccess = true;
} elseif ($userType === 'counselor' || $userType === 'coordinator') {
    // Can view documents from students in same school
    if ($document['school_attended'] === $userSchool) {
        $hasAccess = true;
    }
} elseif ($userType === 'sdo') {
    // SDO can view all documents
    $hasAccess = true;
}

if (!$hasAccess) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

// Serve the file
$filePath = __DIR__ . '/../' . $document['file_path'];

if (!file_exists($filePath)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'File not found on server']);
    exit;
}

// Return document info or download
if (isset($_GET['action']) && $_GET['action'] === 'download') {
    // Download file
    header('Content-Type: ' . $document['mime_type']);
    header('Content-Disposition: attachment; filename="' . $document['original_filename'] . '"');
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath);
} else {
    // View as image
    header('Content-Type: ' . $document['mime_type']);
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath);
}

$conn->close();
?>
