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

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$action = $_GET['action'] ?? 'sections';

/* ── GET SECTIONS + CATEGORIES ── */
if ($action === 'sections') {
    $result = $conn->query("
        SELECT 
            s.SectionID,
            s.SectionCode,
            s.SectionName,
            cc.CaseId,
            cc.CategoryName
        FROM section s
        LEFT JOIN case_category cc ON cc.SectionID = s.SectionID
        ORDER BY s.SectionID ASC, cc.CategoryName ASC
    ");

    if (!$result) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Query failed: ' . $conn->error]);
        exit;
    }

    $sections = [];
    while ($row = $result->fetch_assoc()) {
        $sid = $row['SectionID'];
        if (!isset($sections[$sid])) {
            $sections[$sid] = [
                'SectionID'   => $sid,
                'SectionCode' => $row['SectionCode'],
                'SectionName' => $row['SectionName'],
                'categories'  => []
            ];
        }
        if ($row['CaseId']) {
            $sections[$sid]['categories'][] = [
                'CaseId'       => $row['CaseId'],
                'CategoryName' => $row['CategoryName']
            ];
        }
    }

    echo json_encode(['success' => true, 'sections' => array_values($sections)]);
}

/* ── SEARCH STUDENTS (same school as counselor) ── */
elseif ($action === 'students') {
    $counselorSchool = $_SESSION['school_attended'] ?? '';

    if (empty($counselorSchool)) {
        echo json_encode(['success' => false, 'message' => 'No school found in session.']);
        exit;
    }

    $search = trim($_GET['q'] ?? '');

    if (strlen($search) < 2) {
        echo json_encode(['success' => true, 'students' => []]);
        exit;
    }

    $like   = '%' . $conn->real_escape_string($search) . '%';
    $school = $conn->real_escape_string($counselorSchool);

    $result = $conn->query("
        SELECT 
            st.StudentId,
            st.FirstName,
            st.MiddleName,
            st.LastName,
            st.Grade,
            st.Section
        FROM student_table st
        JOIN users_tables ut ON ut.AccountID = st.AccountID
        WHERE ut.school_attended = '$school'
          AND (
            CONCAT(st.FirstName, ' ', st.LastName) LIKE '$like'
            OR CONCAT(st.FirstName, ' ', st.MiddleName, ' ', st.LastName) LIKE '$like'
            OR st.LastName  LIKE '$like'
            OR st.FirstName LIKE '$like'
          )
        ORDER BY st.LastName ASC, st.FirstName ASC
        LIMIT 10
    ");

    if (!$result) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Query failed: ' . $conn->error]);
        exit;
    }

    $students = [];
    while ($row = $result->fetch_assoc()) {
        $mid      = $row['MiddleName'] ? ' ' . $row['MiddleName'] . ' ' : ' ';
        $fullName = trim($row['FirstName'] . $mid . $row['LastName']);
        $grade    = trim(($row['Grade'] ?? '') . ($row['Section'] ? ' - ' . $row['Section'] : ''));
        $students[] = [
            'StudentId' => $row['StudentId'],
            'name'      => $fullName,
            'grade'     => $grade ?: 'Grade not set',
        ];
    }

    echo json_encode(['success' => true, 'students' => $students]);
}

else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Unknown action.']);
}

if (isset($conn) && $conn instanceof mysqli) {
    $conn->close();
}