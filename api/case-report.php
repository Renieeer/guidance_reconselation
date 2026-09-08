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
require_once 'school-config.php';

ensureSchoolsTable($conn);

function send_json(int $statusCode, array $payload): void {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

function table_exists(mysqli $conn, string $name): bool {
    $result = $conn->query("SHOW TABLES LIKE '" . $conn->real_escape_string($name) . "'");
    return $result && $result->num_rows > 0;
}

/* Same 6 sections / 27 categories the counselor case workflow already uses
   (see api/get-case-section.php) — every case report table on the coordinator
   and SDO side groups by these instead of a fabricated category list. */
function fetch_sections(mysqli $conn): array {
    $result = $conn->query("
        SELECT s.SectionID, s.SectionCode, s.SectionName, cc.CaseId, cc.CategoryName
        FROM section s
        LEFT JOIN case_category cc ON cc.SectionID = s.SectionID
        ORDER BY s.SectionID ASC, cc.CategoryName ASC
    ");

    $sections = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $sid = (string)$row['SectionID'];
            if (!isset($sections[$sid])) {
                $sections[$sid] = [
                    'sectionId' => $sid,
                    'sectionCode' => $row['SectionCode'],
                    'sectionName' => $row['SectionName'],
                    'categories' => []
                ];
            }
            if ($row['CaseId']) {
                $sections[$sid]['categories'][] = [
                    'categoryId' => (string)$row['CaseId'],
                    'categoryName' => $row['CategoryName']
                ];
            }
        }
    }

    return array_values($sections);
}

/** All school_name values assigned to $district ("" / "Unassigned" = no district set). */
function schools_in_district(mysqli $conn, string $district): array {
    if ($district === '' || strcasecmp($district, 'Unassigned') === 0) {
        $result = $conn->query("SELECT school_name FROM schools WHERE is_active = 1 AND (district IS NULL OR district = '')");
    } else {
        $stmt = $conn->prepare('SELECT school_name FROM schools WHERE is_active = 1 AND district = ?');
        if (!$stmt) {
            return [];
        }
        $stmt->bind_param('s', $district);
        $stmt->execute();
        $result = $stmt->get_result();
    }

    $names = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $names[] = $row['school_name'];
        }
    }
    return $names;
}

/** Every active school's name, regardless of district — backs the "All
 *  Districts" view so it doesn't require picking a district at all. */
function all_active_school_names(mysqli $conn): array {
    $result = $conn->query("SELECT school_name FROM schools WHERE is_active = 1");
    $names = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $names[] = $row['school_name'];
        }
    }
    return $names;
}

function zero_grade_buckets(array $gradeKeys): array {
    $buckets = [];
    foreach ($gradeKeys as $gradeKey) {
        $buckets[$gradeKey] = ['m' => 0, 'f' => 0];
    }
    return $buckets;
}

/** SQL fragment + extra bind types/values for filtering a date column by
 *  period: 'weekly' (this calendar week), 'monthly' (this calendar month),
 *  'quarterly' (this calendar quarter), 'annually' (this calendar year),
 *  'custom' (explicit start/end), or anything else (no filter — all time).
 *  $column defaults to counselor_case_scenarios.case_date; district_summary
 *  passes referral.date_submitted instead. */
function case_date_condition(string $period, string $start, string $end, string $column = 'case_date'): array {
    switch ($period) {
        case 'weekly':
            return [" AND YEARWEEK($column, 1) = YEARWEEK(CURDATE(), 1)", '', []];
        case 'monthly':
            return [" AND YEAR($column) = YEAR(CURDATE()) AND MONTH($column) = MONTH(CURDATE())", '', []];
        case 'quarterly':
            return [" AND YEAR($column) = YEAR(CURDATE()) AND QUARTER($column) = QUARTER(CURDATE())", '', []];
        case 'annually':
            return [" AND YEAR($column) = YEAR(CURDATE())", '', []];
        case 'custom':
            if ($start !== '' && $end !== '') {
                return [" AND $column BETWEEN ? AND ?", 'ss', [$start, $end]];
            }
            return ['', '', []];
        default:
            return ['', '', []];
    }
}

$action = $_GET['action'] ?? 'categories';

/* ── CATEGORY x GRADE x GENDER BREAKDOWN ──
   Real source: counselor_case_scenarios (section/category set by the
   counselor's case workflow) + student_table for authoritative grade/sex
   (students_json only carries a display string, not queryable fields). */
if ($action === 'categories') {
    $school = trim((string)($_GET['school'] ?? ''));
    $district = trim((string)($_GET['district'] ?? ''));
    $gradeScope = grade_scope_to_list($_GET['grade_scope'] ?? '');
    $gradeKeys = ['7', '8', '9', '10', '11', '12'];

    $period = trim((string)($_GET['period'] ?? 'all'));
    $rangeStart = trim((string)($_GET['start'] ?? ''));
    $rangeEnd = trim((string)($_GET['end'] ?? ''));
    [$dateSql, $dateTypes, $dateValues] = case_date_condition($period, $rangeStart, $rangeEnd);

    $schoolNames = [];
    if ($school !== '') {
        $schoolNames = [$school];
    } elseif (strcasecmp($district, 'all') === 0) {
        $schoolNames = all_active_school_names($conn);
    } elseif ($district !== '') {
        $schoolNames = schools_in_district($conn, $district);
    }

    $sections = fetch_sections($conn);

    // Seed every real category (plus one "uncategorized" bucket per section,
    // for cases whose category hasn't been chosen yet) with zeros, so the
    // frontend always gets a complete, predictable shape.
    $counts = [];
    foreach ($sections as $section) {
        foreach ($section['categories'] as $cat) {
            $counts[$cat['categoryId']] = zero_grade_buckets($gradeKeys);
        }
        $counts['section-' . $section['sectionId'] . '-uncategorized'] = zero_grade_buckets($gradeKeys);
    }

    if (table_exists($conn, 'counselor_case_scenarios') && !empty($schoolNames)) {
        $placeholders = implode(',', array_fill(0, count($schoolNames), '?'));
        $types = str_repeat('s', count($schoolNames));
        $stmt = $conn->prepare("
            SELECT section_id, category_id, students_json
            FROM counselor_case_scenarios
            WHERE school_attended IN ($placeholders)$dateSql
        ");

        if ($stmt) {
            $bindTypes = $types . $dateTypes;
            $bindValues = array_merge($schoolNames, $dateValues);
            $stmt->bind_param($bindTypes, ...$bindValues);
            $stmt->execute();
            $result = $stmt->get_result();

            $caseRows = [];
            $studentIds = [];
            while ($row = $result->fetch_assoc()) {
                $students = json_decode((string)$row['students_json'], true) ?: [];
                $ids = [];
                foreach ($students as $s) {
                    // Cases can list peers/witnesses alongside the actual
                    // subject (see the studentRole select in counseling.php:
                    // 'Primary student' | 'Peer involved' | 'Witness' |
                    // 'Other') — only the primary student is who this case
                    // is "about", so only they count toward the tally.
                    $role = trim((string)($s['role'] ?? ''));
                    if ($role !== '' && $role !== 'Primary student') {
                        continue;
                    }
                    $sid = trim((string)($s['id'] ?? $s['StudentId'] ?? $s['studentId'] ?? ''));
                    if ($sid !== '') {
                        $ids[] = $sid;
                        $studentIds[$sid] = true;
                    }
                }
                $caseRows[] = [
                    'sectionId' => (string)$row['section_id'],
                    'categoryId' => trim((string)($row['category_id'] ?? '')),
                    'studentIds' => $ids
                ];
            }
            $stmt->close();

            $studentInfo = [];
            if (!empty($studentIds)) {
                $idList = array_keys($studentIds);
                $idPlaceholders = implode(',', array_fill(0, count($idList), '?'));
                $idTypes = str_repeat('s', count($idList));
                $studentStmt = $conn->prepare("SELECT StudentId, Grade, Sex FROM student_table WHERE StudentId IN ($idPlaceholders)");
                if ($studentStmt) {
                    $studentStmt->bind_param($idTypes, ...$idList);
                    $studentStmt->execute();
                    $studentResult = $studentStmt->get_result();
                    while ($srow = $studentResult->fetch_assoc()) {
                        $studentInfo[$srow['StudentId']] = [
                            'grade' => normalize_grade_number($srow['Grade']),
                            'sex' => (string)($srow['Sex'] ?? '')
                        ];
                    }
                    $studentStmt->close();
                }
            }

            foreach ($caseRows as $caseRow) {
                $bucketKey = $caseRow['categoryId'] !== ''
                    ? $caseRow['categoryId']
                    : 'section-' . $caseRow['sectionId'] . '-uncategorized';

                if (!isset($counts[$bucketKey])) {
                    $counts[$bucketKey] = zero_grade_buckets($gradeKeys);
                }

                foreach ($caseRow['studentIds'] as $sid) {
                    $info = $studentInfo[$sid] ?? null;
                    if (!$info || $info['grade'] === null) {
                        continue;
                    }
                    if (!empty($gradeScope) && !in_array($info['grade'], $gradeScope, true)) {
                        continue;
                    }

                    $gradeKey = (string)$info['grade'];
                    if (!isset($counts[$bucketKey][$gradeKey])) {
                        $counts[$bucketKey][$gradeKey] = ['m' => 0, 'f' => 0];
                    }
                    if ($info['sex'] === 'Male') {
                        $counts[$bucketKey][$gradeKey]['m']++;
                    } elseif ($info['sex'] === 'Female') {
                        $counts[$bucketKey][$gradeKey]['f']++;
                    }
                }
            }
        }
    }

    send_json(200, [
        'success' => true,
        'grades' => array_map('intval', $gradeKeys),
        'sections' => $sections,
        'counts' => $counts
    ]);
}

/* ── INDIVIDUAL CASE LIST (filterable, "search results" style) ──
   Same real source as 'categories' (counselor_case_scenarios joined against
   student_table for authoritative grade/sex) but returns one row per case
   instead of pre-aggregated counts, so the frontend can filter by any
   combination of period/category/grade/gender/status/free-text search and
   render a list of matching cases instead of the pivot table. */
if ($action === 'list') {
    $school = trim((string)($_GET['school'] ?? ''));
    $district = trim((string)($_GET['district'] ?? ''));
    $gradeScope = grade_scope_to_list($_GET['grade_scope'] ?? '');

    $period = trim((string)($_GET['period'] ?? 'all'));
    $rangeStart = trim((string)($_GET['start'] ?? ''));
    $rangeEnd = trim((string)($_GET['end'] ?? ''));
    [$dateSql, $dateTypes, $dateValues] = case_date_condition($period, $rangeStart, $rangeEnd);

    $categoryFilter = trim((string)($_GET['category'] ?? ''));
    $gradeFilter = trim((string)($_GET['grade'] ?? ''));
    $genderFilter = trim((string)($_GET['gender'] ?? ''));
    $statusFilter = trim((string)($_GET['status'] ?? ''));
    $search = strtolower(trim((string)($_GET['search'] ?? '')));

    $schoolNames = [];
    if ($school !== '') {
        $schoolNames = [$school];
    } elseif ($district !== '') {
        $schoolNames = schools_in_district($conn, $district);
    }

    $rows = [];

    if (table_exists($conn, 'counselor_case_scenarios') && !empty($schoolNames)) {
        $placeholders = implode(',', array_fill(0, count($schoolNames), '?'));
        $types = str_repeat('s', count($schoolNames));
        $stmt = $conn->prepare("
            SELECT id, case_uid, counselor_name, section_id, section_name, category_id, category_name,
                   case_title, case_date, case_summary, status, students_json
            FROM counselor_case_scenarios
            WHERE school_attended IN ($placeholders)$dateSql
            ORDER BY case_date DESC, id DESC
        ");

        if ($stmt) {
            $bindTypes = $types . $dateTypes;
            $bindValues = array_merge($schoolNames, $dateValues);
            $stmt->bind_param($bindTypes, ...$bindValues);
            $stmt->execute();
            $result = $stmt->get_result();

            $caseRows = [];
            $studentIds = [];
            while ($row = $result->fetch_assoc()) {
                $students = json_decode((string)$row['students_json'], true) ?: [];
                $primary = null;
                foreach ($students as $s) {
                    $role = trim((string)($s['role'] ?? ''));
                    if ($role === '' || $role === 'Primary student') {
                        $primary = $s;
                        break;
                    }
                }
                if (!$primary && !empty($students)) {
                    $primary = $students[0];
                }
                $sid = $primary ? trim((string)($primary['id'] ?? '')) : '';
                if ($sid !== '') {
                    $studentIds[$sid] = true;
                }

                $caseRows[] = [
                    'id' => (int)$row['id'],
                    'caseUid' => $row['case_uid'],
                    'counselorName' => $row['counselor_name'],
                    'sectionId' => (string)$row['section_id'],
                    'sectionName' => $row['section_name'],
                    'categoryId' => trim((string)($row['category_id'] ?? '')),
                    'categoryName' => $row['category_name'] ?: 'Uncategorized',
                    'caseTitle' => $row['case_title'],
                    'caseDate' => $row['case_date'],
                    'summary' => $row['case_summary'],
                    'status' => $row['status'] ?: 'pending',
                    'studentId' => $sid,
                    'studentName' => $primary['name'] ?? 'Unknown student'
                ];
            }
            $stmt->close();

            $studentInfo = [];
            if (!empty($studentIds)) {
                $idList = array_keys($studentIds);
                $idPlaceholders = implode(',', array_fill(0, count($idList), '?'));
                $idTypes = str_repeat('s', count($idList));
                $studentStmt = $conn->prepare("SELECT StudentId, Grade, Sex FROM student_table WHERE StudentId IN ($idPlaceholders)");
                if ($studentStmt) {
                    $studentStmt->bind_param($idTypes, ...$idList);
                    $studentStmt->execute();
                    $studentResult = $studentStmt->get_result();
                    while ($srow = $studentResult->fetch_assoc()) {
                        $studentInfo[$srow['StudentId']] = [
                            'grade' => normalize_grade_number($srow['Grade']),
                            'sex' => (string)($srow['Sex'] ?? '')
                        ];
                    }
                    $studentStmt->close();
                }
            }

            foreach ($caseRows as $case) {
                $info = $case['studentId'] !== '' ? ($studentInfo[$case['studentId']] ?? null) : null;
                $grade = $info['grade'] ?? null;
                $sex = $info['sex'] ?? '';

                if (!empty($gradeScope) && ($grade === null || !in_array($grade, $gradeScope, true))) {
                    continue;
                }
                if ($gradeFilter !== '' && (string)$grade !== $gradeFilter) {
                    continue;
                }
                if ($genderFilter !== '' && $sex !== $genderFilter) {
                    continue;
                }
                if ($categoryFilter !== '') {
                    $bucketKey = $case['categoryId'] !== '' ? $case['categoryId'] : ('section-' . $case['sectionId'] . '-uncategorized');
                    if ($bucketKey !== $categoryFilter) {
                        continue;
                    }
                }
                if ($statusFilter !== '' && strcasecmp((string)$case['status'], $statusFilter) !== 0) {
                    continue;
                }
                if ($search !== '') {
                    $haystack = strtolower($case['studentName'] . ' ' . $case['caseTitle'] . ' ' . $case['categoryName'] . ' ' . $case['sectionName'] . ' ' . $case['summary'] . ' ' . $case['caseUid']);
                    if (strpos($haystack, $search) === false) {
                        continue;
                    }
                }

                $rows[] = [
                    'id' => $case['id'],
                    'caseUid' => $case['caseUid'],
                    'studentName' => $case['studentName'],
                    'grade' => $grade,
                    'gender' => $sex,
                    'sectionName' => $case['sectionName'],
                    'categoryName' => $case['categoryName'],
                    'caseTitle' => $case['caseTitle'],
                    'caseDate' => $case['caseDate'],
                    'summary' => $case['summary'],
                    'status' => $case['status'],
                    'counselorName' => $case['counselorName']
                ];
            }
        }
    }

    send_json(200, ['success' => true, 'data' => $rows]);
}

/* ── DISTINCT DISTRICT LIST ── (for building district selector buttons) */
if ($action === 'districts') {
    $result = $conn->query("SELECT DISTINCT district FROM schools WHERE is_active = 1 AND district IS NOT NULL AND district <> '' ORDER BY district ASC");
    $districts = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $districts[] = $row['district'];
        }
    }

    $unassignedCheck = $conn->query("SELECT 1 FROM schools WHERE is_active = 1 AND (district IS NULL OR district = '') LIMIT 1");
    $hasUnassigned = $unassignedCheck && $unassignedCheck->num_rows > 0;

    send_json(200, ['success' => true, 'districts' => $districts, 'hasUnassigned' => $hasUnassigned]);
}

/* ── PER-SCHOOL CASE + GENDER BREAKDOWN ──
   Backs the district report's "one row per school" view: for a specific
   district, or every active school when district=all ("All Districts" —
   no need to pick each district/school individually), return each school's
   total case count and Male/Female split. Same counting rule as
   'categories' (one primary student per case = one count) but summed per
   school instead of per category/grade. */
if ($action === 'school_breakdown') {
    $district = trim((string)($_GET['district'] ?? ''));
    $period = trim((string)($_GET['period'] ?? 'all'));
    $rangeStart = trim((string)($_GET['start'] ?? ''));
    $rangeEnd = trim((string)($_GET['end'] ?? ''));
    [$dateSql, $dateTypes, $dateValues] = case_date_condition($period, $rangeStart, $rangeEnd);

    $schools = [];
    if ($district !== '' && strcasecmp($district, 'all') !== 0) {
        $districtLabel = strcasecmp($district, 'Unassigned') === 0 ? 'Unassigned' : $district;
        foreach (schools_in_district($conn, $district) as $name) {
            $schools[$name] = ['school' => $name, 'district' => $districtLabel, 'total' => 0, 'male' => 0, 'female' => 0];
        }
    } else {
        $result = $conn->query("SELECT school_name, COALESCE(NULLIF(district, ''), 'Unassigned') AS district FROM schools WHERE is_active = 1 ORDER BY district ASC, school_name ASC");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $schools[$row['school_name']] = ['school' => $row['school_name'], 'district' => $row['district'], 'total' => 0, 'male' => 0, 'female' => 0];
            }
        }
    }

    $schoolNames = array_keys($schools);

    if (table_exists($conn, 'counselor_case_scenarios') && !empty($schoolNames)) {
        $placeholders = implode(',', array_fill(0, count($schoolNames), '?'));
        $types = str_repeat('s', count($schoolNames));
        $stmt = $conn->prepare("
            SELECT school_attended, students_json
            FROM counselor_case_scenarios
            WHERE school_attended IN ($placeholders)$dateSql
        ");

        if ($stmt) {
            $bindTypes = $types . $dateTypes;
            $bindValues = array_merge($schoolNames, $dateValues);
            $stmt->bind_param($bindTypes, ...$bindValues);
            $stmt->execute();
            $result = $stmt->get_result();

            $caseRows = [];
            $studentIds = [];
            while ($row = $result->fetch_assoc()) {
                $students = json_decode((string)$row['students_json'], true) ?: [];
                $ids = [];
                foreach ($students as $s) {
                    $role = trim((string)($s['role'] ?? ''));
                    if ($role !== '' && $role !== 'Primary student') {
                        continue;
                    }
                    $sid = trim((string)($s['id'] ?? $s['StudentId'] ?? $s['studentId'] ?? ''));
                    if ($sid !== '') {
                        $ids[] = $sid;
                        $studentIds[$sid] = true;
                    }
                }
                $caseRows[] = ['school' => $row['school_attended'], 'studentIds' => $ids];
            }
            $stmt->close();

            $studentSex = [];
            if (!empty($studentIds)) {
                $idList = array_keys($studentIds);
                $idPlaceholders = implode(',', array_fill(0, count($idList), '?'));
                $idTypes = str_repeat('s', count($idList));
                $studentStmt = $conn->prepare("SELECT StudentId, Sex FROM student_table WHERE StudentId IN ($idPlaceholders)");
                if ($studentStmt) {
                    $studentStmt->bind_param($idTypes, ...$idList);
                    $studentStmt->execute();
                    $studentResult = $studentStmt->get_result();
                    while ($srow = $studentResult->fetch_assoc()) {
                        $studentSex[$srow['StudentId']] = (string)($srow['Sex'] ?? '');
                    }
                    $studentStmt->close();
                }
            }

            foreach ($caseRows as $caseRow) {
                if (!isset($schools[$caseRow['school']])) {
                    continue;
                }
                foreach ($caseRow['studentIds'] as $sid) {
                    $sex = $studentSex[$sid] ?? '';
                    $schools[$caseRow['school']]['total']++;
                    if ($sex === 'Male') {
                        $schools[$caseRow['school']]['male']++;
                    } elseif ($sex === 'Female') {
                        $schools[$caseRow['school']]['female']++;
                    }
                }
            }
        }
    }

    send_json(200, ['success' => true, 'schools' => array_values($schools)]);
}

/* ── PER-DISTRICT ROLLUP ── (schools, staff headcounts, referrals, resolution)
   Real source: schools.district joined against users_tables/referral by
   school name — replaces the old Math.random() comparative tables in
   pages/sdo/analytics.js and pages/sdo/school-reports.js. */
if ($action === 'district_summary') {
    $period = trim((string)($_GET['period'] ?? 'all'));
    $rangeStart = trim((string)($_GET['start'] ?? ''));
    $rangeEnd = trim((string)($_GET['end'] ?? ''));
    [$dateSql, $dateTypes, $dateValues] = case_date_condition($period, $rangeStart, $rangeEnd, 'r.date_submitted');

    $staffQuery = $conn->query("
        SELECT
            COALESCE(NULLIF(s.district, ''), 'Unassigned') AS district,
            COUNT(DISTINCT s.school_code) AS school_count,
            SUM(CASE WHEN u.Type = 'teacher' THEN 1 ELSE 0 END) AS teacher_count,
            SUM(CASE WHEN u.Type IN ('coordinator', 'counselor-and-coordinator') THEN 1 ELSE 0 END) AS coordinator_count,
            SUM(CASE WHEN u.Type IN ('counselor', 'counselor-and-coordinator') THEN 1 ELSE 0 END) AS counselor_count
        FROM schools s
        LEFT JOIN users_tables u ON u.school_attended = s.school_name
        WHERE s.is_active = 1
        GROUP BY district
    ");

    $districts = [];
    if ($staffQuery) {
        while ($row = $staffQuery->fetch_assoc()) {
            $districts[$row['district']] = [
                'district' => $row['district'],
                'schoolCount' => (int)$row['school_count'],
                'teacherCount' => (int)$row['teacher_count'],
                'coordinatorCount' => (int)$row['coordinator_count'],
                'counselorCount' => (int)$row['counselor_count'],
                'referralCount' => 0,
                'studentsReferred' => 0,
                'resolvedCount' => 0,
                'lastActivity' => null
            ];
        }
    }

    // Joined on a single resolved school per referral (the student's own
    // school, falling back to the referring staff's school) rather than
    // "school_attended = ? OR student_school = ?" — with a plain equality
    // that OR would have matched two different schools.rows for the same
    // referral whenever those two columns disagree, double-counting it
    // into two districts.
    $referralSql = "
        SELECT
            COALESCE(NULLIF(s.district, ''), 'Unassigned') AS district,
            COUNT(r.ReferralID) AS referral_count,
            COUNT(DISTINCT COALESCE(r.student_id, r.StudentID)) AS students_referred,
            SUM(CASE WHEN COALESCE(r.stage, 1) = 6 THEN 1 ELSE 0 END) AS resolved_count,
            MAX(COALESCE(r.updated_at, r.date_submitted)) AS last_activity
        FROM schools s
        LEFT JOIN referral r ON COALESCE(NULLIF(r.student_school, ''), r.school_attended) = s.school_name$dateSql
        WHERE s.is_active = 1
        GROUP BY district
    ";
    $referralStmt = $conn->prepare($referralSql);
    $referralQuery = false;
    if ($referralStmt) {
        if ($dateTypes !== '') {
            $referralStmt->bind_param($dateTypes, ...$dateValues);
        }
        $referralStmt->execute();
        $referralQuery = $referralStmt->get_result();
    }

    if ($referralQuery) {
        while ($row = $referralQuery->fetch_assoc()) {
            $district = $row['district'];
            if (!isset($districts[$district])) {
                $districts[$district] = [
                    'district' => $district,
                    'schoolCount' => 0,
                    'teacherCount' => 0,
                    'coordinatorCount' => 0,
                    'counselorCount' => 0,
                    'referralCount' => 0,
                    'studentsReferred' => 0,
                    'resolvedCount' => 0,
                    'lastActivity' => null
                ];
            }
            $districts[$district]['referralCount'] = (int)$row['referral_count'];
            $districts[$district]['studentsReferred'] = (int)$row['students_referred'];
            $districts[$district]['resolvedCount'] = (int)$row['resolved_count'];
            $districts[$district]['lastActivity'] = $row['last_activity'];
        }
    }

    send_json(200, ['success' => true, 'districts' => array_values($districts)]);
}

/* ── PERSONAL-SOCIAL CONCERNS, PER DISTRICT ──
   Backs the "Division Monthly Monitoring Report of Learners' Personal-Social
   Concerns" export. Same section/category set as 'categories' (every real
   section and category — plus one "uncategorized" bucket per section for
   cases whose category hasn't been chosen yet — so the report covers 100%
   of case data, not a curated subset) and the same "one count per primary
   student" counting rule as 'categories'/'school_breakdown', but bucketed
   by the case's school's district instead of by grade — plus a '__ALL__'
   bucket for the division-wide ("Secondary") total column. */
if ($action === 'personal_social_concerns') {
    $period = trim((string)($_GET['period'] ?? 'all'));
    $rangeStart = trim((string)($_GET['start'] ?? ''));
    $rangeEnd = trim((string)($_GET['end'] ?? ''));
    [$dateSql, $dateTypes, $dateValues] = case_date_condition($period, $rangeStart, $rangeEnd);

    $schoolDistrict = [];
    $result = $conn->query("SELECT school_name, COALESCE(NULLIF(district, ''), 'Unassigned') AS district FROM schools WHERE is_active = 1");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $schoolDistrict[$row['school_name']] = $row['district'];
        }
    }

    $districts = array_values(array_unique(array_values($schoolDistrict)));
    sort($districts);

    $sections = fetch_sections($conn);

    // Seed every real category (+ one uncategorized bucket per section) at
    // zero for every district and the division-wide total, so the frontend
    // always gets a complete, predictable shape covering every category —
    // not just the ones that happen to already have cases.
    $counts = ['__ALL__' => []];
    foreach ($districts as $d) {
        $counts[$d] = [];
    }
    foreach (array_keys($counts) as $groupKey) {
        foreach ($sections as $section) {
            foreach ($section['categories'] as $cat) {
                $counts[$groupKey][$cat['categoryId']] = 0;
            }
            $counts[$groupKey]['section-' . $section['sectionId'] . '-uncategorized'] = 0;
        }
    }

    if (table_exists($conn, 'counselor_case_scenarios')) {
        $stmt = $conn->prepare("SELECT school_attended, section_id, category_id, students_json FROM counselor_case_scenarios WHERE 1=1$dateSql");
        if ($stmt) {
            if ($dateTypes !== '') {
                $stmt->bind_param($dateTypes, ...$dateValues);
            }
            $stmt->execute();
            $result = $stmt->get_result();

            while ($row = $result->fetch_assoc()) {
                $district = $schoolDistrict[$row['school_attended']] ?? null;
                if ($district === null) {
                    continue; // school not active / not in schools table — skip
                }

                $categoryId = trim((string)$row['category_id']);
                $bucketKey = $categoryId !== '' ? $categoryId : ('section-' . $row['section_id'] . '-uncategorized');

                $students = json_decode((string)$row['students_json'], true) ?: [];
                $primaryCount = 0;
                foreach ($students as $s) {
                    $role = trim((string)($s['role'] ?? ''));
                    if ($role === '' || $role === 'Primary student') {
                        $primaryCount++;
                    }
                }
                if ($primaryCount === 0) {
                    continue;
                }

                $counts[$district][$bucketKey] = ($counts[$district][$bucketKey] ?? 0) + $primaryCount;
                $counts['__ALL__'][$bucketKey] = ($counts['__ALL__'][$bucketKey] ?? 0) + $primaryCount;
            }
            $stmt->close();
        }
    }

    send_json(200, ['success' => true, 'districts' => $districts, 'sections' => $sections, 'counts' => $counts]);
}

send_json(400, ['success' => false, 'message' => 'Unknown action.']);
