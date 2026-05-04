<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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

function ensure_appointment_request_table(mysqli $conn): void {
    $sql = "
        CREATE TABLE IF NOT EXISTS appointment_requests (
            request_id VARCHAR(64) NOT NULL,
            student_id INT NOT NULL,
            student_name VARCHAR(255) NOT NULL,
            preferred_date DATE NOT NULL,
            preferred_time VARCHAR(20) NOT NULL,
            reason VARCHAR(255) NOT NULL,
            notes TEXT,
            school_attended VARCHAR(100),
            status VARCHAR(45) DEFAULT 'pending',
            counselor_id INT,
            counselor_notes TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (request_id),
            INDEX idx_student (student_id),
            INDEX idx_status (status),
            INDEX idx_date (preferred_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    ";

    if (!$conn->query($sql)) {
        send_json(500, [
            'success' => false,
            'message' => 'Failed to initialize appointment requests table: ' . $conn->error
        ]);
    }
}

try {
    ensure_appointment_request_table($conn);

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $school = trim((string)($_GET['school'] ?? ''));
        $role = trim((string)($_GET['role'] ?? ''));
        
        $sql = "SELECT 
                    request_id AS id,
                    student_id,
                    student_name,
                    preferred_date,
                    preferred_time,
                    reason,
                    notes,
                    school_attended,
                    status,
                    counselor_id,
                    counselor_notes,
                    created_at,
                    updated_at
                FROM appointment_requests WHERE 1=1";
        $types = '';
        $params = [];

        if ($school !== '') {
            $sql .= " AND school_attended = ?";
            $types .= 's';
            $params[] = $school;
        }

        $sql .= " ORDER BY preferred_date ASC, preferred_time ASC";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        }

        if ($types !== '') {
            $stmt->bind_param($types, ...$params);
        }

        if (!$stmt->execute()) {
            send_json(500, ['success' => false, 'message' => 'Execute failed: ' . $stmt->error]);
        }

        $result = $stmt->get_result();
        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        $stmt->close();

        send_json(200, ['success' => true, 'data' => $rows]);
    }

    if ($method === 'POST') {
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true);

        if (!is_array($payload)) {
            send_json(400, ['success' => false, 'message' => 'Invalid JSON payload']);
        }

        $student_id = (int)($payload['student_id'] ?? 0);
        $student_name = trim((string)($payload['student_name'] ?? ''));
        $preferred_date = trim((string)($payload['preferred_date'] ?? ''));
        $preferred_time = trim((string)($payload['preferred_time'] ?? ''));
        $reason = trim((string)($payload['reason'] ?? ''));
        $notes = trim((string)($payload['notes'] ?? ''));
        $school = trim((string)($payload['school'] ?? ''));

        if ($student_id === 0 || $student_name === '' || $preferred_date === '' || $preferred_time === '' || $reason === '') {
            send_json(400, ['success' => false, 'message' => 'Missing required fields']);
        }

        // Validate date format
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $preferred_date)) {
            send_json(400, ['success' => false, 'message' => 'Invalid date format. Use YYYY-MM-DD']);
        }

        $request_id = 'areq_' . bin2hex(random_bytes(8));

        $sql = "
            INSERT INTO appointment_requests (
                request_id, student_id, student_name, preferred_date, preferred_time, reason, notes, school_attended, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        ";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        }

        $stmt->bind_param('sissssss', $request_id, $student_id, $student_name, $preferred_date, $preferred_time, $reason, $notes, $school);

        if (!$stmt->execute()) {
            send_json(500, ['success' => false, 'message' => 'Failed to save request: ' . $stmt->error]);
        }

        $stmt->close();

        send_json(201, [
            'success' => true,
            'message' => 'Appointment request submitted successfully',
            'data' => [
                'request_id' => $request_id,
                'student_id' => $student_id,
                'student_name' => $student_name,
                'preferred_date' => $preferred_date,
                'preferred_time' => $preferred_time,
                'reason' => $reason,
                'status' => 'pending'
            ]
        ]);
    }

    if ($method === 'PUT') {
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true);

        if (!is_array($payload)) {
            send_json(400, ['success' => false, 'message' => 'Invalid JSON payload']);
        }

        $request_id = trim((string)($payload['id'] ?? ''));
        $status = trim((string)($payload['status'] ?? ''));
        $counselor_id = (int)($payload['counselor_id'] ?? 0);
        $counselor_notes = trim((string)($payload['counselor_notes'] ?? ''));

        if ($request_id === '' || $status === '') {
            send_json(400, ['success' => false, 'message' => 'Missing required fields']);
        }

        $sql = "UPDATE appointment_requests SET status = ?, counselor_id = ?, counselor_notes = ? WHERE request_id = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        }

        $stmt->bind_param('siss', $status, $counselor_id, $counselor_notes, $request_id);

        if (!$stmt->execute()) {
            send_json(500, ['success' => false, 'message' => 'Update failed: ' . $stmt->error]);
        }

        $stmt->close();

        send_json(200, ['success' => true, 'message' => 'Request updated successfully']);
    }

    send_json(405, ['success' => false, 'message' => 'Method not allowed']);
} catch (Throwable $e) {
    send_json(500, ['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
