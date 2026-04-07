<?php

// Database connection settings
header('Content-Type: application/json');

$servername = 'localhost';
$username = 'root';
$password = '';
$database = 'guidance_tbl';

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