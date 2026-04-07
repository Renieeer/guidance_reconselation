<?php

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
    
    // Try to decode JSON
    $data = json_decode($rawInput, true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'Invalid JSON data',
            'received' => $rawInput,
            'json_error' => json_last_error_msg()
        ]);
        exit;
    }
    
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
    $studentId = $data['StudentId'];
    
    if ($studentExists) {
        // Update existing student
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
            CellphoneNumber = ?
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
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Student information updated successfully',
                'action' => 'update',
                'rows_affected' => $conn->affected_rows,
                'saved_data' => $data
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false, 
                'message' => 'Error updating student: ' . $stmt->error,
                'query' => $updateQuery
            ]);
        }
        $stmt->close();
    } else {
        // Insert new student
        $insertQuery = "INSERT INTO student_table (
            StudentId, LRN, FirstName, LastName, MiddleName, NickName, Sex, Age, 
            DateOfBirth, PlaceOfBirth, ReligionFromBirth, CurrentReligion, 
            CurrentAddress, PermanentAddress, CellphoneNumber
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
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
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Student information saved successfully',
                'action' => 'insert',
                'rows_affected' => $conn->affected_rows,
                'saved_data' => $data
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
        $stmt->close();
    }
    
    $conn->close();
    exit;
}

// Invalid request method
http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Invalid request method']);
?>
