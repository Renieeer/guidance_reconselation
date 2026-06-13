<?php
// Enable CORS for frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'conn.php';

function tableExists(mysqli $conn, string $tableName): bool {
    $result = $conn->query("SHOW TABLES LIKE '" . $conn->real_escape_string($tableName) . "'");
    return $result && $result->num_rows > 0;
}

function getColumns(mysqli $conn, string $tableName): array {
    $columns = [];
    $result = $conn->query("SHOW COLUMNS FROM `{$tableName}`");

    if (!$result) {
        return $columns;
    }

    while ($row = $result->fetch_assoc()) {
        $columns[$row['Field']] = true;
    }

    return $columns;
}

function bindDynamicParams(mysqli_stmt $stmt, string $types, array &$params): void {
    $bindings = [$types];
    foreach ($params as $index => $value) {
        $bindings[] = &$params[$index];
    }

    call_user_func_array([$stmt, 'bind_param'], $bindings);
}

try {
    $school = isset($_GET['school']) ? trim($_GET['school']) : '';

    if ($school === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'school is required']);
        exit;
    }

    $studentColumns = getColumns($conn, 'student_table');
    $studentIdColumn = isset($studentColumns['StudentId']) ? 'StudentId' : (isset($studentColumns['id']) ? 'id' : null);

    if (!$studentIdColumn) {
        throw new Exception('student_table is missing both StudentId and id columns');
    }

    if (!isset($studentColumns['AccountID'])) {
        throw new Exception('student_table is missing AccountID column');
    }

    if (!tableExists($conn, 'users_tables')) {
        throw new Exception('users_tables table not found');
    }

    $allowedSchools = [$school];
    if (tableExists($conn, 'schools')) {
        $schoolLookup = $conn->prepare('SELECT school_name, school_code FROM schools WHERE school_name = ? OR school_code = ? LIMIT 1');
        if ($schoolLookup) {
            $schoolLookup->bind_param('ss', $school, $school);
            if ($schoolLookup->execute()) {
                $result = $schoolLookup->get_result();
                if ($row = $result->fetch_assoc()) {
                    $allowedSchools[] = $row['school_name'];
                    $allowedSchools[] = $row['school_code'];
                }
            }
            $schoolLookup->close();
        }
    }
    $allowedSchools = array_values(array_unique(array_filter($allowedSchools, static fn($value) => trim((string) $value) !== '')));

    $referralCountJoin = '';
    if (tableExists($conn, 'referral')) {
        $referralCountJoin = 'LEFT JOIN (SELECT StudentID, COUNT(*) AS referral_count FROM referral GROUP BY StudentID) r ON r.StudentID = s.StudentId';
    }

    $placeholders = implode(',', array_fill(0, count($allowedSchools), '?'));
    $types = str_repeat('s', count($allowedSchools));

    $query = "
        SELECT
            s.StudentId AS id,
            s.StudentId,
            s.FirstName AS first_name,
            s.LastName AS last_name,
            s.MiddleName AS middle_name,
            s.Nickname AS nickname,
            s.Sex AS sex,
            s.Age AS age,
            s.DateOfBirth AS date_of_birth,
            s.Grade AS grade_level,
            s.Grade AS grade_id,
            s.Section AS section,
            s.EmailAccount AS student_email,
            u.email AS email,
            u.school_attended,
            COALESCE(r.referral_count, 0) AS referral_count
        FROM student_table s
        INNER JOIN users_tables u ON u.AccountID = s.AccountID
        {$referralCountJoin}
        WHERE u.school_attended IN ({$placeholders})
        ORDER BY s.LastName ASC, s.FirstName ASC
    ";

    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }

    bindDynamicParams($stmt, $types, $allowedSchools);
    if (!$stmt->execute()) {
        throw new Exception('Execute failed: ' . $stmt->error);
    }

    $result = $stmt->get_result();
    $students = [];
    while ($row = $result->fetch_assoc()) {
        $students[] = $row;
    }
    $stmt->close();

    echo json_encode([
        'success' => true,
        'data' => $students,
        'count' => count($students),
        'school' => $school
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>