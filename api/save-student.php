<?php

// Set JSON response header immediately
header('Content-Type: application/json');

// Include database connection
include 'conn.php';

// Handle GET request to load existing student data
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['StudentId'])) {
    $studentId = htmlspecialchars($_GET['StudentId']);
    
    $query = "SELECT * FROM student_table WHERE StudentId = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('s', $studentId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $data = $result->fetch_assoc();
        echo json_encode(['success' => true, 'data' => $data]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Student not found']);
    }
    $stmt->close();
    exit;
}

// Handle POST request to save student data
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get raw input
    $rawInput = file_get_contents('php://input');
    
    // Log received data for debugging
    error_log('=== SAVE-STUDENT.PHP RECEIVED ===');
    error_log('Raw input: ' . substr($rawInput, 0, 500));
    
    // Try to decode JSON
    $data = json_decode($rawInput, true);
    
    if (!$data) {
        http_response_code(400);
        error_log('JSON decode failed: ' . json_last_error_msg());
        echo json_encode([
            'success' => false, 
            'message' => 'Invalid JSON data',
            'received' => $rawInput,
            'json_error' => json_last_error_msg()
        ]);
        exit;
    }
    
    error_log('Received StudentId: ' . ($data['StudentId'] ?? 'MISSING'));
    error_log('Received grade_id: ' . ($data['grade_id'] ?? 'MISSING'));
    error_log('Has education data: ' . (isset($data['education']) && is_array($data['education']) ? count($data['education']) : 'NONE'));
    error_log('Has organization data: ' . (isset($data['organization']) && is_array($data['organization']) ? count($data['organization']) : 'NONE'));
    
    // Validate required fields
    $required = ['StudentId', 'LRN', 'FirstName', 'LastName', 'Sex', 'Age', 'DateOfBirth'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Missing required field: $field", 'data_received' => $data]);
            exit;
        }
    }
    
    // Check if student exists
    $checkQuery = "SELECT StudentId FROM student_table WHERE StudentId = ?";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bind_param('s', $data['StudentId']);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    $studentExists = $checkResult->num_rows > 0;
    $checkStmt->close();
    
    // Check if LRN already exists (for new students or different students)
    if (!$studentExists) {
        $lrnCheckQuery = "SELECT StudentId FROM student_table WHERE LRN = ?";
        $lrnCheckStmt = $conn->prepare($lrnCheckQuery);
        $lrnCheckStmt->bind_param('s', $data['LRN']);
        $lrnCheckStmt->execute();
        $lrnCheckResult = $lrnCheckStmt->get_result();
        if ($lrnCheckResult->num_rows > 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'This LRN (Learning Reference Number) is already registered. Please use a different LRN.'
            ]);
            $lrnCheckStmt->close();
            exit;
        }
        $lrnCheckStmt->close();
    }
    
    // Prepare variables for binding
    $lrn = $data['LRN'];
    $firstName = $data['FirstName'];
    $lastName = $data['LastName'];
    $middleName = $data['MiddleName'] ?? '';
    $nickName = $data['NickName'] ?? '';
    $sex = $data['Sex'];
    $age = $data['Age'];
    $dob = $data['DateOfBirth'];
    $placeOfBirth = $data['PlaceOfBirth'] ?? '';
    $religionFromBirth = $data['ReligionFromBirth'] ?? '';
    $currentReligion = $data['CurrentReligion'] ?? '';
    $currentAddress = $data['CurrentAddress'] ?? '';
    $permanentAddress = $data['PermanentAddress'] ?? '';
    $cellphone = $data['CellphoneNumber'] ?? '';
    $gradeId = isset($data['grade_id']) && $data['grade_id'] !== null ? (int)$data['grade_id'] : null;
    $studentId = $data['StudentId'];
    
    if ($studentExists) {
        // Get existing data to compare
        $getExistingQuery = "SELECT * FROM student_table WHERE StudentId = ?";
        $getExistingStmt = $conn->prepare($getExistingQuery);
        $getExistingStmt->bind_param('s', $studentId);
        $getExistingStmt->execute();
        $existingResult = $getExistingStmt->get_result();
        $existingData = $existingResult->fetch_assoc();
        $getExistingStmt->close();
        
        // Check if any data has actually changed
        $dataChanged = false;
        $fieldsToCheck = ['LRN', 'FirstName', 'LastName', 'MiddleName', 'NickName', 'Sex', 'Age', 'DateOfBirth', 
                         'PlaceOfBirth', 'ReligionFromBirth', 'CurrentReligion', 'CurrentAddress', 'PermanentAddress', 'CellphoneNumber', 'grade_id'];
        
        foreach ($fieldsToCheck as $field) {
            $newValue = $data[$field] ?? '';
            $oldValue = $existingData[$field] ?? '';
            
            // Special handling for grade_id to ensure proper comparison
            if ($field === 'grade_id') {
                $newValue = !empty($data[$field]) ? (int)$data[$field] : null;
                $oldValue = !empty($existingData[$field]) ? (int)$existingData[$field] : null;
            }
            
            if ($newValue !== $oldValue) {
                $dataChanged = true;
                error_log("Change detected in $field: '$oldValue' -> '$newValue'");
                break;
            }
        }
        
        // If no data changed, still save related data (education, org, sibling, friend)
        if (!$dataChanged) {
            error_log('No changes detected in student fields, but saving related data...');
            
            // ALWAYS save related data, regardless of whether student record changed
            error_log('Saving educational data...');
            saveEducationData($conn, $studentId, $data);
            
            error_log('Saving organization data...');
            saveOrganizationData($conn, $studentId, $data);
            
            error_log('Saving sibling data...');
            saveSiblingData($conn, $studentId, $data);
            
            error_log('Saving friend data...');
            saveFriendData($conn, $studentId, $data);
            
            error_log('Saving parent data...');
            saveParentData($conn, $studentId, $data);
            
            error_log('Saving family status data...');
            saveFamilyStatusData($conn, $studentId, $data);
            
            error_log('=== RELATED DATA SAVED (NO STUDENT CHANGES) ===');
            
            echo json_encode([
                'success' => true,
                'message' => 'Related information saved successfully (student data unchanged)',
                'action' => 'related_only',
                'rows_affected' => 0
            ]);
            exit;
        }
        
        // Update existing student
        if ($gradeId !== null) {
            $updateQuery = "UPDATE student_table SET 
                LRN = ?,
                FirstName = ?,
                LastName = ?,
                MiddleName = ?,
                NickName = ?,
                Sex = ?,
                Age = ?,
                DateOfBirth = ?,
                PlaceOfBirth = ?,
                ReligionFromBirth = ?,
                CurrentReligion = ?,
                CurrentAddress = ?,
                PermanentAddress = ?,
                CellphoneNumber = ?,
                grade_id = ?
                WHERE StudentId = ?";
            
            $stmt = $conn->prepare($updateQuery);
            $stmt->bind_param('ssssssssssssssis',
                $lrn,
                $firstName,
                $lastName,
                $middleName,
                $nickName,
                $sex,
                $age,
                $dob,
                $placeOfBirth,
                $religionFromBirth,
                $currentReligion,
                $currentAddress,
                $permanentAddress,
                $cellphone,
                $gradeId,
                $studentId
            );
        } else {
            $updateQuery = "UPDATE student_table SET 
                LRN = ?,
                FirstName = ?,
                LastName = ?,
                MiddleName = ?,
                NickName = ?,
                Sex = ?,
                Age = ?,
                DateOfBirth = ?,
                PlaceOfBirth = ?,
                ReligionFromBirth = ?,
                CurrentReligion = ?,
                CurrentAddress = ?,
                PermanentAddress = ?,
                CellphoneNumber = ?,
                grade_id = NULL
                WHERE StudentId = ?";
            
            $stmt = $conn->prepare($updateQuery);
            $stmt->bind_param('sssssssssssssss',
                $lrn,
                $firstName,
                $lastName,
                $middleName,
                $nickName,
                $sex,
                $age,
                $dob,
                $placeOfBirth,
                $religionFromBirth,
                $currentReligion,
                $currentAddress,
                $permanentAddress,
                $cellphone,
                $studentId
            );
        }
        
        if ($stmt->execute()) {
            error_log('Student UPDATE successful. Affected rows: ' . $conn->affected_rows);
            
            // ALWAYS save related data, regardless of whether student record changed
            error_log('Saving educational data...');
            saveEducationData($conn, $studentId, $data);
            
            error_log('Saving organization data...');
            saveOrganizationData($conn, $studentId, $data);
            
            error_log('Saving sibling data...');
            saveSiblingData($conn, $studentId, $data);
            
            error_log('Saving friend data...');
            saveFriendData($conn, $studentId, $data);
            
            error_log('Saving parent data...');
            saveParentData($conn, $studentId, $data);
            
            error_log('Saving family status data...');
            saveFamilyStatusData($conn, $studentId, $data);
            
            error_log('=== ALL DATA SAVED SUCCESSFULLY ===');
            
            echo json_encode([
                'success' => true,
                'message' => 'Student information updated successfully',
                'action' => 'update',
                'rows_affected' => $conn->affected_rows
            ]);
        } else {
            http_response_code(500);
            error_log('Student UPDATE failed: ' . $stmt->error);
            echo json_encode([
                'success' => false, 
                'message' => 'Error updating student: ' . $stmt->error
            ]);
        }
        $stmt->close();
    } else {
        // Insert new student
        if ($gradeId !== null) {
            $insertQuery = "INSERT INTO student_table (
                StudentId, LRN, FirstName, LastName, MiddleName, NickName, Sex, Age, 
                DateOfBirth, PlaceOfBirth, ReligionFromBirth, CurrentReligion, 
                CurrentAddress, PermanentAddress, CellphoneNumber, grade_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $conn->prepare($insertQuery);
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error preparing statement: ' . $conn->error
                ]);
                exit;
            }
            
            $stmt->bind_param('sssssssssssssssi',
                $studentId,
                $lrn,
                $firstName,
                $lastName,
                $middleName,
                $nickName,
                $sex,
                $age,
                $dob,
                $placeOfBirth,
                $religionFromBirth,
                $currentReligion,
                $currentAddress,
                $permanentAddress,
                $cellphone,
                $gradeId
            );
        } else {
            $insertQuery = "INSERT INTO student_table (
                StudentId, LRN, FirstName, LastName, MiddleName, NickName, Sex, Age, 
                DateOfBirth, PlaceOfBirth, ReligionFromBirth, CurrentReligion, 
                CurrentAddress, PermanentAddress, CellphoneNumber, grade_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)";
            
            $stmt = $conn->prepare($insertQuery);
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error preparing statement: ' . $conn->error
                ]);
                exit;
            }
            
            $stmt->bind_param('sssssssssssssss',
                $studentId,
                $lrn,
                $firstName,
                $lastName,
                $middleName,
                $nickName,
                $sex,
                $age,
                $dob,
                $placeOfBirth,
                $religionFromBirth,
                $currentReligion,
                $currentAddress,
                $permanentAddress,
                $cellphone
            );
        }
        
        if ($stmt->execute()) {
            error_log('Student INSERT successful. New StudentId: ' . $studentId);
            
            // After inserting student, save related data
            error_log('Saving educational data...');
            saveEducationData($conn, $studentId, $data);
            
            error_log('Saving organization data...');
            saveOrganizationData($conn, $studentId, $data);
            
            error_log('Saving sibling data...');
            saveSiblingData($conn, $studentId, $data);
            
            error_log('Saving friend data...');
            saveFriendData($conn, $studentId, $data);
            
            error_log('Saving parent data...');
            saveParentData($conn, $studentId, $data);
            
            error_log('Saving family status data...');
            saveFamilyStatusData($conn, $studentId, $data);
            
            error_log('=== NEW STUDENT CREATED AND ALL DATA SAVED ===');
            
            echo json_encode([
                'success' => true,
                'message' => 'Student registered successfully',
                'action' => 'insert',
                'rows_affected' => $conn->affected_rows
            ]);
        } else {
            error_log('Student INSERT failed: ' . $stmt->error);
            // Check if it's a duplicate key error
            if (strpos($stmt->error, 'Duplicate entry') !== false) {
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'This LRN (Learning Reference Number) is already registered. Please use a different LRN.'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Error saving student: ' . $stmt->error,
                    'query' => $insertQuery,
                    'bound_values' => [
                        'StudentId' => $studentId,
                        'LRN' => $lrn,
                        'FirstName' => $firstName,
                        'LastName' => $lastName
                    ]
                ]);
            }
        }
        $stmt->close();
    }
    
    $conn->close();
    exit;
}

// ==================== HELPER FUNCTIONS ====================

function saveEducationData($conn, $studentId, $data) {
    // Delete existing education records for this student
    $deleteQuery = "DELETE FROM educational_background WHERE StudentId = ?";
    $deleteStmt = $conn->prepare($deleteQuery);
    if (!$deleteStmt) {
        error_log('ERROR preparing delete for education: ' . $conn->error);
        return false;
    }
    $deleteStmt->bind_param('s', $studentId);
    if (!$deleteStmt->execute()) {
        error_log('ERROR executing delete for education: ' . $deleteStmt->error);
        $deleteStmt->close();
        return false;
    }
    error_log('Deleted ' . $conn->affected_rows . ' existing education records');
    $deleteStmt->close();
    
    // Insert new education records if provided
    if (isset($data['education']) && is_array($data['education'])) {
        error_log('Education array has ' . count($data['education']) . ' records to insert');
        $insertQuery = "INSERT INTO educational_background (StudentId, GradeLevel, SchoolAttended, InclusiveYes, PlaceAndSchool) VALUES (?, ?, ?, ?, ?)";
        $insertStmt = $conn->prepare($insertQuery);
        if (!$insertStmt) {
            error_log('ERROR preparing insert for education: ' . $conn->error);
            return false;
        }
        
        $successCount = 0;
        foreach ($data['education'] as $edu) {
            $gradeLevel = $edu['GradeLevel'] ?? '';
            $schoolAttended = $edu['SchoolAttended'] ?? '';
            $inclusiveYes = $edu['InclusiveYes'] ?? '';
            $placeAndSchool = $edu['PlaceAndSchool'] ?? '';
            
            $insertStmt->bind_param('sssss', $studentId, $gradeLevel, $schoolAttended, $inclusiveYes, $placeAndSchool);
            if ($insertStmt->execute()) {
                $successCount++;
            } else {
                error_log('ERROR inserting education record: ' . $insertStmt->error);
            }
        }
        error_log('Successfully inserted ' . $successCount . ' education records');
        $insertStmt->close();
    } else {
        error_log('No education data provided');
    }
    return true;
}

function saveSiblingData($conn, $studentId, $data) {
    // Delete existing sibling records for this student
    $deleteQuery = "DELETE FROM sibling WHERE StudentId = ?";
    $deleteStmt = $conn->prepare($deleteQuery);
    if (!$deleteStmt) {
        error_log('ERROR preparing delete for sibling: ' . $conn->error);
        return false;
    }
    $deleteStmt->bind_param('s', $studentId);
    if (!$deleteStmt->execute()) {
        error_log('ERROR executing delete for sibling: ' . $deleteStmt->error);
        $deleteStmt->close();
        return false;
    }
    error_log('Deleted ' . $conn->affected_rows . ' existing sibling records');
    $deleteStmt->close();
    
    // Insert new sibling records if provided
    if (isset($data['sibling']) && is_array($data['sibling'])) {
        error_log('Sibling array has ' . count($data['sibling']) . ' records to insert');
        $insertQuery = "INSERT INTO sibling (StudentId, FirstName, LastName, MiddleName, NickName, Age, BirthOrder, SchoolId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $insertStmt = $conn->prepare($insertQuery);
        if (!$insertStmt) {
            error_log('ERROR preparing insert for sibling: ' . $conn->error);
            return false;
        }
        
        $successCount = 0;
        foreach ($data['sibling'] as $sib) {
            $firstName = $sib['FirstName'] ?? '';
            $lastName = $sib['LastName'] ?? '';
            $middleName = $sib['MiddleName'] ?? '';
            $nickName = $sib['NickName'] ?? '';
            $age = $sib['Age'] ?? '';
            $birthOrder = $sib['BirthOrder'] ?? '';
            $schoolId = $sib['SchoolId'] ?? '';
            
            $insertStmt->bind_param('ssssssss', $studentId, $firstName, $lastName, $middleName, $nickName, $age, $birthOrder, $schoolId);
            if ($insertStmt->execute()) {
                $successCount++;
            } else {
                error_log('ERROR inserting sibling record: ' . $insertStmt->error);
            }
        }
        error_log('Successfully inserted ' . $successCount . ' sibling records');
        $insertStmt->close();
    } else {
        error_log('No sibling data provided');
    }
    return true;
}

function saveFriendData($conn, $studentId, $data) {
    // Delete existing friend records for this student
    $deleteQuery = "DELETE FROM friends_table WHERE StudentId = ?";
    $deleteStmt = $conn->prepare($deleteQuery);
    if (!$deleteStmt) {
        error_log('ERROR preparing delete for friend: ' . $conn->error);
        return false;
    }
    $deleteStmt->bind_param('s', $studentId);
    if (!$deleteStmt->execute()) {
        error_log('ERROR executing delete for friend: ' . $deleteStmt->error);
        $deleteStmt->close();
        return false;
    }
    error_log('Deleted ' . $conn->affected_rows . ' existing friend records');
    $deleteStmt->close();
    
    // Insert new friend records if provided
    if (isset($data['friend']) && is_array($data['friend'])) {
        error_log('Friend array has ' . count($data['friend']) . ' records to insert');
        $insertQuery = "INSERT INTO friends_table (StudentId, In_school, FirstName, MiddleName, LastName) VALUES (?, ?, ?, ?, ?)";
        $insertStmt = $conn->prepare($insertQuery);
        if (!$insertStmt) {
            error_log('ERROR preparing insert for friend: ' . $conn->error);
            return false;
        }
        
        $successCount = 0;
        foreach ($data['friend'] as $friend) {
            $inSchool = $friend['In_school'] ?? '';
            $firstName = $friend['FirstName'] ?? '';
            $middleName = $friend['MiddleName'] ?? '';
            $lastName = $friend['LastName'] ?? '';
            
            $insertStmt->bind_param('sssss', $studentId, $inSchool, $firstName, $middleName, $lastName);
            if ($insertStmt->execute()) {
                $successCount++;
            } else {
                error_log('ERROR inserting friend record: ' . $insertStmt->error);
            }
        }
        error_log('Successfully inserted ' . $successCount . ' friend records');
        $insertStmt->close();
    } else {
        error_log('No friend data provided');
    }
    return true;
}

function saveOrganizationData($conn, $studentId, $data) {
    // Use existing oraganization table
    
    // Delete existing organization records for this student
    $deleteQuery = "DELETE FROM oraganization WHERE StudentId = ?";
    $deleteStmt = $conn->prepare($deleteQuery);
    if (!$deleteStmt) {
        error_log('ERROR preparing delete for organization: ' . $conn->error);
        return false;
    }
    $deleteStmt->bind_param('s', $studentId);
    if (!$deleteStmt->execute()) {
        error_log('ERROR executing delete for organization: ' . $deleteStmt->error);
        $deleteStmt->close();
        return false;
    }
    error_log('Deleted ' . $conn->affected_rows . ' existing organization records');
    $deleteStmt->close();
    
    // Insert new organization records if provided
    if (isset($data['organization']) && is_array($data['organization'])) {
        error_log('Organization array has ' . count($data['organization']) . ' records to insert');
        $insertQuery = "INSERT INTO oraganization (OrganizationId, StudentId, OrganizationName, PositionTitle, inCampus) VALUES (?, ?, ?, ?, ?)";
        $insertStmt = $conn->prepare($insertQuery);
        if (!$insertStmt) {
            error_log('ERROR preparing insert for organization: ' . $conn->error);
            return false;
        }
        
        $successCount = 0;
        foreach ($data['organization'] as $index => $org) {
            // Generate unique OrganizationId
            $orgId = 'org_' . $studentId . '_' . time() . '_' . $index;
            $orgName = $org['OrganizationName'] ?? '';
            $positionTitle = $org['PositionTitle'] ?? '';
            $inCampus = $org['inCampus'] ?? '';
            
            $insertStmt->bind_param('sssss', $orgId, $studentId, $orgName, $positionTitle, $inCampus);
            if ($insertStmt->execute()) {
                $successCount++;
            } else {
                error_log('ERROR inserting organization record: ' . $insertStmt->error);
            }
        }
        error_log('Successfully inserted ' . $successCount . ' organization records');
        $insertStmt->close();
    } else {
        error_log('No organization data provided');
    }
    return true;
}

function saveParentData($conn, $studentId, $data) {
    // This function saves parent data to existing parent_table
    error_log('saveParentData called for StudentId: ' . $studentId);
    
    // Delete existing parent records for this student
    $deleteQuery = "DELETE FROM parent_table WHERE StudentId = ?";
    $deleteStmt = $conn->prepare($deleteQuery);
    if (!$deleteStmt) {
        error_log('ERROR preparing delete for parent_table: ' . $conn->error);
        return false;
    }
    $deleteStmt->bind_param('s', $studentId);
    if (!$deleteStmt->execute()) {
        error_log('ERROR executing delete for parent_table: ' . $deleteStmt->error);
        $deleteStmt->close();
        return false;
    }
    error_log('Deleted ' . $conn->affected_rows . ' existing parent records');
    $deleteStmt->close();
    
    // Insert father data
    if (!empty($data['father_FirstName']) || !empty($data['father_LastName'])) {
        error_log('Saving father data...');
        
        $parentId = 'parent_' . $studentId . '_' . time() . '_father';
        $firstName = $data['father_FirstName'] ?? '';
        $lastName = $data['father_LastName'] ?? '';
        $middleName = $data['father_MiddleName'] ?? '';
        $nickName = $data['father_NickName'] ?? '';
        $birthDate = $data['father_BirthDate'] ?? '';
        $placeOfBirth = $data['father_PlaceOfBirth'] ?? '';
        $address = $data['father_Address'] ?? '';
        $contactNumber = $data['father_ContactNumber'] ?? '';
        $educationalAttainment = $data['father_HighestEducationalAttainment'] ?? '';
        $occupation = $data['father_Occupation'] ?? '';
        $isDeceased = $data['father_isDeceased'] ?? '';
        
        $insertQuery = "INSERT INTO parent_table (ParentId, StudentId, FirstName, LastName, MiddleName, NickName, BirthDate, PlaceOfBirth, Address, ContactNumber, HighestEducationalAttainment, Occupation, isDeceased) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $insertStmt = $conn->prepare($insertQuery);
        if (!$insertStmt) {
            error_log('ERROR preparing insert for father: ' . $conn->error);
            return false;
        }
        
        $insertStmt->bind_param('sssssssssssss', $parentId, $studentId, $firstName, $lastName, $middleName, $nickName, $birthDate, $placeOfBirth, $address, $contactNumber, $educationalAttainment, $occupation, $isDeceased);
        if ($insertStmt->execute()) {
            error_log('Father record inserted successfully');
        } else {
            error_log('ERROR inserting father record: ' . $insertStmt->error);
        }
        $insertStmt->close();
    }
    
    // Insert mother data
    if (!empty($data['mother_FirstName']) || !empty($data['mother_LastName'])) {
        error_log('Saving mother data...');
        
        $parentId = 'parent_' . $studentId . '_' . time() . '_mother';
        $firstName = $data['mother_FirstName'] ?? '';
        $lastName = $data['mother_LastName'] ?? '';
        $middleName = $data['mother_MiddleName'] ?? '';
        $nickName = $data['mother_NickName'] ?? '';
        $birthDate = $data['mother_BirthDate'] ?? '';
        $placeOfBirth = $data['mother_PlaceOfBirth'] ?? '';
        $address = $data['mother_Address'] ?? '';
        $contactNumber = $data['mother_ContactNumber'] ?? '';
        $educationalAttainment = $data['mother_HighestEducationalAttainment'] ?? '';
        $occupation = $data['mother_Occupation'] ?? '';
        $isDeceased = $data['mother_isDeceased'] ?? '';
        
        $insertQuery = "INSERT INTO parent_table (ParentId, StudentId, FirstName, LastName, MiddleName, NickName, BirthDate, PlaceOfBirth, Address, ContactNumber, HighestEducationalAttainment, Occupation, isDeceased) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $insertStmt = $conn->prepare($insertQuery);
        if (!$insertStmt) {
            error_log('ERROR preparing insert for mother: ' . $conn->error);
            return false;
        }
        
        $insertStmt->bind_param('sssssssssssss', $parentId, $studentId, $firstName, $lastName, $middleName, $nickName, $birthDate, $placeOfBirth, $address, $contactNumber, $educationalAttainment, $occupation, $isDeceased);
        if ($insertStmt->execute()) {
            error_log('Mother record inserted successfully');
        } else {
            error_log('ERROR inserting mother record: ' . $insertStmt->error);
        }
        $insertStmt->close();
    }
    
    return true;
}

function saveFamilyStatusData($conn, $studentId, $data) {
    // Delete existing family status record for this student
    error_log('saveFamilyStatusData called for StudentId: ' . $studentId);
    
    $deleteQuery = "DELETE FROM family_status WHERE StudentId = ?";
    $deleteStmt = $conn->prepare($deleteQuery);
    if (!$deleteStmt) {
        error_log('ERROR preparing delete for family_status: ' . $conn->error);
        return false;
    }
    $deleteStmt->bind_param('s', $studentId);
    if (!$deleteStmt->execute()) {
        error_log('ERROR executing delete for family_status: ' . $deleteStmt->error);
        $deleteStmt->close();
        return false;
    }
    error_log('Deleted ' . $conn->affected_rows . ' existing family status records');
    $deleteStmt->close();
    
    // Check if any family status data exists
    $hasData = false;
    $familyFields = ['LivingTogether', 'MarriedYet', 'MarriedChurch', 'TemporarilySepered', 'PermanentlySepered', 'FatherWithPartner', 'MotherWithPartner'];
    
    foreach ($familyFields as $field) {
        if (!empty($data[$field])) {
            $hasData = true;
            break;
        }
    }
    
    // Insert new family status record if data exists
    if ($hasData) {
        error_log('Inserting family status data...');
        $insertQuery = "INSERT INTO family_status (StudentId, LivingTogether, MarriedYet, MarriedChurch, TemporarilySepered, PermanentlySepered, FatherWithPartner, MotherWithPartner) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $insertStmt = $conn->prepare($insertQuery);
        
        if (!$insertStmt) {
            error_log('ERROR preparing insert for family_status: ' . $conn->error);
            return false;
        }
        
        $living = $data['LivingTogether'] ?? '';
        $married = $data['MarriedYet'] ?? '';
        $marriedChurch = $data['MarriedChurch'] ?? '';
        $tempSep = $data['TemporarilySepered'] ?? '';
        $permSep = $data['PermanentlySepered'] ?? '';
        $fatherPartner = $data['FatherWithPartner'] ?? '';
        $motherPartner = $data['MotherWithPartner'] ?? '';
        
        $insertStmt->bind_param('ssssssss', $studentId, $living, $married, $marriedChurch, $tempSep, $permSep, $fatherPartner, $motherPartner);
        if ($insertStmt->execute()) {
            error_log('Family status record inserted successfully');
        } else {
            error_log('ERROR inserting family_status record: ' . $insertStmt->error);
        }
        $insertStmt->close();
    } else {
        error_log('No family status data provided');
    }
    
    return true;
}

// Invalid request method
http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Invalid request method']);
?>
