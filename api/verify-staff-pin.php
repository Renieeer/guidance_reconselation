<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'staff-access-config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);
$pin = isset($data['pin']) ? trim((string)$data['pin']) : '';

if ($pin === '' || !hash_equals(STAFF_ACCESS_PIN, $pin)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Incorrect access code.']);
    exit;
}

echo json_encode(['success' => true]);
