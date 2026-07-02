<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once 'conn.php';

function respond($data) {
    echo json_encode(['success' => true, 'data' => $data]);
    exit;
}

function fail($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $msg]);
    exit;
}

try {
    $level        = strtolower(trim($_GET['level']         ?? ''));
    $regionCode   = trim($_GET['regionCode']               ?? '');
    $provinceCode = trim($_GET['provinceCode']             ?? '');
    $cityCode     = trim($_GET['cityCode'] ?? $_GET['municipalityCode'] ?? '');

    switch ($level) {

        // ?level=regions
        case 'regions':
            $stmt = $conn->prepare(
                'SELECT region_id AS code, region_name AS name
                 FROM ph_regions
                 ORDER BY region_name ASC'
            );
            if (!$stmt) fail('Query prepare failed: ' . $conn->error, 500);
            $stmt->execute();
            $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            respond($rows);

        // ?level=provinces&regionCode=1
        case 'provinces':
            if (!$regionCode) fail('regionCode is required');
            $stmt = $conn->prepare(
                'SELECT province_id AS code, province_name AS name
                 FROM ph_provinces
                 WHERE region_id = ?
                 ORDER BY province_name ASC'
            );
            if (!$stmt) fail('Query prepare failed: ' . $conn->error, 500);
            $stmt->bind_param('s', $regionCode);
            $stmt->execute();
            $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            respond($rows);

        // ?level=cities&provinceCode=1
        case 'cities':
            if (!$provinceCode) fail('provinceCode is required');
            $stmt = $conn->prepare(
                'SELECT city_id AS code, city_name AS name
                 FROM ph_cities
                 WHERE province_id = ?
                 ORDER BY city_name ASC'
            );
            if (!$stmt) fail('Query prepare failed: ' . $conn->error, 500);
            $stmt->bind_param('s', $provinceCode);
            $stmt->execute();
            $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            respond($rows);

        // ?level=barangays&cityCode=1
        case 'barangays':
            if (!$cityCode) fail('cityCode is required');
            $stmt = $conn->prepare(
                'SELECT barangay_id AS code, barangay_name AS name
                 FROM ph_barangays
                 WHERE city_id = ?
                 ORDER BY barangay_name ASC'
            );
            if (!$stmt) fail('Query prepare failed: ' . $conn->error, 500);
            $stmt->bind_param('s', $cityCode);
            $stmt->execute();
            $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            respond($rows);

        default:
            fail('Invalid level. Use: regions, provinces, cities, barangays');
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>