<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

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

session_start();

try {
    // Include database connection
    require_once 'conn.php';
    
    // Check if connection is available
    if (!isset($conn) || $conn === null) {
        throw new Exception("Database connection not established");
    }

    // Get request method
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        // Save referral to database
        saveReferral($conn);
    } elseif ($method === 'GET') {
        // Get referrals for user
        getReferrals($conn);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'An error occurred: ' . $e->getMessage(),
        'error_details' => [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]
    ]);
}


function saveReferral($conn) {
    // Get JSON input
    $input = file_get_contents('php://input');
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No data received']);
        exit;
    }
    
    $data = json_decode($input, true);
    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON format']);
        exit;
    }

    // Validate required fields
    if (empty($data['student_name']) || empty($data['referral_reason']) || empty($data['school_attended'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    // Generate unique referral code
    $referral_code = 'REF-' . strtoupper(bin2hex(random_bytes(4)));

    // Build the INSERT query (without bind_param to test)
    $query = "INSERT INTO referral (
        referral_code, student_name, referral_reason, school_attended,
        student_school, student_id, grade, section, age, gender,
        description, intervention_attempts, observed_behaviors,
        parent_guardian, parent_contact, parent_email, family_background,
        teacher_id, teacher_name, urgency, stage, status
    ) VALUES (
        '$referral_code',
        '" . $conn->real_escape_string($data['student_name']) . "',
        '" . $conn->real_escape_string($data['referral_reason']) . "',
        '" . $conn->real_escape_string($data['school_attended']) . "',
        '" . $conn->real_escape_string($data['student_school'] ?? $data['school_attended']) . "',
        '" . $conn->real_escape_string($data['student_id'] ?? '') . "',
        '" . $conn->real_escape_string($data['grade'] ?? '') . "',
        '" . $conn->real_escape_string($data['section'] ?? '') . "',
        " . (intval($data['age'] ?? 0) > 0 ? intval($data['age']) : 'NULL') . ",
        '" . $conn->real_escape_string($data['gender'] ?? '') . "',
        '" . $conn->real_escape_string($data['description'] ?? '') . "',
        '" . $conn->real_escape_string($data['intervention_attempts'] ?? '') . "',
        '" . $conn->real_escape_string($data['observed_behaviors'] ?? '') . "',
        '" . $conn->real_escape_string($data['parent_guardian'] ?? '') . "',
        '" . $conn->real_escape_string($data['parent_contact'] ?? '') . "',
        '" . $conn->real_escape_string($data['parent_email'] ?? '') . "',
        '" . $conn->real_escape_string($data['family_background'] ?? '') . "',
        " . (intval($data['teacher_id'] ?? 0) > 0 ? intval($data['teacher_id']) : 'NULL') . ",
        '" . $conn->real_escape_string($data['teacher_name'] ?? '') . "',
        '" . $conn->real_escape_string($data['urgency'] ?? 'normal') . "',
        " . (intval($data['stage'] ?? 1)) . ",
        '" . $conn->real_escape_string($data['status'] ?? 'pending') . "'
    )";

    if ($conn->query($query) === true) {
        $referralId = $conn->insert_id;
        echo json_encode([
            'success' => true,
            'message' => 'Referral saved successfully',
            'referral_id' => $referralId,
            'referral_code' => $referral_code
        ]);
    } else {
        throw new Exception("Insert failed: " . $conn->error);
    }
}

function getReferrals($conn) {
    // Get query parameters
    $user_role = $_GET['role'] ?? null;
    $user_school = $_GET['school'] ?? null;
    $user_id = $_GET['user_id'] ?? null;
    $student_name = $_GET['student_name'] ?? null;

    // Build query based on role
    $query = "SELECT * FROM referral WHERE 1=1";
    
    // Filter by school
    if ($user_school) {
        $query .= " AND school_attended = '" . $conn->real_escape_string($user_school) . "'";
    }

    // Role-based filtering
    if ($user_role === 'student' && $student_name) {
        // Student can only see their own referrals
        $query .= " AND student_name = '" . $conn->real_escape_string($student_name) . "'";
    } elseif ($user_role === 'teacher' && $user_id) {
        // Teacher can see only their referrals
        $query .= " AND teacher_id = '" . $conn->real_escape_string($user_id) . "'";
    }
    // Coordinator and Counselor can see all referrals from their school (already filtered by school above)

    $query .= " ORDER BY date_submitted DESC";

    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }

    $referrals = [];
    while ($row = $result->fetch_assoc()) {
        // Convert numeric fields to proper types
        $row['id'] = (int) $row['id'];
        $row['age'] = $row['age'] ? (int) $row['age'] : null;
        $row['teacher_id'] = $row['teacher_id'] ? (int) $row['teacher_id'] : null;
        $row['stage'] = (int) $row['stage'];
        $referrals[] = $row;
    }

    echo json_encode([
        'success' => true,
        'count' => count($referrals),
        'data' => $referrals
    ]);
}
?>
