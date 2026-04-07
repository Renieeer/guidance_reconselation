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
    $school = $_GET['school'] ?? null;

    if ($student_id === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing student_id parameter']);
        exit;
    }

    // Get student information
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
    $stmt->close();

    // Get student's referrals
    $referral_query = "SELECT * FROM referral WHERE student_name = ? AND school_attended = ?
                       ORDER BY date_submitted DESC";
    $stmt = $conn->prepare($referral_query);
    $stmt->bind_param("ss", $student['first_name'], $student['school_attended']);
    $stmt->execute();
    $referral_result = $stmt->get_result();
    
    $referrals = [];
    while ($row = $referral_result->fetch_assoc()) {
        $row['id'] = (int) $row['id'];
        $row['age'] = (int) $row['age'];
        $row['teacher_id'] = (int) $row['teacher_id'];
        $row['stage'] = (int) $row['stage'];
        $referrals[] = $row;
    }
    $stmt->close();

    // Get follow-up cases (if applicable)
    $cases_query = "SELECT * FROM referral WHERE student_name = ? AND school_attended = ? AND stage >= 3
                    ORDER BY updated_at DESC";
    $stmt = $conn->prepare($cases_query);
    $stmt->bind_param("ss", $student['first_name'], $student['school_attended']);
    $stmt->execute();
    $cases_result = $stmt->get_result();
    
    $cases = [];
    while ($row = $cases_result->fetch_assoc()) {
        $row['id'] = (int) $row['id'];
        $cases[] = $row;
    }
    $stmt->close();

    echo json_encode([
        'success' => true,
        'student' => $student,
        'referrals' => $referrals,
        'cases' => $cases
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'An error occurred: ' . $e->getMessage()
    ]);
}
?>
