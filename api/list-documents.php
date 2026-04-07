<?php

// Include database connection
include 'conn.php';

// Check if user is authenticated (adjusted for sessionStorage in frontend)
$studentId = htmlspecialchars($_GET['student_id'] ?? '');
$userType = htmlspecialchars($_GET['user_type'] ?? '');
$schoolAttended = htmlspecialchars($_GET['school_attended'] ?? '');

if (!$studentId || !$userType || !$schoolAttended) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
    exit;
}

// Build access control query based on user type
$query = "SELECT 
    document_id, 
    student_id, 
    document_type, 
    original_filename, 
    file_size, 
    uploaded_at,
    description
FROM document_library 
WHERE student_id = ?";

$params = [$studentId];
$types = 's';

// Access control based on user type
switch ($userType) {
    case 'student':
        // Students can only see their own documents
        break;
    case 'counselor':
    case 'coordinator':
        // Can view student documents from same school
        $query .= " AND school_attended = ?";
        $params[] = $schoolAttended;
        $types .= 's';
        break;
    case 'sdo':
        // SDO can view all documents (no additional filter)
        break;
    default:
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Invalid user type']);
        exit;
}

$query .= " ORDER BY uploaded_at DESC";

$stmt = $conn->prepare($query);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
    exit;
}

$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

$documents = [];
while ($row = $result->fetch_assoc()) {
    $documents[] = $row;
}

echo json_encode([
    'success' => true,
    'count' => count($documents),
    'documents' => $documents
]);

$stmt->close();
$conn->close();
?>
