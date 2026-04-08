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

    // Query user from database
    $query = "SELECT id, email, password, user_type, first_name, last_name, school_attended FROM accounts WHERE email = ?";
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
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
        exit;
    }

    // Verify password
    if (!password_verify($plainPassword, $user['password'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
        exit;
    }

    // Login successful - role is retrieved from database
    $userData = [
        'id' => $user['id'],
        'email' => $user['email'],
        'name' => $user['first_name'] . ' ' . $user['last_name'],
        'firstName' => $user['first_name'],
        'lastName' => $user['last_name'],
        'role' => $user['user_type'],
        'school' => $user['school_attended']
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
