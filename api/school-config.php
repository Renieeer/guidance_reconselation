<?php
/**
 * School Configuration
 * Defines which schools have coordinator and/or counselor roles
 * 
 * 'counselor' - Only counselor role (combined with coordinator duties in dashboard)
 * 'coordinator' - Only coordinator role  
 * 'both' - Both coordinator and counselor roles available (separate dashboards)
 */

$schoolConfig = [
    'personas' => [
        'name' => 'Personas National High School',
        'availableRoles' => ['student', 'teacher', 'counselor-and-coordinator'], // Combined role only
        'type' => 'counselor' // Counselor shows combined dashboard
    ],
    'community-vocational' => [
        'name' => 'Community Vocational High Schools',
        'availableRoles' => ['student', 'teacher', 'counselor-and-coordinator'],
        'type' => 'counselor'
    ],
    'oriental-mindoro' => [
        'name' => 'Oriental Mindoro National High School',
        'availableRoles' => ['student', 'teacher', 'counselor' , 'coordinator'],
        'type' => 'both'
    ],
    'ceriaco-abes' => [
        'name' => 'Ceriaco A. Abes Memorial National High School',
        'availableRoles' => ['student', 'teacher', 'counselor-and-coordinator'],
        'type' => 'counselor'
    ],
    'nag-iba' => [
        'name' => 'Nag-iba National High School',
        'availableRoles' => ['student', 'teacher', 'counselor-and-coordinator'],
        'type' => 'counselor'
    ],
    'pedro-panaligan' => [
        'name' => 'Pedro V Panaligan National High School',
        'availableRoles' => ['student', 'teacher', 'counselor-and-coordinator'],
        'type' => 'counselor'
    ],
    'parang' => [
        'name' => 'Parang National High School',
        'availableRoles' => ['student', 'teacher', 'counselor-and-coordinator'],
        'type' => 'counselor'
    ],
    'managpi' => [
        'name' => 'Managpi National High School',
        'availableRoles' => ['student', 'teacher', 'counselor-and-coordinator'],
        'type' => 'counselor'
    ],
    'buvayao' => [
        'name' => 'Buvayao National High School',
        'availableRoles' => ['student', 'teacher', 'counselor-and-coordinator'],
        'type' => 'counselor'
    ],
    'canubing' => [
        'name' => 'Canubing National High School',
        'availableRoles' => ['student', 'teacher', 'counselor-and-coordinator'],
        'type' => 'counselor'
    ]
];

/**
 * Get the configuration for a school
 */
function getSchoolConfig($schoolId) {
    global $schoolConfig;
    return isset($schoolConfig[$schoolId]) ? $schoolConfig[$schoolId] : null;
}

/**
 * Get available roles for a school
 */
function getAvailableRolesForSchool($schoolId) {
    $config = getSchoolConfig($schoolId);
    return $config ? $config['availableRoles'] : ['student', 'teacher'];
}

/**
 * Determine if school has combined counselor-coordinator role
 */
function schoolHasCombinedRole($schoolId) {
    $config = getSchoolConfig($schoolId);
    return $config && $config['type'] === 'counselor';
}

/**
 * Get the appropriate role when registering for a school
 */
function getDefaultRoleForSchool($schoolId, $selectedRole) {
    $config = getSchoolConfig($schoolId);
    
    if (!$config) {
        return $selectedRole;
    }
    
    // If school has combined role only, override to combined
    if ($config['type'] === 'counselor' && in_array('counselor-and-coordinator', $config['availableRoles'])) {
        return 'counselor-and-coordinator';
    }
    
    // Return selected role if available for this school
    if (in_array($selectedRole, $config['availableRoles'])) {
        return $selectedRole;
    }
    
    // Fallback to first available role
    return $config['availableRoles'][0] ?? $selectedRole;
}

// Handle GET request for grades
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'getGrades') {
    include 'conn.php';
    
    $query = "SELECT id, grade_name FROM grades ORDER BY id";
    $result = $conn->query($query);
    
    $grades = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $grades[] = $row;
        }
    }
    
    echo json_encode([
        'success' => true,
        'grades' => $grades
    ]);
    exit;
}
?>
