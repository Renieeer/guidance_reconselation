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
require_once 'grade-scope.php';
require_once 'notify-appointment.php';

function send_json(int $statusCode, array $payload): void {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

function is_counselor_or_coordinator(string $role): bool {
    $normalized = strtolower(trim($role));
    if ($normalized === '') {
        return false;
    }
    if (in_array($normalized, ['coordinator', 'counselor', 'counselor-and-coordinator'], true)) {
        return true;
    }
    return strpos($normalized, 'coordinator') !== false || strpos($normalized, 'counselor') !== false;
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

        // Grade-scope filter — appointments reference a student_id rather
        // than storing a grade directly, so scoped requests are resolved
        // with a small batch lookup against student_table instead of
        // reworking this query.
        $gradeScope = grade_scope_to_list($_GET['grade_scope'] ?? '');
        if (!empty($gradeScope) && !empty($rows)) {
            $studentIds = array_values(array_unique(array_map(
                static fn($r) => (string)$r['student_id'],
                $rows
            )));
            $placeholders = implode(',', array_fill(0, count($studentIds), '?'));
            $gradeStmt = $conn->prepare("SELECT StudentId, Grade FROM student_table WHERE StudentId IN ({$placeholders})");
            $gradeByStudent = [];
            if ($gradeStmt) {
                $gradeStmt->bind_param(str_repeat('s', count($studentIds)), ...$studentIds);
                if ($gradeStmt->execute()) {
                    $gradeResult = $gradeStmt->get_result();
                    while ($gradeRow = $gradeResult->fetch_assoc()) {
                        $gradeByStudent[(string)$gradeRow['StudentId']] = $gradeRow['Grade'];
                    }
                }
                $gradeStmt->close();
            }

            $rows = array_values(array_filter($rows, static function ($r) use ($gradeByStudent, $gradeScope) {
                $studentGrade = $gradeByStudent[(string)$r['student_id']] ?? null;
                return grade_matches_scope($studentGrade, $gradeScope);
            }));
        }

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
        $role = trim((string)($payload['role'] ?? ''));
        $counselor_id = (int)($payload['counselor_id'] ?? 0);

        if ($student_id === 0 || $student_name === '' || $preferred_date === '' || $preferred_time === '' || $reason === '') {
            send_json(400, ['success' => false, 'message' => 'Missing required fields']);
        }

        // Validate date format
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $preferred_date)) {
            send_json(400, ['success' => false, 'message' => 'Invalid date format. Use YYYY-MM-DD']);
        }

        // Reject past dates - enforced server-side too, not just in the UI,
        // since the client-side check can be bypassed.
        if ($preferred_date < date('Y-m-d')) {
            send_json(400, ['success' => false, 'message' => 'You cannot request an appointment for a date that has already passed.']);
        }

        // Reject weekends - same reasoning, the UI check alone isn't enough.
        $dayOfWeek = (int)date('N', strtotime($preferred_date)); // 6 = Saturday, 7 = Sunday
        if ($dayOfWeek >= 6) {
            send_json(400, ['success' => false, 'message' => 'Weekends are not available for appointments. Please select a weekday.']);
        }

        $request_id = 'areq_' . bin2hex(random_bytes(8));

        // Appointments a counselor/coordinator schedules directly (e.g. from
        // a case's "Appoint Students" action) don't need their own approval
        // step — that review is only meaningful for appointments a student
        // requests. Skip straight to 'approved' for staff-initiated ones.
        $isStaffInitiated = is_counselor_or_coordinator($role);
        $initialStatus = $isStaffInitiated ? 'approved' : 'pending';
        $initialCounselorId = $isStaffInitiated ? $counselor_id : 0;
        $initialCounselorNotes = $isStaffInitiated ? 'Scheduled directly by counselor' : '';

        $sql = "
            INSERT INTO appointment_requests (
                request_id, student_id, student_name, preferred_date, preferred_time, reason, notes, school_attended, status, counselor_id, counselor_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        }

        $stmt->bind_param(
            'sisssssssis',
            $request_id,
            $student_id,
            $student_name,
            $preferred_date,
            $preferred_time,
            $reason,
            $notes,
            $school,
            $initialStatus,
            $initialCounselorId,
            $initialCounselorNotes
        );

        if (!$stmt->execute()) {
            send_json(500, ['success' => false, 'message' => 'Failed to save request: ' . $stmt->error]);
        }

        $stmt->close();

        // Best-effort — a mail failure must never block the appointment
        // request itself, which has already been saved successfully above.
        notify_appointment_email($conn, $request_id, $isStaffInitiated ? 'approved' : 'submitted');

        send_json(201, [
            'success' => true,
            'message' => $isStaffInitiated ? 'Appointment scheduled successfully' : 'Appointment request submitted successfully',
            'data' => [
                'request_id' => $request_id,
                'student_id' => $student_id,
                'student_name' => $student_name,
                'preferred_date' => $preferred_date,
                'preferred_time' => $preferred_time,
                'reason' => $reason,
                'status' => $initialStatus
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

        $previousStatusStmt = $conn->prepare("SELECT status FROM appointment_requests WHERE request_id = ?");
        $previousStatusStmt->bind_param('s', $request_id);
        $previousStatusStmt->execute();
        $previousStatusRow = $previousStatusStmt->get_result()->fetch_assoc();
        $previousStatusStmt->close();
        $previousStatus = $previousStatusRow['status'] ?? null;

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

        // Only notify on an actual status transition, not a notes-only
        // re-save that happens to resend the same status.
        if ($previousStatus !== null && $previousStatus !== $status) {
            notify_appointment_email($conn, $request_id, $status);
        }

        send_json(200, ['success' => true, 'message' => 'Request updated successfully']);
    }

    send_json(405, ['success' => false, 'message' => 'Method not allowed']);
} catch (Throwable $e) {
    send_json(500, ['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
