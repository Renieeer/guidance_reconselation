<?php
// Handles the multipart upload from the coordinator/counselor Documents
// page's "Upload Document" modal. See api/list-documents.php for the shared
// table shape and the student-id resolution this mirrors.
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

function ensure_documents_table(mysqli $conn): void {
    $sql = "
        CREATE TABLE IF NOT EXISTS documents (
            document_id INT NOT NULL AUTO_INCREMENT,
            student_id INT NOT NULL,
            document_type VARCHAR(30) NOT NULL,
            original_filename VARCHAR(255) NOT NULL,
            stored_filename VARCHAR(255) NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            file_size INT NOT NULL,
            school_attended VARCHAR(100) DEFAULT NULL,
            description TEXT,
            uploaded_by_id INT DEFAULT NULL,
            uploaded_by_role VARCHAR(30) DEFAULT NULL,
            uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (document_id),
            INDEX idx_student (student_id),
            INDEX idx_type (document_type),
            INDEX idx_school (school_attended)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    ";
    if (!$conn->query($sql)) {
        send_json(500, ['success' => false, 'message' => 'Failed to initialize documents table: ' . $conn->error]);
    }
}

function resolve_student_account_id(mysqli $conn, string $typedId): ?int {
    if (!ctype_digit($typedId)) {
        return null;
    }
    $idInt = (int)$typedId;

    $stmt = $conn->prepare("SELECT AccountID FROM users_tables WHERE AccountID = ? AND Type = 'student'");
    $stmt->bind_param('i', $idInt);
    $stmt->execute();
    $found = (bool)$stmt->get_result()->fetch_assoc();
    $stmt->close();
    if ($found) {
        return $idInt;
    }

    $stmt = $conn->prepare('SELECT AccountID FROM student_table WHERE StudentId = ?');
    $stmt->bind_param('s', $typedId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if ($row && ctype_digit((string)($row['AccountID'] ?? ''))) {
        return (int)$row['AccountID'];
    }

    return null;
}

const DOCUMENT_TYPES = ['inventory', 'referral', 'follow-up', 'case'];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // matches the "Max file size: 10MB" note in the upload form
const ALLOWED_MIME_EXTENSIONS = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/gif' => 'gif',
    'image/webp' => 'webp',
];

try {
    ensure_documents_table($conn);

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        send_json(405, ['success' => false, 'message' => 'Method not allowed']);
    }

    $typedStudentId = trim((string)($_POST['student_id'] ?? ''));
    $documentType = trim((string)($_POST['document_type'] ?? ''));
    $description = trim((string)($_POST['description'] ?? ''));
    $userType = trim((string)($_POST['user_type'] ?? ''));
    $school = trim((string)($_POST['school_attended'] ?? ''));
    $uploaderId = trim((string)($_POST['user_id'] ?? ''));

    if ($typedStudentId === '' || $documentType === '' || $school === '') {
        send_json(400, ['success' => false, 'message' => 'student_id, document_type, and school_attended are required']);
    }
    if (!in_array($documentType, DOCUMENT_TYPES, true)) {
        send_json(400, ['success' => false, 'message' => 'Invalid document_type']);
    }
    // Same loose staff-role check the rest of this codebase already relies
    // on (e.g. api/appointment-request.php's is_counselor_or_coordinator).
    if (strpos(strtolower($userType), 'coordinator') === false && strpos(strtolower($userType), 'counselor') === false) {
        send_json(403, ['success' => false, 'message' => 'Only guidance staff can upload documents']);
    }

    $studentAccountId = resolve_student_account_id($conn, $typedStudentId);
    if ($studentAccountId === null) {
        send_json(404, ['success' => false, 'message' => 'Student not found']);
    }

    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        $err = $_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE;
        $message = $err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE
            ? 'File is too large'
            : 'No file was uploaded';
        send_json(400, ['success' => false, 'message' => $message]);
    }

    $tmpPath = $_FILES['file']['tmp_name'];
    $fileSize = (int)$_FILES['file']['size'];
    if ($fileSize > MAX_FILE_BYTES) {
        send_json(400, ['success' => false, 'message' => 'File exceeds the 10MB limit']);
    }

    // Trust the file's actual bytes, not the client-supplied MIME type or
    // filename extension — both are trivially spoofable.
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $detectedMime = finfo_file($finfo, $tmpPath);
    finfo_close($finfo);

    if (!isset(ALLOWED_MIME_EXTENSIONS[$detectedMime])) {
        send_json(400, ['success' => false, 'message' => 'Only JPG, PNG, GIF, or WebP images are allowed']);
    }

    $originalFilename = basename((string)($_FILES['file']['name'] ?? 'document'));
    $extension = ALLOWED_MIME_EXTENSIONS[$detectedMime];
    $storedFilename = bin2hex(random_bytes(16)) . '.' . $extension;

    $uploadDir = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'documents';
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0755, true);
    }
    $destination = $uploadDir . DIRECTORY_SEPARATOR . $storedFilename;

    if (!move_uploaded_file($tmpPath, $destination)) {
        send_json(500, ['success' => false, 'message' => 'Failed to save uploaded file']);
    }

    $uploaderIdInt = ctype_digit($uploaderId) ? (int)$uploaderId : null;

    $stmt = $conn->prepare('
        INSERT INTO documents (student_id, document_type, original_filename, stored_filename, mime_type, file_size, school_attended, description, uploaded_by_id, uploaded_by_role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    if (!$stmt) {
        @unlink($destination);
        send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    }
    $stmt->bind_param(
        'issssissis',
        $studentAccountId,
        $documentType,
        $originalFilename,
        $storedFilename,
        $detectedMime,
        $fileSize,
        $school,
        $description,
        $uploaderIdInt,
        $userType
    );
    if (!$stmt->execute()) {
        @unlink($destination);
        send_json(500, ['success' => false, 'message' => 'Failed to save document record: ' . $stmt->error]);
    }
    $documentId = $stmt->insert_id;
    $stmt->close();

    send_json(201, [
        'success' => true,
        'message' => 'Document uploaded successfully',
        'data' => [
            'document_id' => $documentId,
            'student_id' => $studentAccountId,
            'document_type' => $documentType,
            'original_filename' => $originalFilename,
            'file_size' => $fileSize,
        ],
    ]);
} catch (Throwable $e) {
    send_json(500, ['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
