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

function bindDynamicParams(mysqli_stmt $stmt, string $types, array &$params): void {
    $bindings = [$types];
    foreach ($params as $index => $value) {
        $bindings[] = &$params[$index];
    }
    call_user_func_array([$stmt, 'bind_param'], $bindings);
}

function formatGradeLabel($grade): string {
    $grade = trim((string)$grade);
    if ($grade === '') {
        return '';
    }

    if (preg_match('/^grade\s*(\d+)$/i', $grade, $matches)) {
        return 'Grade ' . $matches[1];
    }

    $gradeMap = [
        '1' => 'Grade 7',
        '2' => 'Grade 8',
        '3' => 'Grade 9',
        '4' => 'Grade 10',
        '5' => 'Grade 11',
        '6' => 'Grade 12',
    ];

    if (isset($gradeMap[$grade])) {
        return $gradeMap[$grade];
    }

    if (ctype_digit($grade)) {
        $gradeNumber = (int)$grade;
        if ($gradeNumber >= 7 && $gradeNumber <= 12) {
            return 'Grade ' . $gradeNumber;
        }
    }

    return $grade;
}

try {
    $school = isset($_GET['school']) ? trim($_GET['school']) : '';
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $limit  = isset($_GET['limit'])  ? (int)$_GET['limit']  : 0;

    if ($school === '' && $search === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'school is required when no search query is provided']);
        exit;
    }

    // ------------------------------------------------------------------
    // Referral count sub-join (optional table)
    // ------------------------------------------------------------------
    $referralCountJoin = '';
    if (tableExists($conn, 'referral')) {
        $referralCountJoin = 'LEFT JOIN (
            SELECT StudentID, COUNT(*) AS referral_count
            FROM referral GROUP BY StudentID
        ) r ON r.StudentID = s.StudentId';
    }

    // ------------------------------------------------------------------
    // BASE SELECT
    // LEFT JOIN users_tables so students with AccountID = NULL are kept.
    // (INNER JOIN was silently dropping every unlinked student row.)
    // ------------------------------------------------------------------
    $baseSelect = "
        SELECT
            s.StudentId AS id,
            s.StudentId,
            s.FirstName  AS first_name,
            s.LastName   AS last_name,
            s.MiddleName AS middle_name,
            s.Nickname   AS nickname,
            s.Sex        AS sex,
            s.Age        AS age,
            s.DateOfBirth  AS date_of_birth,
            s.Grade        AS grade_level,
            s.Grade        AS grade_id,
            s.Section      AS section,
            s.EmailAccount AS student_email,
            u.email           AS email,
            u.school_attended AS school_attended,
            COALESCE(r.referral_count, 0) AS referral_count
        FROM student_table s
        LEFT JOIN users_tables u ON u.AccountID = s.AccountID
        {$referralCountJoin}
    ";

    // ------------------------------------------------------------------
    // WHERE clauses
    // ------------------------------------------------------------------
    $params       = [];
    $types        = '';
    $whereClauses = [];

    // School filter — match against users_tables.school_attended.
    // Students with NULL AccountID (u.school_attended IS NULL) are
    // always included so they are visible regardless of school filter.
    if ($school !== '') {
        // Build allowed-school list (check schools table for aliases)
        $allowedSchools = [$school];
        if (tableExists($conn, 'schools')) {
            $sl = $conn->prepare(
                'SELECT school_name, school_code FROM schools
                 WHERE school_name = ? OR school_code = ? LIMIT 1'
            );
            if ($sl) {
                $sl->bind_param('ss', $school, $school);
                if ($sl->execute()) {
                    $r = $sl->get_result();
                    if ($row = $r->fetch_assoc()) {
                        $allowedSchools[] = $row['school_name'];
                        $allowedSchools[] = $row['school_code'];
                    }
                }
                $sl->close();
            }
        }
        $allowedSchools = array_values(array_unique(array_filter(
            $allowedSchools,
            static fn($v) => trim((string)$v) !== ''
        )));

        $likes        = array_map(fn($v) => "%{$v}%", $allowedSchools);
        $placeholders = implode(' OR ', array_fill(0, count($likes), 'u.school_attended LIKE ?'));

        // Include unlinked students (AccountID IS NULL → u.school_attended IS NULL)
        $whereClauses[] = "({$placeholders} OR s.AccountID IS NULL)";
        $types          .= str_repeat('s', count($likes));
        $params          = array_merge($params, $likes);
    }

    // Search filter — name, nickname, email
    if ($search !== '') {
        $whereClauses[] = "(
            s.FirstName  LIKE ? OR
            s.LastName   LIKE ? OR
            CONCAT(s.FirstName, ' ', s.LastName) LIKE ? OR
            s.MiddleName   LIKE ? OR
            s.Nickname     LIKE ? OR
            s.EmailAccount LIKE ? OR
            u.email        LIKE ?
        )";
        $types .= 'sssssss';
        $like   = "%{$search}%";
        for ($i = 0; $i < 7; $i++) $params[] = $like;
    }

    $whereSql   = count($whereClauses) ? 'WHERE ' . implode(' AND ', $whereClauses) : '';
    $orderLimit = 'ORDER BY s.LastName ASC, s.FirstName ASC';
    if ($limit > 0) {
        $orderLimit .= ' LIMIT ?';
        $types      .= 'i';
        $params[]    = $limit;
    }

    $query = $baseSelect . ' ' . $whereSql . ' ' . $orderLimit;

    $stmt = $conn->prepare($query);
    if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);

    if ($types !== '') bindDynamicParams($stmt, $types, $params);

    if (!$stmt->execute()) throw new Exception('Execute failed: ' . $stmt->error);

    $result   = $stmt->get_result();
    $students = [];
    while ($row = $result->fetch_assoc()) {
        $row['grade_name'] = formatGradeLabel($row['grade_id'] ?? $row['grade_level'] ?? $row['Grade'] ?? '');
        $students[] = $row;
    }
    $stmt->close();

    $response = [
        'success' => true,
        'data'    => $students,
        'count'   => count($students),
        'school'  => $school,
    ];

    // Temporary debug output — remove when done testing
    if (!empty($_GET['debug'])) {
        $response['debug_sql']    = $query;
        $response['debug_params'] = $params;
    }

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>