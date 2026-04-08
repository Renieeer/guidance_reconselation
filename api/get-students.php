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
    $school = $_GET['school'] ?? null;
    $grade = $_GET['grade'] ?? null;
    $search = $_GET['search'] ?? null;
    $limit = intval($_GET['limit'] ?? 100);
    $offset = intval($_GET['offset'] ?? 0);

    // Build query to get all students from accounts table and join with student_table
    // Handle collation differences by using COLLATE
    $query = "SELECT 
        a.id, 
        a.first_name, 
        a.last_name, 
        a.email, 
        a.school_attended,
        st.Age,
        st.Sex,
        st.DateOfBirth,
        st.grade_id,
        COUNT(DISTINCT r.id) as referral_count,
        MAX(r.date_submitted) as last_referral_date
    FROM accounts a
    LEFT JOIN student_table st ON (CAST(a.id AS CHAR) COLLATE utf8mb4_unicode_ci = st.StudentId COLLATE utf8mb4_unicode_ci)
    LEFT JOIN referral r ON a.first_name = r.student_name AND a.school_attended = r.school_attended
    WHERE a.user_type = 'student'";

    // Filter by school
    if ($school) {
        $query .= " AND a.school_attended = '" . $conn->real_escape_string($school) . "'";
    }

    // Filter by search term
    if ($search) {
        $search_term = $conn->real_escape_string($search);
        $query .= " AND (a.first_name LIKE '%$search_term%' 
                   OR a.last_name LIKE '%$search_term%' 
                   OR a.email LIKE '%$search_term%')";
    }

    $query .= " GROUP BY a.id, a.first_name, a.last_name, a.email, a.school_attended, st.Age, st.Sex, st.DateOfBirth, st.grade_id
                ORDER BY a.first_name ASC
                LIMIT $limit OFFSET $offset";

    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }

    $students = [];
    while ($row = $result->fetch_assoc()) {
        // Convert numeric fields
        $row['id'] = (int) $row['id'];
        $row['referral_count'] = (int) $row['referral_count'];
        $students[] = $row;
    }

    echo json_encode([
        'success' => true,
        'count' => count($students),
        'data' => $students
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'An error occurred: ' . $e->getMessage()
    ]);
}
?>
