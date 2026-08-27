<?php
// Lists uploaded documents for one student — see api/upload-document.php,
// api/download-document.php, api/delete-document.php for the rest of the
// 1.4 "Uploaded related documents" feature these four files implement.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

// Staff may type either a users_tables.AccountID or a student_table.StudentId
// (usually the same value in this app) — resolve both the same way
// api/feedback.php's resolve_appointment_candidate_ids() already does.
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

try {
    ensure_documents_table($conn);

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        send_json(405, ['success' => false, 'message' => 'Method not allowed']);
    }

    $typedStudentId = trim((string)($_GET['student_id'] ?? ''));
    $school = trim((string)($_GET['school_attended'] ?? ''));

    if ($typedStudentId === '' || $school === '') {
        send_json(400, ['success' => false, 'message' => 'student_id and school_attended are required']);
    }

    $studentAccountId = resolve_student_account_id($conn, $typedStudentId);
    if ($studentAccountId === null) {
        // Unknown student — not an error, just nothing to show.
        send_json(200, ['success' => true, 'documents' => []]);
    }

    $stmt = $conn->prepare('
        SELECT document_id, student_id, document_type, original_filename, file_size, description, uploaded_at
        FROM documents
        WHERE student_id = ? AND school_attended = ?
        ORDER BY uploaded_at DESC
    ');
    if (!$stmt) {
        send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    }
    $stmt->bind_param('is', $studentAccountId, $school);
    if (!$stmt->execute()) {
        send_json(500, ['success' => false, 'message' => 'Execute failed: ' . $stmt->error]);
    }
    $result = $stmt->get_result();
    $documents = [];
    while ($row = $result->fetch_assoc()) {
        $row['document_id'] = (int)$row['document_id'];
        $row['student_id'] = (int)$row['student_id'];
        $row['file_size'] = (int)$row['file_size'];
        $documents[] = $row;
    }
    $stmt->close();

    send_json(200, ['success' => true, 'documents' => $documents]);
} catch (Throwable $e) {
    send_json(500, ['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
