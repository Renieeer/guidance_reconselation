<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'conn.php';
require_once 'grade-scope.php';

function send_json(int $statusCode, array $payload): void {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

function table_exists(mysqli $conn, string $tableName): bool {
    $result = $conn->query("SHOW TABLES LIKE '" . $conn->real_escape_string($tableName) . "'");
    return $result && $result->num_rows > 0;
}

/* Aggregates every guidance-office record tied to one student — referrals
   (+ their screening notes), counseling case scenarios, counseling
   follow-ups (the "appointment span" of a case over time), and online
   appointment requests — into one payload so the Student History page can
   render all four record folders from a single request instead of one
   fetch per record type. */

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json(405, ['success' => false, 'message' => 'Method not allowed']);
}

$studentId = trim((string)($_GET['student_id'] ?? ''));
if ($studentId === '') {
    send_json(400, ['success' => false, 'message' => 'student_id is required']);
}

$studentStmt = $conn->prepare('
    SELECT StudentId, AccountID, FirstName, MiddleName, LastName, Sex, Age, Grade, Section, EmailAccount, CellphoneNumber
    FROM student_table
    WHERE StudentId = ?
');
if (!$studentStmt) {
    send_json(500, ['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
}
$studentStmt->bind_param('s', $studentId);
if (!$studentStmt->execute()) {
    send_json(500, ['success' => false, 'message' => 'Execute failed: ' . $studentStmt->error]);
}
$student = $studentStmt->get_result()->fetch_assoc();
$studentStmt->close();

if (!$student) {
    send_json(404, ['success' => false, 'message' => 'Student not found']);
}

// Defense-in-depth: keep a grade-scoped counselor/coordinator from pulling
// a student outside their assigned grade(s) even via a guessed/typed URL.
$gradeScope = grade_scope_to_list($_GET['grade_scope'] ?? '');
if (!empty($gradeScope) && !grade_matches_scope($student['Grade'] ?? null, $gradeScope)) {
    send_json(403, ['success' => false, 'message' => 'This student is outside your assigned grade scope']);
}

// ---------------------------------------------------------------------
// Referrals (+ nested Stage-2 screening notes)
// ---------------------------------------------------------------------
$referrals = [];
if (table_exists($conn, 'referral')) {
    $stmt = $conn->prepare('
        SELECT * FROM referral
        WHERE (student_id = ? OR StudentID = ?)
        ORDER BY date_submitted DESC, ReferralID DESC
    ');
    if ($stmt) {
        $stmt->bind_param('ss', $studentId, $studentId);
        if ($stmt->execute()) {
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $referrals[] = [
                    'id' => (int)($row['ReferralID'] ?? 0),
                    'referral_code' => $row['referral_code'] ?? null,
                    'referral_reason' => $row['Reason'] ?? '',
                    'description' => $row['description'] ?? '',
                    'intervention_attempts' => $row['intervention_attempts'] ?? '',
                    'observed_behaviors' => $row['observed_behaviors'] ?? '',
                    'parent_guardian' => $row['parent_guardian'] ?? '',
                    'parent_contact' => $row['parent_contact'] ?? '',
                    'urgency' => $row['urgency'] ?? 'normal',
                    'stage' => (int)($row['stage'] ?? 1),
                    'status' => $row['status'] ?? 'pending',
                    'teacher_name' => $row['teacher_name'] ?? '',
                    'grade' => $row['Grade'] ?? '',
                    'section' => $row['section'] ?? '',
                    'date_submitted' => $row['date_submitted'] ?? null,
                    'updated_at' => $row['updated_at'] ?? null,
                    'screenings' => []
                ];
            }
        }
        $stmt->close();
    }

    if (!empty($referrals) && table_exists($conn, 'referral_screening')) {
        $ids = array_column($referrals, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $types = str_repeat('i', count($ids));
        $stmt = $conn->prepare("
            SELECT * FROM referral_screening
            WHERE referral_id IN ($placeholders)
            ORDER BY created_at ASC, screening_id ASC
        ");
        if ($stmt) {
            $stmt->bind_param($types, ...$ids);
            if ($stmt->execute()) {
                $result = $stmt->get_result();
                $screeningsByReferral = [];
                while ($row = $result->fetch_assoc()) {
                    $screeningsByReferral[(int)$row['referral_id']][] = [
                        'screening_id' => (int)$row['screening_id'],
                        'interview_notes' => $row['interview_notes'] ?? '',
                        'observations' => $row['observations'] ?? '',
                        'risk_level' => $row['risk_level'] ?? '',
                        'counselor_name' => $row['counselor_name'] ?? '',
                        'created_at' => $row['created_at'] ?? null
                    ];
                }
                foreach ($referrals as &$ref) {
                    $ref['screenings'] = $screeningsByReferral[$ref['id']] ?? [];
                }
                unset($ref);
            }
            $stmt->close();
        }
    }
}

// ---------------------------------------------------------------------
// Counseling case scenarios that embed this student
// ---------------------------------------------------------------------
$counseling = [];
$hasCaseTable = table_exists($conn, 'counselor_case_scenarios');
if ($hasCaseTable) {
    $needle = '"id":"' . $studentId . '"';
    $stmt = $conn->prepare("
        SELECT * FROM counselor_case_scenarios
        WHERE students_json LIKE CONCAT('%', ?, '%')
        ORDER BY created_at DESC
    ");
    if ($stmt) {
        $stmt->bind_param('s', $needle);
        if ($stmt->execute()) {
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $studentsArr = json_decode((string)($row['students_json'] ?? '[]'), true) ?: [];
                $recordsMap = json_decode((string)($row['counseling_records_json'] ?? '{}'), true) ?: [];

                // LIKE above is a coarse prefilter (avoids a full table scan
                // in PHP); confirm real membership here so a substring hit
                // like "STU1" inside "STU12" can't leak another student's case.
                $matchedStudent = null;
                foreach ($studentsArr as $s) {
                    if ((string)($s['id'] ?? '') === $studentId) {
                        $matchedStudent = $s;
                        break;
                    }
                }
                if ($matchedStudent === null) {
                    continue;
                }

                $counseling[] = [
                    'case_uid' => $row['case_uid'] ?? '',
                    'case_title' => $row['case_title'] ?? '',
                    'section_name' => $row['section_name'] ?? '',
                    'category_name' => $row['category_name'] ?? ($recordsMap[$studentId]['categoryName'] ?? ''),
                    'case_date' => $row['case_date'] ?? null,
                    'case_summary' => $row['case_summary'] ?? '',
                    'case_objective' => $row['case_objective'] ?? '',
                    'first_action' => $row['first_action'] ?? '',
                    'status' => $row['status'] ?? 'pending',
                    'counselor_name' => $row['counselor_name'] ?? '',
                    'student_role' => $matchedStudent['role'] ?? '',
                    'student_detail' => $recordsMap[$studentId] ?? null,
                    'created_at' => $row['created_at'] ?? null,
                    'updated_at' => $row['updated_at'] ?? null
                ];
            }
        }
        $stmt->close();
    }
}

// ---------------------------------------------------------------------
// Counseling follow-ups — the recurring "appointment span" of a case
// ---------------------------------------------------------------------
$followUps = [];
if (table_exists($conn, 'follow_up') && table_exists($conn, 'follow_up_note')) {
    $caseTitleSelect = $hasCaseTable ? 'cs.case_title' : 'NULL';
    $caseJoin = $hasCaseTable ? 'LEFT JOIN counselor_case_scenarios cs ON cs.case_uid = fu.case_uid' : '';

    $stmt = $conn->prepare("
        SELECT fu.Follow_id AS follow_up_id, fu.case_uid, fu.category_name, fu.follow_up_date,
               fu.counselor_name, fu.created_at, n.note, {$caseTitleSelect} AS case_title
        FROM follow_up fu
        JOIN follow_up_note n ON n.follow_up_id = fu.Follow_id
        {$caseJoin}
        WHERE n.student_id = ?
        ORDER BY fu.follow_up_date DESC, fu.Follow_id DESC
    ");
    if ($stmt) {
        $stmt->bind_param('s', $studentId);
        if ($stmt->execute()) {
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $followUps[] = [
                    'follow_up_id' => (int)$row['follow_up_id'],
                    'case_uid' => $row['case_uid'] ?? '',
                    'case_title' => $row['case_title'] ?? '',
                    'category_name' => $row['category_name'] ?? '',
                    'follow_up_date' => $row['follow_up_date'] ?? null,
                    'note' => $row['note'] ?? '',
                    'counselor_name' => $row['counselor_name'] ?? '',
                    'created_at' => $row['created_at'] ?? null
                ];
            }
        }
        $stmt->close();
    }
}

// ---------------------------------------------------------------------
// Online appointment requests
// appointment_requests.student_id is an int, but it's populated from two
// different flows that don't agree on what identifies a student: the
// self-service student portal sends getCurrentUser().id (their
// users_tables AccountID), while the counselor's "Appoint Students" case
// action sends the case's embedded student.id (student_table.StudentId).
// Both are matched here since either can be the true key for a given row.
// ---------------------------------------------------------------------
$appointments = [];
$candidateIds = [];
if (!empty($student['AccountID'])) {
    $candidateIds[] = (int)$student['AccountID'];
}
if (ctype_digit($studentId)) {
    $candidateIds[] = (int)$studentId;
}
$candidateIds = array_values(array_unique($candidateIds));

if (!empty($candidateIds) && table_exists($conn, 'appointment_requests')) {
    $placeholders = implode(',', array_fill(0, count($candidateIds), '?'));
    $types = str_repeat('i', count($candidateIds));
    $stmt = $conn->prepare("
        SELECT * FROM appointment_requests
        WHERE student_id IN ($placeholders)
        ORDER BY preferred_date DESC, preferred_time DESC
    ");
    if ($stmt) {
        $stmt->bind_param($types, ...$candidateIds);
        if ($stmt->execute()) {
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $appointments[] = [
                    'id' => $row['request_id'] ?? '',
                    'preferred_date' => $row['preferred_date'] ?? null,
                    'preferred_time' => $row['preferred_time'] ?? '',
                    'reason' => $row['reason'] ?? '',
                    'notes' => $row['notes'] ?? '',
                    'status' => $row['status'] ?? 'pending',
                    'counselor_notes' => $row['counselor_notes'] ?? '',
                    'created_at' => $row['created_at'] ?? null,
                    'updated_at' => $row['updated_at'] ?? null
                ];
            }
        }
        $stmt->close();
    }
}

$studentName = trim(($student['FirstName'] ?? '') . ' ' . ($student['LastName'] ?? ''));

send_json(200, [
    'success' => true,
    'student' => [
        'student_id' => $student['StudentId'] ?? $studentId,
        'name' => $studentName,
        'first_name' => $student['FirstName'] ?? '',
        'last_name' => $student['LastName'] ?? '',
        'sex' => $student['Sex'] ?? '',
        'age' => $student['Age'] ?? '',
        'grade' => $student['Grade'] ?? '',
        'section' => $student['Section'] ?? '',
        'email' => $student['EmailAccount'] ?? '',
        'contact' => $student['CellphoneNumber'] ?? ''
    ],
    'data' => [
        'referrals' => $referrals,
        'counseling' => $counseling,
        'follow_ups' => $followUps,
        'appointments' => $appointments
    ],
    'counts' => [
        'referrals' => count($referrals),
        'counseling' => count($counseling),
        'follow_ups' => count($followUps),
        'appointments' => count($appointments)
    ]
]);
