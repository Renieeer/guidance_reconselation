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

session_start();

try {
    // Include database connection
    require_once 'conn.php';

    // Get request method
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        // Update referral stage
        updateReferralStage($conn);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred: ' . $e->getMessage()]);
}

function updateReferralStage($conn) {
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
    if (empty($data['referral_id']) || !isset($data['stage'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields: referral_id, stage']);
        exit;
    }

    $referral_id = intval($data['referral_id']);
    $new_stage = intval($data['stage']);
    $new_status = $data['status'] ?? determineStatus($new_stage);

    // Validate stage value (1-6)
    if ($new_stage < 1 || $new_stage > 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid stage value. Must be between 1 and 6']);
        exit;
    }

    // Prepare update statement
    $query = "UPDATE referral SET stage = ?, status = ?, updated_at = NOW() WHERE id = ?";
    
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param("isi", $new_stage, $new_status, $referral_id);

    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }

    if ($stmt->affected_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Referral not found']);
        exit;
    }

    $stmt->close();

    // Get updated referral
    $selectQuery = "SELECT * FROM referral WHERE id = ?";
    $selectStmt = $conn->prepare($selectQuery);
    $selectStmt->bind_param("i", $referral_id);
    $selectStmt->execute();
    $result = $selectStmt->get_result();
    $updatedReferral = $result->fetch_assoc();
    $selectStmt->close();

    echo json_encode([
        'success' => true,
        'message' => 'Referral stage updated successfully',
        'referral' => $updatedReferral
    ]);
}

function determineStatus($stage) {
    // Map stage to default status
    switch ($stage) {
        case 1:
            return 'pending';
        case 2:
        case 3:
        case 4:
        case 5:
            return 'in-progress';
        case 6:
            return 'completed';
        default:
            return 'pending';
    }
}
?>
