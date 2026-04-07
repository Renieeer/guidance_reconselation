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
    if (!isset($data['firstName']) || !isset($data['lastName']) || !isset($data['email']) || 
        !isset($data['school']) || !isset($data['password']) || !isset($data['role'])) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    $firstName = trim($data['firstName']);
    $lastName = trim($data['lastName']);
    $email = trim($data['email']);
    $school = trim($data['school']);
    $plainPassword = $data['password'];
    $role = trim($data['role']);

    // Validate input
    if (empty($firstName) || empty($lastName) || empty($email) || empty($school) || empty($plainPassword) || empty($role)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit;
    }

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit;
    }

    // Validate role
    $validRoles = ['student', 'teacher', 'coordinator', 'counselor', 'other-school'];
    if (!in_array($role, $validRoles)) {
        echo json_encode(['success' => false, 'message' => 'Invalid role selected']);
        exit;
    }

    // Validate password strength
    $passwordStrength = validatePassword($plainPassword);
    if (!$passwordStrength['valid']) {
        echo json_encode(['success' => false, 'message' => 'Password does not meet security requirements']);
        exit;
    }

    // Check if email already exists
    $checkQuery = "SELECT id FROM accounts WHERE email = ?";
    $stmt = $conn->prepare($checkQuery);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Email already registered']);
        $stmt->close();
        exit;
    }
    $stmt->close();

    // Hash password
    $hashedPassword = password_hash($plainPassword, PASSWORD_BCRYPT);

    // Insert new account
    $insertQuery = "INSERT INTO accounts (email, password, user_type, first_name, last_name, school_attended, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())";
    $stmt = $conn->prepare($insertQuery);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param("ssssss", $email, $hashedPassword, $role, $firstName, $lastName, $school);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Account created successfully']);
    } else {
        throw new Exception("Execute failed: " . $stmt->error);
    }

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred: ' . $e->getMessage()]);
}

// Validate password strength
function validatePassword($password) {
    $minLength = 8;
    $hasUppercase = preg_match('/[A-Z]/', $password);
    $hasLowercase = preg_match('/[a-z]/', $password);
    $hasNumber = preg_match('/[0-9]/', $password);
    $hasSpecialChar = preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/', $password);

    $valid = strlen($password) >= $minLength && $hasUppercase && $hasLowercase && $hasNumber && $hasSpecialChar;

    return [
        'valid' => $valid,
        'errors' => [
            'length' => strlen($password) < $minLength ? 'At least ' . $minLength . ' characters' : null,
            'uppercase' => !$hasUppercase ? 'At least one uppercase letter' : null,
            'lowercase' => !$hasLowercase ? 'At least one lowercase letter' : null,
            'number' => !$hasNumber ? 'At least one number' : null,
            'special' => !$hasSpecialChar ? 'At least one special character' : null
        ]
    ];
}
?>
