<?php

// Database connection settings
header('Content-Type: application/json');

// Auto-switches between local Laragon and the live InfinityFree host based
// on the requesting hostname, so the same codebase works in both places.
if (strpos($_SERVER['HTTP_HOST'] ?? '', 'infinityfreeapp.com') !== false) {
    $servername = 'sql311.infinityfree.com';
    $username = 'if0_42584741';
    $password = 'CKVo5YWtBT4Z5O';
    $database = 'if0_42584741_guidance_db';
} else {
    $servername = 'localhost';
    $username = 'root';
    $password = '';
    $database = 'guidance_tbl';
}

try {
    // Create MySQLi connection
    $conn = new mysqli($servername, $username, $password, $database);
    
    // Check connection
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]);
        exit;
    }
    
    // Set charset to utf8mb4
    $conn->set_charset('utf8mb4');
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection error: ' . $e->getMessage()]);
    exit;
}

// $conn is now available for all scripts that include this file
?>