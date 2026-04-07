<?php

// Include database connection
include 'conn.php';

// Check if user is authenticated
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Only POST requests allowed']);
    exit;
}

// Validate required fields
if (!isset($_FILES['file']) || !isset($_POST['student_id']) || !isset($_POST['document_type'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$studentId = htmlspecialchars($_POST['student_id']);
$documentType = htmlspecialchars($_POST['document_type']);
$description = htmlspecialchars($_POST['description'] ?? '');
$uploadedBy = $_SESSION['user_id'];
$schoolAttended = htmlspecialchars($_SESSION['school_attended'] ?? '');

// Validate document type
$validTypes = ['inventory', 'referral', 'follow-up', 'case'];
if (!in_array($documentType, $validTypes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid document type']);
    exit;
}

// Validate file
$file = $_FILES['file'];
$allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$maxFileSize = 10 * 1024 * 1024; // 10MB

if (!in_array($file['type'], $allowedMimes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid file type. Only images allowed (JPG, PNG, GIF, WebP)']);
    exit;
}

if ($file['size'] > $maxFileSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'File size exceeds 10MB limit']);
    exit;
}

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'File upload error: ' . $file['error']]);
    exit;
}

// Create upload directory structure
$baseUploadDir = __DIR__ . '/../uploads/student/' . $studentId . '/' . $documentType;
if (!is_dir($baseUploadDir)) {
    if (!mkdir($baseUploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create upload directory']);
        exit;
    }
}

// Generate unique filename with timestamp
$fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$storedFilename = date('Y-m-d_H-i-s') . '_' . uniqid() . '.' . $fileExtension;
$filePath = $baseUploadDir . '/' . $storedFilename;
$relativePath = 'uploads/student/' . $studentId . '/' . $documentType . '/' . $storedFilename;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $filePath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save file']);
    exit;
}

// Insert into database
$query = "INSERT INTO document_library (
    student_id, document_type, original_filename, stored_filename, file_path, 
    file_size, mime_type, uploaded_by, school_attended, description, access_level
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($query);
if (!$stmt) {
    unlink($filePath); // Delete uploaded file if DB insert fails
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
    exit;
}

$accessLevel = 'coordinator'; // Default access level
$originalFilename = htmlspecialchars($file['name']);

$stmt->bind_param(
    'sssssisisis',
    $studentId,
    $documentType,
    $originalFilename,
    $storedFilename,
    $relativePath,
    $file['size'],
    $file['type'],
    $uploadedBy,
    $schoolAttended,
    $description,
    $accessLevel
);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Document uploaded successfully',
        'document_id' => $conn->insert_id,
        'file_path' => $relativePath,
        'file_name' => $storedFilename
    ]);
} else {
    unlink($filePath); // Delete uploaded file if DB insert fails
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save document info: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
