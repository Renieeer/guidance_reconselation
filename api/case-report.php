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

function zero_grade_buckets(array $gradeKeys): array {
    $buckets = [];
    foreach ($gradeKeys as $gradeKey) {
        $buckets[$gradeKey] = ['m' => 0, 'f' => 0];
    }
    return $buckets;
}

/** SQL fragment + extra bind types/values for filtering counselor_case_scenarios.case_date
 *  by period: 'weekly' (this calendar week), 'monthly' (this calendar month),
 *  'annually' (this calendar year), 'custom' (explicit start/end), or anything
 *  else (no filter — all time). */
function case_date_condition(string $period, string $start, string $end): array {
    switch ($period) {
        case 'weekly':
            return [' AND YEARWEEK(case_date, 1) = YEARWEEK(CURDATE(), 1)', '', []];
        case 'monthly':
            return [' AND YEAR(case_date) = YEAR(CURDATE()) AND MONTH(case_date) = MONTH(CURDATE())', '', []];
        case 'annually':
            return [' AND YEAR(case_date) = YEAR(CURDATE())', '', []];
        case 'custom':
            if ($start !== '' && $end !== '') {
                return [' AND case_date BETWEEN ? AND ?', 'ss', [$start, $end]];
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

/* ── PER-DISTRICT ROLLUP ── (schools, staff headcounts, referrals, resolution)
   Real source: schools.district joined against users_tables/referral by
   school name — replaces the old Math.random() comparative tables in
   pages/sdo/analytics.js and pages/sdo/school-reports.js. */
if ($action === 'district_summary') {
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

    $referralQuery = $conn->query("
        SELECT
            COALESCE(NULLIF(s.district, ''), 'Unassigned') AS district,
            COUNT(r.ReferralID) AS referral_count,
            COUNT(DISTINCT COALESCE(r.student_id, r.StudentID)) AS students_referred,
            SUM(CASE WHEN COALESCE(r.stage, 1) = 6 THEN 1 ELSE 0 END) AS resolved_count,
            MAX(COALESCE(r.updated_at, r.date_submitted)) AS last_activity
        FROM schools s
        LEFT JOIN referral r ON (r.school_attended = s.school_name OR r.student_school = s.school_name)
        WHERE s.is_active = 1
        GROUP BY district
    ");

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

send_json(400, ['success' => false, 'message' => 'Unknown action.']);
