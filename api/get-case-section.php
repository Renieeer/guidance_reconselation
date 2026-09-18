<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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

/* ── ADD SECTION / ADD CASE CATEGORY (SDO Case Management) ── */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = is_array($input) ? ($input['action'] ?? '') : '';

    if ($action === 'add_section') {
        $sectionName = trim((string)($input['sectionName'] ?? ''));

        if ($sectionName === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Section name is required.']);
            exit;
        }

        $dup = $conn->prepare('SELECT SectionID FROM section WHERE LOWER(SectionName) = LOWER(?) LIMIT 1');
        $dup->bind_param('s', $sectionName);
        $dup->execute();
        $exists = $dup->get_result()->fetch_assoc();
        $dup->close();

        if ($exists) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'A section with that name already exists.']);
            exit;
        }

        // SectionID/SectionCode have no auto-increment — assigned by hand,
        // same as the seed data (1..6 -> A..F). Keep that scheme going with
        // a spreadsheet-style letter (A..Z, then AA, AB, ...) so it never
        // collides once the alphabet runs out.
        $next = $conn->query('SELECT COALESCE(MAX(SectionID), 0) + 1 AS nextId FROM section')->fetch_assoc();
        $nextId = (int)$next['nextId'];
        $code = numberToLetters($nextId);

        $stmt = $conn->prepare('INSERT INTO section (SectionID, SectionCode, SectionName) VALUES (?, ?, ?)');
        $stmt->bind_param('iss', $nextId, $code, $sectionName);

        if (!$stmt->execute()) {
            $stmt->close();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to add section.']);
            exit;
        }
        $stmt->close();

        echo json_encode([
            'success' => true,
            'message' => 'Section added successfully.',
            'section' => ['SectionID' => $nextId, 'SectionCode' => $code, 'SectionName' => $sectionName]
        ]);
        exit;
    }

    if ($action === 'edit_section') {
        $sectionId = (int)($input['sectionId'] ?? 0);
        $sectionName = trim((string)($input['sectionName'] ?? ''));

        if ($sectionId <= 0 || $sectionName === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Section and new name are required.']);
            exit;
        }

        $existsCheck = $conn->prepare('SELECT SectionID FROM section WHERE SectionID = ?');
        $existsCheck->bind_param('i', $sectionId);
        $existsCheck->execute();
        $found = $existsCheck->get_result()->fetch_assoc();
        $existsCheck->close();

        if (!$found) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Section was not found.']);
            exit;
        }

        $dup = $conn->prepare('SELECT SectionID FROM section WHERE LOWER(SectionName) = LOWER(?) AND SectionID != ? LIMIT 1');
        $dup->bind_param('si', $sectionName, $sectionId);
        $dup->execute();
        $exists = $dup->get_result()->fetch_assoc();
        $dup->close();

        if ($exists) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'A section with that name already exists.']);
            exit;
        }

        $stmt = $conn->prepare('UPDATE section SET SectionName = ? WHERE SectionID = ?');
        $stmt->bind_param('si', $sectionName, $sectionId);

        if (!$stmt->execute()) {
            $stmt->close();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update section.']);
            exit;
        }
        $stmt->close();

        echo json_encode([
            'success' => true,
            'message' => 'Section updated successfully.',
            'section' => ['SectionID' => $sectionId, 'SectionName' => $sectionName]
        ]);
        exit;
    }

    if ($action === 'add_case_category') {
        $sectionId = (int)($input['sectionId'] ?? 0);
        $categoryName = trim((string)($input['categoryName'] ?? ''));

        if ($sectionId <= 0 || $categoryName === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Section and category name are required.']);
            exit;
        }

        $section = $conn->prepare('SELECT SectionID, SectionCode, SectionName FROM section WHERE SectionID = ?');
        $section->bind_param('i', $sectionId);
        $section->execute();
        $sectionRow = $section->get_result()->fetch_assoc();
        $section->close();

        if (!$sectionRow) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Selected section was not found.']);
            exit;
        }

        $dup = $conn->prepare('SELECT CaseId FROM case_category WHERE SectionID = ? AND LOWER(CategoryName) = LOWER(?) LIMIT 1');
        $dup->bind_param('is', $sectionId, $categoryName);
        $dup->execute();
        $exists = $dup->get_result()->fetch_assoc();
        $dup->close();

        if ($exists) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'That category already exists under this section.']);
            exit;
        }

        // CaseId is a varchar PK with no auto-increment, but every existing
        // row holds a plain numeric string — keep assigning the next one.
        $next = $conn->query('SELECT COALESCE(MAX(CAST(CaseId AS UNSIGNED)), 0) + 1 AS nextId FROM case_category')->fetch_assoc();
        $nextId = (string)(int)$next['nextId'];

        $stmt = $conn->prepare('INSERT INTO case_category (CaseId, SectionID, CategoryName) VALUES (?, ?, ?)');
        $stmt->bind_param('sis', $nextId, $sectionId, $categoryName);

        if (!$stmt->execute()) {
            $stmt->close();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to add case category.']);
            exit;
        }
        $stmt->close();

        echo json_encode([
            'success' => true,
            'message' => 'Case category added successfully.',
            'category' => [
                'CaseId' => $nextId,
                'SectionID' => $sectionId,
                'SectionCode' => $sectionRow['SectionCode'],
                'SectionName' => $sectionRow['SectionName'],
                'CategoryName' => $categoryName
            ]
        ]);
        exit;
    }

    if ($action === 'edit_case_category') {
        $caseId = trim((string)($input['caseId'] ?? ''));
        $sectionId = (int)($input['sectionId'] ?? 0);
        $categoryName = trim((string)($input['categoryName'] ?? ''));

        if ($caseId === '' || $sectionId <= 0 || $categoryName === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Category, section, and name are required.']);
            exit;
        }

        $existsCheck = $conn->prepare('SELECT CaseId FROM case_category WHERE CaseId = ?');
        $existsCheck->bind_param('s', $caseId);
        $existsCheck->execute();
        $found = $existsCheck->get_result()->fetch_assoc();
        $existsCheck->close();

        if (!$found) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Case category was not found.']);
            exit;
        }

        $section = $conn->prepare('SELECT SectionID, SectionCode, SectionName FROM section WHERE SectionID = ?');
        $section->bind_param('i', $sectionId);
        $section->execute();
        $sectionRow = $section->get_result()->fetch_assoc();
        $section->close();

        if (!$sectionRow) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Selected section was not found.']);
            exit;
        }

        $dup = $conn->prepare('SELECT CaseId FROM case_category WHERE SectionID = ? AND LOWER(CategoryName) = LOWER(?) AND CaseId != ? LIMIT 1');
        $dup->bind_param('iss', $sectionId, $categoryName, $caseId);
        $dup->execute();
        $exists = $dup->get_result()->fetch_assoc();
        $dup->close();

        if ($exists) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'That category already exists under this section.']);
            exit;
        }

        $stmt = $conn->prepare('UPDATE case_category SET SectionID = ?, CategoryName = ? WHERE CaseId = ?');
        $stmt->bind_param('iss', $sectionId, $categoryName, $caseId);

        if (!$stmt->execute()) {
            $stmt->close();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update case category.']);
            exit;
        }
        $stmt->close();

        echo json_encode([
            'success' => true,
            'message' => 'Case category updated successfully.',
            'category' => [
                'CaseId' => $caseId,
                'SectionID' => $sectionId,
                'SectionCode' => $sectionRow['SectionCode'],
                'SectionName' => $sectionRow['SectionName'],
                'CategoryName' => $categoryName
            ]
        ]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Unknown action.']);
    exit;
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

// 1 -> A, 26 -> Z, 27 -> AA, 28 -> AB, ... (spreadsheet column naming).
function numberToLetters(int $n): string {
    $letters = '';
    while ($n > 0) {
        $rem = ($n - 1) % 26;
        $letters = chr(65 + $rem) . $letters;
        $n = intdiv($n - 1, 26);
    }
    return $letters;
}