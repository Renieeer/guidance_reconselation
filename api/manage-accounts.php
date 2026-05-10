<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
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
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // Fetch all accounts from the same school
        $school = trim((string)($_GET['school'] ?? ''));
        $search = trim((string)($_GET['search'] ?? ''));

        if ($school === '') {
            send_json(400, ['success' => false, 'message' => 'School is required']);
        }

        $sql = "SELECT 
                    AccountID AS id,
                    First_name,
                    Last_name,
                    email,
                    Type,
                    school_attended,
                    created_at
                FROM users_tables 
                WHERE school_attended = ?";
        
        $types = 's';
        $params = [$school];

        if ($search !== '') {
            $sql .= " AND (First_name LIKE ? OR Last_name LIKE ? OR email LIKE ?)";
            $searchTerm = '%' . $search . '%';
            $types .= 'sss';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $sql .= " ORDER BY created_at DESC";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        }

        $stmt->bind_param($types, ...$params);
        
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

    if ($method === 'PUT') {
        // Update account information
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true);

        if (!is_array($payload)) {
            send_json(400, ['success' => false, 'message' => 'Invalid JSON payload']);
        }

        $id = (int)($payload['id'] ?? 0);
        $first_name = trim((string)($payload['first_name'] ?? ''));
        $last_name = trim((string)($payload['last_name'] ?? ''));
        $new_password = trim((string)($payload['password'] ?? ''));
        $school = trim((string)($payload['school'] ?? ''));

        if ($id === 0 || $first_name === '' || $last_name === '') {
            send_json(400, ['success' => false, 'message' => 'Missing required fields']);
        }

        if ($new_password !== '') {
            // Update with password
            if (strlen($new_password) < 6) {
                send_json(400, ['success' => false, 'message' => 'Password must be at least 6 characters']);
            }

            $hashedPassword = password_hash($new_password, PASSWORD_BCRYPT);
            $sql = "UPDATE users_tables SET First_name = ?, Last_name = ?, Password = ? WHERE AccountID = ? AND school_attended = ?";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
            }
            $stmt->bind_param('ssssi', $first_name, $last_name, $hashedPassword, $id, $school);
        } else {
            // Update without password
            $sql = "UPDATE users_tables SET First_name = ?, Last_name = ? WHERE AccountID = ? AND school_attended = ?";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
            }
            $stmt->bind_param('sssi', $first_name, $last_name, $id, $school);
        }

        if (!$stmt->execute()) {
            send_json(500, ['success' => false, 'message' => 'Update failed: ' . $stmt->error]);
        }

        if ($stmt->affected_rows === 0) {
            send_json(404, ['success' => false, 'message' => 'Account not found or access denied']);
        }

        $stmt->close();

        send_json(200, ['success' => true, 'message' => 'Account updated successfully']);
    }

    send_json(405, ['success' => false, 'message' => 'Method not allowed']);
} catch (Throwable $e) {
    send_json(500, ['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
