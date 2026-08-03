<?php
// Enable CORS for frontend (Vercel/Live Server)
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
    require_once 'grade-scope.php';
    require_once 'account-status.php';
    require_once 'email-verification.php';
    ensure_users_table_grade_column($conn);
    ensure_users_table_active_column($conn);
    ensure_email_verification_schema($conn);

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
    if (!isset($data['email']) || !isset($data['password'])) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    $email = trim($data['email']);
    $plainPassword = $data['password'];

    // Validate input
    if (empty($email) || empty($plainPassword)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit;
    }

    // Query user from database (users_tables)
    $query = "SELECT AccountID, email, Password, Type, First_name, Last_name, school_attended, Grade, is_active, email_verified FROM users_tables WHERE email = ?";
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("s", $email);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();

    if (!$user) {
        // User not found - return generic error for security
        echo json_encode(['success' => false, 'message' => 'Incorrect credentials provided.']);
        exit;
    }

    // Verify password
    if (!password_verify($plainPassword, $user['Password'])) {
        echo json_encode(['success' => false, 'message' => 'Incorrect credentials provided.']);
        exit;
    }

    if ((int)($user['is_active'] ?? 1) === 0) {
        echo json_encode(['success' => false, 'message' => 'This account has been deactivated. Please contact your SDO administrator.']);
        exit;
    }

    // Defaults to verified (1) when the column is missing/null — matches
    // ensure_email_verification_schema()'s grandfathering of pre-existing
    // accounts, so this only ever blocks brand-new unverified signups.
    if ((int)($user['email_verified'] ?? 1) === 0) {
        echo json_encode([
            'success' => false,
            'needsVerification' => true,
            'email' => $user['email'],
            'message' => 'Please verify your email before logging in.'
        ]);
        exit;
    }

    // Login successful - role is retrieved from database
    $userData = [
        'id' => $user['AccountID'],
        'email' => $user['email'],
        'name' => $user['First_name'] . ' ' . $user['Last_name'],
        'firstName' => $user['First_name'],
        'lastName' => $user['Last_name'],
        'role' => $user['Type'],
        'school' => $user['school_attended'],
        // Comma-separated grade numbers a counselor/coordinator is scoped to
        // (e.g. "7", "11,12"). Empty/NULL means no restriction. See api/grade-scope.php.
        'grade' => $user['Grade']
    ];

    // Store in session
    $_SESSION['user'] = $userData;

    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user' => $userData
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred: ' . $e->getMessage()]);
}
?>
