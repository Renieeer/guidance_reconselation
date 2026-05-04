<?php
// Enable CORS for frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
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

try {
    $studentColumns = getColumns($conn, 'student_table');
    $studentIdColumn = isset($studentColumns['StudentId']) ? 'StudentId' : (isset($studentColumns['id']) ? 'id' : null);

    if (!$studentIdColumn) {
        throw new Exception('student_table is missing both StudentId and id columns');
    }

    // Get student_id from query parameters
    $student_id = isset($_GET['student_id']) ? trim($_GET['student_id']) : null;
    
    if (!$student_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'student_id is required']);
        exit;
    }

    // Fetch student main information from student_table
    $query = "SELECT * FROM student_table WHERE `{$studentIdColumn}` = ?";
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("s", $student_id);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $student = $result->fetch_assoc();
    $stmt->close();
    
    if (!$student) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Student not found']);
        exit;
    }

    if (isset($student['Grade']) && !isset($student['grade_id'])) {
        $student['grade_id'] = $student['Grade'];
    }

    if (isset($student['Sex']) && !isset($student['sex'])) {
        $student['sex'] = $student['Sex'];
    }

    // Fetch education records
    $education = [];
    $educationColumns = getColumns($conn, 'educational_background');
    if (isset($educationColumns['StudentId'])) {
        $query = "SELECT * FROM educational_background WHERE StudentId = ?";
        $stmt = $conn->prepare($query);
        if ($stmt) {
            $stmt->bind_param("s", $student_id);
            if ($stmt->execute()) {
                $result = $stmt->get_result();
                while ($row = $result->fetch_assoc()) {
                    $education[] = $row;
                }
            }
            $stmt->close();
        }
    } elseif (isset($student['EducationalBackground_EducationalBgId']) && $student['EducationalBackground_EducationalBgId'] !== null && $student['EducationalBackground_EducationalBgId'] !== '') {
        $query = "SELECT * FROM educational_background WHERE EducationalBgId = ?";
        $stmt = $conn->prepare($query);
        if ($stmt) {
            $eduId = $student['EducationalBackground_EducationalBgId'];
            $stmt->bind_param("i", $eduId);
            if ($stmt->execute()) {
                $result = $stmt->get_result();
                while ($row = $result->fetch_assoc()) {
                    $education[] = $row;
                }
            }
            $stmt->close();
        }
    }

    // Fetch organization records
    $organizations = [];
    if (tableExists($conn, 'organization')) {
        $query = "SELECT * FROM organization WHERE StudentId = ?";
        $stmt = $conn->prepare($query);
        if ($stmt) {
            $stmt->bind_param("s", $student_id);
            if ($stmt->execute()) {
                $result = $stmt->get_result();
                while ($row = $result->fetch_assoc()) {
                    $organizations[] = $row;
                }
            }
            $stmt->close();
        }
    }

    // Fetch sibling records (if there's a siblings table, otherwise return empty)
    $siblings = [];
    if (tableExists($conn, 'sibling')) {
        $query = "SELECT * FROM sibling WHERE StudentId = ?";
        $stmt = $conn->prepare($query);
        if ($stmt) {
            $stmt->bind_param("s", $student_id);
            if ($stmt->execute()) {
                $result = $stmt->get_result();
                while ($row = $result->fetch_assoc()) {
                    $siblings[] = $row;
                }
            }
            $stmt->close();
        }
    }

    // Fetch friend records (supports either friend or friends_table)
    $friends = [];
    $friendTable = tableExists($conn, 'friend') ? 'friend' : (tableExists($conn, 'friends_table') ? 'friends_table' : null);
    if ($friendTable) {
        $query = "SELECT * FROM `{$friendTable}` WHERE StudentId = ?";
        $stmt = $conn->prepare($query);
        if ($stmt) {
            $stmt->bind_param("s", $student_id);
            if ($stmt->execute()) {
                $result = $stmt->get_result();
                while ($row = $result->fetch_assoc()) {
                    $friends[] = $row;
                }
            }
            $stmt->close();
        }
    }

    // Fetch family status records
    $familyStatus = [];
    if (tableExists($conn, 'family_status')) {
        $familyColumns = getColumns($conn, 'family_status');
        $familyStudentColumn = isset($familyColumns['StudentId']) ? 'StudentId' : (isset($familyColumns['StudentID']) ? 'StudentID' : null);

        if ($familyStudentColumn) {
            $query = "SELECT * FROM family_status WHERE `{$familyStudentColumn}` = ? LIMIT 1";
            $stmt = $conn->prepare($query);
            if ($stmt) {
                $stmt->bind_param("s", $student_id);
                if ($stmt->execute()) {
                    $result = $stmt->get_result();
                    $familyStatus = $result->fetch_assoc() ?: [];
                }
                $stmt->close();
            }
        }
    }

    // Fetch parent records
    $parents = [];
    if (tableExists($conn, 'parent_table')) {
        $parentQuery = "SELECT * FROM parent_table WHERE ParentId IN (?, ?) ORDER BY ParentId";
        $stmt = $conn->prepare($parentQuery);
        if ($stmt) {
            $fatherParentId = 'father_' . $student_id;
            $motherParentId = 'mother_' . $student_id;
            $stmt->bind_param("ss", $fatherParentId, $motherParentId);
            if ($stmt->execute()) {
                $result = $stmt->get_result();
                while ($row = $result->fetch_assoc()) {
                    $parents[] = $row;
                }
            }
            $stmt->close();
        }
    }

    $father = $parents[0] ?? [];
    $mother = $parents[1] ?? [];

    // Fetch guardian records
    $guardians = [];
    if (tableExists($conn, 'guardian')) {
        $query = "SELECT * FROM guardian WHERE StudentId = ? ORDER BY GuardianID ASC";
        $stmt = $conn->prepare($query);
        if ($stmt) {
            $stmt->bind_param("s", $student_id);
            if ($stmt->execute()) {
                $result = $stmt->get_result();
                while ($row = $result->fetch_assoc()) {
                    $guardians[] = $row;
                }
            }
            $stmt->close();
        }
    }

    $guardian = $guardians[0] ?? [];

    // Return success response with all data
    echo json_encode([
        'success' => true,
        'student' => $student,
        'education' => $education,
        'organizations' => $organizations,
        'siblings' => $siblings,
        'friends' => $friends,
        'family_status' => $familyStatus,
        'parents' => $parents,
        'guardians' => $guardians,
        'father_name' => trim(($father['FirstName'] ?? '') . ' ' . ($father['MiddleName'] ?? '') . ' ' . ($father['LastName'] ?? '')),
        'mother_name' => trim(($mother['FirstName'] ?? '') . ' ' . ($mother['MiddleName'] ?? '') . ' ' . ($mother['LastName'] ?? '')),
        'guardian_name' => trim(($guardian['FirstName'] ?? '') . ' ' . ($guardian['MiddleName'] ?? '') . ' ' . ($guardian['LastName'] ?? '')),
        'father_FirstName' => $father['FirstName'] ?? '',
        'father_MiddleName' => $father['MiddleName'] ?? '',
        'father_LastName' => $father['LastName'] ?? '',
        'father_NickName' => $father['NickName'] ?? '',
        'father_BirthDate' => $father['BirthDate'] ?? '',
        'father_PlaceOfBirth' => $father['PlaceOfBirth'] ?? '',
        'father_Occupation' => $father['Occupation'] ?? '',
        'father_ContactNumber' => $father['ContactNumber'] ?? '',
        'father_Address' => $father['Address'] ?? '',
        'father_HighestEducationalAttainment' => $father['HighestEducationAttained'] ?? '',
        'father_isDeceased' => $father['IsDeceased'] ?? '',
        'mother_FirstName' => $mother['FirstName'] ?? '',
        'mother_MiddleName' => $mother['MiddleName'] ?? '',
        'mother_LastName' => $mother['LastName'] ?? '',
        'mother_NickName' => $mother['NickName'] ?? '',
        'mother_BirthDate' => $mother['BirthDate'] ?? '',
        'mother_PlaceOfBirth' => $mother['PlaceOfBirth'] ?? '',
        'mother_Occupation' => $mother['Occupation'] ?? '',
        'mother_ContactNumber' => $mother['ContactNumber'] ?? '',
        'mother_Address' => $mother['Address'] ?? '',
        'mother_HighestEducationalAttainment' => $mother['HighestEducationAttained'] ?? '',
        'mother_isDeceased' => $mother['IsDeceased'] ?? '',
        'guardian_FirstName' => $guardian['FirstName'] ?? '',
        'guardian_MiddleName' => $guardian['MiddleName'] ?? '',
        'guardian_LastName' => $guardian['LastName'] ?? '',
        'guardian_Relationship' => $guardian['Relationship'] ?? '',
        'guardian_Address' => $guardian['Address'] ?? '',
        'guardian_Landline' => $guardian['Landline'] ?? '',
        'guardian_MobileNumber' => $guardian['MobileNumber'] ?? ''
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred: ' . $e->getMessage()
    ]);
}
?>
