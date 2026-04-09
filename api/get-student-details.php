<?php
// Enable CORS for frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

try {
    // Include database connection
    require_once 'conn.php';

    // Get query parameters
    $student_id = intval($_GET['student_id'] ?? 0);

    if ($student_id === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing student_id parameter']);
        exit;
    }

    // Get student information from accounts table
    $student_query = "SELECT * FROM accounts WHERE id = ? AND user_type = 'student'";
    $stmt = $conn->prepare($student_query);
    $stmt->bind_param("i", $student_id);
    $stmt->execute();
    $student_result = $stmt->get_result();
    
    if ($student_result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Student not found']);
        exit;
    }

    $student = $student_result->fetch_assoc();
    $student['id'] = (int) $student['id'];
    $stmt->close();

    // Find StudentId in student_table - try multiple strategies
    $studentTableData = [];
    $possibleStudentIds = [];
    
    // Strategy 1: Look up by FirstName
    if (!empty($student['first_name'])) {
        $student_detail_query = "SELECT StudentId FROM student_table WHERE FirstName LIKE ? LIMIT 1";
        $stmt = $conn->prepare($student_detail_query);
        if ($stmt) {
            $searchName = '%' . $student['first_name'] . '%';
            $stmt->bind_param("s", $searchName);
            $stmt->execute();
            $detail_result = $stmt->get_result();
            if ($detail_result->num_rows > 0) {
                while ($row = $detail_result->fetch_assoc()) {
                    $possibleStudentIds[] = $row['StudentId'];
                }
            }
            $stmt->close();
        }
    }
    
    // Strategy 2: Try the account ID as a string
    $possibleStudentIds[] = (string)$student_id;
    
    // Fetch full student table data using first found StudentId
    if (!empty($possibleStudentIds)) {
        foreach ($possibleStudentIds as $tryStudentId) {
            $student_detail_query = "SELECT * FROM student_table WHERE StudentId = ? LIMIT 1";
            $stmt = $conn->prepare($student_detail_query);
            if ($stmt) {
                $stmt->bind_param("s", $tryStudentId);
                $stmt->execute();
                $detail_result = $stmt->get_result();
                if ($detail_result->num_rows > 0) {
                    $studentTableData = $detail_result->fetch_assoc();
                    // Found data, break the loop
                    break;
                }
                $stmt->close();
            }
        }
    }

    // Use the StudentId we found, with fallback to account ID
    $studentId = !empty($studentTableData['StudentId']) ? 
                 $studentTableData['StudentId'] : (string)$student_id;
    
    // All remaining data queries will use this $studentId

    
    // Get parent information using correct StudentId
    $parents = [];
    $parent_query = "SELECT * FROM parent_table WHERE StudentId = ?";
    $stmt = $conn->prepare($parent_query);
    if ($stmt) {
        $stmt->bind_param("s", $studentId);
        $stmt->execute();
        $parent_result = $stmt->get_result();
        while ($row = $parent_result->fetch_assoc()) {
            $parents[] = $row;
        }
        $stmt->close();
    }

    // Get guardian information using correct StudentId
    $guardians = [];
    $guardian_query = "SELECT * FROM guardian WHERE StudentId = ?";
    $stmt = $conn->prepare($guardian_query);
    if ($stmt) {
        $stmt->bind_param("s", $studentId);
        $stmt->execute();
        $guardian_result = $stmt->get_result();
        while ($row = $guardian_result->fetch_assoc()) {
            $guardians[] = $row;
        }
        $stmt->close();
    }

    // Get sibling information using correct StudentId
    $siblings = [];
    $sibling_query = "SELECT * FROM sibling WHERE StudentId = ?";
    $stmt = $conn->prepare($sibling_query);
    if ($stmt) {
        $stmt->bind_param("s", $studentId);
        $stmt->execute();
        $sibling_result = $stmt->get_result();
        while ($row = $sibling_result->fetch_assoc()) {
            $siblings[] = $row;
        }
        $stmt->close();
    }

    // Get education information using correct StudentId
    $education = [];
    $education_query = "SELECT * FROM educational_background WHERE StudentId = ?";
    $stmt = $conn->prepare($education_query);
    if ($stmt) {
        $stmt->bind_param("s", $studentId);
        $stmt->execute();
        $education_result = $stmt->get_result();
        while ($row = $education_result->fetch_assoc()) {
            $education[] = $row;
        }
        $stmt->close();
    }

    // Get organization information using correct StudentId
    $organizations = [];
    $org_query = "SELECT * FROM oraganization WHERE StudentId = ?";
    $stmt = $conn->prepare($org_query);
    if ($stmt) {
        $stmt->bind_param("s", $studentId);
        $stmt->execute();
        $org_result = $stmt->get_result();
        while ($row = $org_result->fetch_assoc()) {
            $organizations[] = $row;
        }
        $stmt->close();
    }

    // Get friends information using correct StudentId
    $friends = [];
    $friends_query = "SELECT * FROM friends_table WHERE StudentId = ?";
    $stmt = $conn->prepare($friends_query);
    if ($stmt) {
        $stmt->bind_param("s", $studentId);
        $stmt->execute();
        $friends_result = $stmt->get_result();
        while ($row = $friends_result->fetch_assoc()) {
            $friends[] = $row;
        }
        $stmt->close();
    }

    // Get family status using correct StudentId
    $familyStatus = [];
    $family_query = "SELECT * FROM family_status WHERE StudentId = ? LIMIT 1";
    $stmt = $conn->prepare($family_query);
    if ($stmt) {
        $stmt->bind_param("s", $studentId);
        $stmt->execute();
        $family_result = $stmt->get_result();
        if ($family_result->num_rows > 0) {
            $familyStatus = $family_result->fetch_assoc();
        }
        $stmt->close();
    }

    // Get referrals by student_id (lowercase) and student_name
    $referrals = [];
    $referral_query = "SELECT * FROM referral WHERE student_id = ? OR student_name LIKE ? ORDER BY date_submitted DESC";
    $stmt = $conn->prepare($referral_query);
    if ($stmt) {
        $studentIdStr = (string)$student_id;
        $name = '%' . $student['first_name'] . '%';
        $stmt->bind_param("ss", $studentIdStr, $name);
        $stmt->execute();
        $referral_result = $stmt->get_result();
        while ($row = $referral_result->fetch_assoc()) {
            $referrals[] = $row;
        }
        $stmt->close();
    }

    // Merge all student information
    $mergedStudent = array_merge($student, $studentTableData);
    
    // Add parent info
    if (!empty($parents)) {
        $mergedStudent['father_name'] = '';
        $mergedStudent['mother_name'] = '';
        
        foreach ($parents as $parent) {
            if ($parent['isDeceased'] !== 'Yes') {
                // Simplified: assign based on order
                if (empty($mergedStudent['father_name'])) {
                    $mergedStudent['father_name'] = $parent['FirstName'] . ' ' . $parent['LastName'];
                } else if (empty($mergedStudent['mother_name'])) {
                    $mergedStudent['mother_name'] = $parent['FirstName'] . ' ' . $parent['LastName'];
                }
            }
        }
    }

    // Add guardian info
    if (!empty($guardians)) {
        $mergedStudent['guardian_name'] = $guardians[0]['FirstName'] . ' ' . $guardians[0]['LastName'];
    } else {
        $mergedStudent['guardian_name'] = '';
    }

    // Add sibling count
    $mergedStudent['number_of_siblings'] = count($siblings);

    echo json_encode([
        'success' => true,
        'debug' => ['studentId_used' => $studentId, 'account_id' => $student_id],
        'student' => $mergedStudent,
        'parents' => $parents,
        'guardians' => $guardians,
        'siblings' => $siblings,
        'education' => $education,
        'organizations' => $organizations,
        'friends' => $friends,
        'family_status' => $familyStatus,
        'referrals' => $referrals
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'An error occurred: ' . $e->getMessage()
    ]);
}
?>

