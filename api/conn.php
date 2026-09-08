<?php

// PHP has no timezone set by default (falls back to UTC), which doesn't
// match the school's actual local time — that mismatch is what made a
// referral submitted this morning look like it was submitted "yesterday
// 11 PM" (date('Y-m-d H:i:s') below was computing in UTC while MySQL's own
// CURRENT_TIMESTAMP columns were already correct in local time). Set
// explicitly so every PHP-computed timestamp (see api/referral.php's
// $dateSubmitted) agrees with the DB's own timestamps.
date_default_timezone_set('Asia/Manila');

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

    // Match MySQL's own NOW()/CURRENT_TIMESTAMP columns to the same offset
    // set above for PHP — the live host's MySQL timezone isn't something
    // this app controls, so pin it per-session instead of trusting its
    // server default (which InfinityFree, unlike this local machine, most
    // likely leaves at UTC).
    $conn->query("SET time_zone = '+08:00'");

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection error: ' . $e->getMessage()]);
    exit;
}

// $conn is now available for all scripts that include this file
?>