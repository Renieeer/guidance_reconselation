<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'conn.php';

function api_log(string $line): void {
    $logDir = __DIR__ . DIRECTORY_SEPARATOR . 'logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    $file = $logDir . DIRECTORY_SEPARATOR . 'schedule-events.log';
    $time = date('Y-m-d H:i:s');
    @file_put_contents($file, "[{$time}] " . $line . "\n", FILE_APPEND | LOCK_EX);
}

function send_json(int $statusCode, array $payload): void {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

function normalize_date_input($value): ?string {
    $raw = trim((string)($value ?? ''));
    if ($raw === '') {
        return null;
    }

    $raw = str_replace('/', '-', $raw);
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
        return $raw;
    }

    if (preg_match('/^\d{4}-\d{2}-\d{2}[T\s].*$/', $raw)) {
        return substr($raw, 0, 10);
    }

    $ts = strtotime($raw);
    if ($ts === false) {
        return null;
    }

    return date('Y-m-d', $ts);
}

function is_allowed_editor_role(string $role): bool {
    $normalized = strtolower(trim($role));
    if ($normalized === '') {
        return false;
    }

    if (in_array($normalized, ['coordinator', 'counselor', 'counselor-and-coordinator'], true)) {
        return true;
    }

    return strpos($normalized, 'coordinator') !== false || strpos($normalized, 'counselor') !== false;
}

function ensure_schedule_table(mysqli $conn): void {
    $sql = "
        CREATE TABLE IF NOT EXISTS schedule_events (
            event_id VARCHAR(64) NOT NULL,
            title VARCHAR(255) NOT NULL,
            event_type VARCHAR(80) DEFAULT 'None',
            start_date DATE NOT NULL,
            end_date DATE DEFAULT NULL,
            event_time VARCHAR(20) DEFAULT '',
            all_day TINYINT(1) NOT NULL DEFAULT 0,
            description TEXT,
            location VARCHAR(255) DEFAULT NULL,
            school_attended VARCHAR(100) NOT NULL,
            created_by VARCHAR(45) DEFAULT NULL,
            created_role VARCHAR(45) DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (event_id),
            INDEX idx_school_date (school_attended, start_date, end_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    ";

    if (!$conn->query($sql)) {
        send_json(500, [
            'success' => false,
            'message' => 'Failed to initialize schedule table: ' . $conn->error
        ]);
    }
}

function generate_event_id(): string {
    return 'evt_' . bin2hex(random_bytes(8));
}

try {
    ensure_schedule_table($conn);

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        api_log('GET request: ' . json_encode($_GET));
        $school = trim((string)($_GET['school'] ?? ''));
        $month = trim((string)($_GET['month'] ?? ''));

        $sql = "
            SELECT
                event_id AS id,
                title,
                event_type AS type,
                start_date AS date,
                end_date AS endDate,
                event_time AS time,
                all_day AS allDay,
                description,
                location,
                created_at AS createdAt,
                created_by AS createdBy,
                created_role AS createdRole
            FROM schedule_events
            WHERE 1=1
        ";
        $types = '';
        $params = [];

        if ($school !== '') {
            $sql .= ' AND school_attended = ?';
            $types .= 's';
            $params[] = $school;
        }

        if ($month !== '') {
            if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
                send_json(400, ['success' => false, 'message' => 'Invalid month format. Use YYYY-MM']);
            }

            $monthStart = $month . '-01';
            $monthEnd = date('Y-m-t', strtotime($monthStart));
            $sql .= " AND start_date <= ? AND COALESCE(end_date, start_date) >= ?";
            $types .= 'ss';
            $params[] = $monthEnd;
            $params[] = $monthStart;
        }

        $sql .= ' ORDER BY start_date ASC, event_time ASC, title ASC';

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            api_log('GET prepare failed: ' . $conn->error . ' SQL: ' . $sql);
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
            $row['allDay'] = (bool)$row['allDay'];
            $rows[] = $row;
        }
        $stmt->close();

        api_log('GET returned ' . count($rows) . ' rows for school=' . $school . ' month=' . $month);

        send_json(200, ['success' => true, 'data' => $rows]);
    }

    if ($method === 'POST') {
        $raw = file_get_contents('php://input');
        api_log('POST raw: ' . substr($raw, 0, 4000));
        $payload = json_decode($raw, true);
        api_log('POST decoded: ' . json_encode(is_array($payload) ? $payload : ['invalid_json' => true]));
        if (!is_array($payload)) {
            api_log('POST invalid JSON payload');
            send_json(400, ['success' => false, 'message' => 'Invalid JSON payload']);
        }

        $title = trim((string)($payload['title'] ?? ''));
        $school = trim((string)($payload['school'] ?? ''));
        $role = trim((string)($payload['createdRole'] ?? ''));
        $createdBy = trim((string)($payload['createdBy'] ?? ''));

        if ($title === '' || $school === '') {
            send_json(400, ['success' => false, 'message' => 'Title and school are required']);
        }

        if (!is_allowed_editor_role($role)) {
            // If role is missing but createdBy is present, allow for backward compatibility
            if (trim($createdBy) === '') {
                api_log('POST rejected role: ' . $role . ' createdBy:' . $createdBy);
                send_json(403, ['success' => false, 'message' => 'Only counselor or coordinator can create calendar events']);
            } else {
                api_log('POST: role not provided but createdBy present; allowing creation for createdBy=' . $createdBy);
            }
        }

        $startDate = normalize_date_input($payload['date'] ?? null);
        $endDate = normalize_date_input($payload['endDate'] ?? null);

        if ($startDate === null) {
            send_json(400, ['success' => false, 'message' => 'Invalid start date']);
        }

        if ($endDate !== null && $endDate < $startDate) {
            send_json(400, ['success' => false, 'message' => 'End date must be on or after start date']);
        }

        $eventType = trim((string)($payload['type'] ?? 'None'));
        $eventTime = trim((string)($payload['time'] ?? ''));
        $description = trim((string)($payload['description'] ?? ''));
        $location = trim((string)($payload['location'] ?? ''));
        $allDay = !empty($payload['allDay']) ? 1 : 0;

        $eventId = trim((string)($payload['id'] ?? ''));
        if ($eventId === '' || !preg_match('/^[A-Za-z0-9_-]+$/', $eventId)) {
            $eventId = generate_event_id();
        }

        $insertSql = "
            INSERT INTO schedule_events (
                event_id, title, event_type, start_date, end_date, event_time,
                all_day, description, location, school_attended, created_by, created_role
            ) VALUES (?, ?, ?, ?, NULLIF(?, ''), ?, ?, NULLIF(?, ''), NULLIF(?, ''), ?, ?, ?)
        ";

        $stmt = $conn->prepare($insertSql);
        if (!$stmt) {
            api_log('POST prepare failed: ' . $conn->error . ' SQL: ' . $insertSql);
            send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        }

        $dbEndDate = $endDate ?: '';
        $dbLocation = $location;
        $dbDescription = $description;

        $stmt->bind_param(
            'ssssssisssss',
            $eventId,
            $title,
            $eventType,
            $startDate,
            $dbEndDate,
            $eventTime,
            $allDay,
            $dbDescription,
            $dbLocation,
            $school,
            $createdBy,
            $role
        );

        if (!$stmt->execute()) {
            api_log('POST execute failed: ' . $stmt->error);
            send_json(500, ['success' => false, 'message' => 'Failed to save event: ' . $stmt->error]);
        }
        $stmt->close();

        api_log('POST saved event: ' . $eventId . ' school=' . $school . ' createdBy=' . $createdBy . ' role=' . $role);

        send_json(201, [
            'success' => true,
            'message' => 'Event saved successfully',
            'data' => [
                'id' => $eventId,
                'title' => $title,
                'type' => $eventType,
                'date' => $startDate,
                'endDate' => $endDate,
                'time' => $eventTime,
                'allDay' => (bool)$allDay,
                'description' => $description,
                'location' => $location,
                'createdBy' => $createdBy,
                'createdRole' => $role
            ]
        ]);
    }

    if ($method === 'DELETE') {
        $eventId = trim((string)($_GET['id'] ?? ''));
        $school = trim((string)($_GET['school'] ?? ''));
        $role = trim((string)($_GET['role'] ?? ''));
        api_log('DELETE request id=' . $eventId . ' school=' . $school . ' role=' . $role . ' GET=' . json_encode($_GET));

        if ($eventId === '' || $school === '') {
            send_json(400, ['success' => false, 'message' => 'Event id and school are required']);
        }

        if (!is_allowed_editor_role($role)) {
            send_json(403, ['success' => false, 'message' => 'Only counselor or coordinator can delete calendar events']);
        }

        $stmt = $conn->prepare('DELETE FROM schedule_events WHERE event_id = ? AND school_attended = ?');
        if (!$stmt) {
            send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        }

        $stmt->bind_param('ss', $eventId, $school);
        if (!$stmt->execute()) {
            send_json(500, ['success' => false, 'message' => 'Delete failed: ' . $stmt->error]);
        }

        if ($stmt->affected_rows === 0) {
            send_json(404, ['success' => false, 'message' => 'Event not found']);
        }

        $stmt->close();
        send_json(200, ['success' => true, 'message' => 'Event deleted']);
    }

    send_json(405, ['success' => false, 'message' => 'Method not allowed']);
} catch (Throwable $e) {
    send_json(500, ['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
