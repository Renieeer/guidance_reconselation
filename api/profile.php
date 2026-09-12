<?php
// Self-service "my account" endpoint — lets a logged-in user of any role
// (student, teacher, counselor, coordinator, other-school, sdo) view and
// edit their own name/password and upload a profile photo.
//
// This intentionally trusts the `id` the client sends, the same way
// api/manage-accounts.php already does — this app authenticates on the
// client (sessionStorage/localStorage) rather than server-side sessions, so
// every existing self-service/admin endpoint follows that same model.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'conn.php';
require_once 'profile-schema.php';

// Profile photos live in users_tables.profile_image_data (a BLOB) — see
// ensure_users_table_profile_image_blob_columns() — and are streamed back
// out by api/avatar.php. profile_image itself now just holds an opaque
// token (still the old stored-filename shape) reused as a cache-busting
// value in that URL; mirrors referral_assessment/referral_consent's own
// move to DB storage in api/referral-assessment.php / referral-consent.php.
$avatarAllowedExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
$avatarAllowedMime = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$avatarMaxBytes = 3 * 1024 * 1024; // 3 MB

function send_json(int $statusCode, array $payload): void {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

function fetch_profile(mysqli $conn, int $id): ?array {
    $stmt = $conn->prepare("SELECT AccountID, First_name, Last_name, email, Type, school_attended, profile_image FROM users_tables WHERE AccountID = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        return null;
    }

    return [
        'id' => (int)$row['AccountID'],
        'firstName' => $row['First_name'],
        'lastName' => $row['Last_name'],
        'name' => trim($row['First_name'] . ' ' . $row['Last_name']),
        'email' => $row['email'],
        'role' => $row['Type'],
        'school' => $row['school_attended'],
        // Root-relative (no "../../") — every consumer (this page's own JS,
        // and the sidebar avatar rendered from every pages/<role>/*.php)
        // prepends its own path prefix, so the stored/transmitted value
        // stays depth-agnostic. See userAvatarUrl() in js/utils.js. The
        // actual bytes live in profile_image_data — this just points at
        // api/avatar.php, with profile_image reused as a cache-busting token.
        'profileImage' => $row['profile_image'] ? ('api/avatar.php?id=' . $row['AccountID'] . '&v=' . urlencode($row['profile_image'])) : null
    ];
}

try {
    ensure_users_table_profile_image_column($conn);
    ensure_users_table_profile_image_blob_columns($conn);

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            send_json(400, ['success' => false, 'message' => 'id is required']);
        }

        $profile = fetch_profile($conn, $id);
        if (!$profile) {
            send_json(404, ['success' => false, 'message' => 'Account not found']);
        }

        send_json(200, ['success' => true, 'data' => $profile]);
    }

    if ($method === 'POST') {
        $id = (int)($_POST['id'] ?? 0);
        if ($id <= 0) {
            send_json(400, ['success' => false, 'message' => 'id is required']);
        }

        $stmt = $conn->prepare("SELECT AccountID FROM users_tables WHERE AccountID = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $existing = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$existing) {
            send_json(404, ['success' => false, 'message' => 'Account not found']);
        }

        // Name (+ optional password) update — both name fields are required
        // together so a request can't blank one out.
        if (isset($_POST['first_name']) || isset($_POST['last_name'])) {
            $firstName = trim((string)($_POST['first_name'] ?? ''));
            $lastName = trim((string)($_POST['last_name'] ?? ''));
            $password = trim((string)($_POST['password'] ?? ''));
            $passwordConfirm = trim((string)($_POST['password_confirm'] ?? ''));

            if ($firstName === '' || $lastName === '') {
                send_json(400, ['success' => false, 'message' => 'First and last name are required']);
            }

            if ($password !== '' || $passwordConfirm !== '') {
                if ($password !== $passwordConfirm) {
                    send_json(400, ['success' => false, 'message' => 'Passwords do not match']);
                }
                if (strlen($password) < 6) {
                    send_json(400, ['success' => false, 'message' => 'Password must be at least 6 characters']);
                }

                $hashed = password_hash($password, PASSWORD_BCRYPT);
                $stmt = $conn->prepare("UPDATE users_tables SET First_name = ?, Last_name = ?, Password = ? WHERE AccountID = ?");
                $stmt->bind_param('sssi', $firstName, $lastName, $hashed, $id);
            } else {
                $stmt = $conn->prepare("UPDATE users_tables SET First_name = ?, Last_name = ? WHERE AccountID = ?");
                $stmt->bind_param('ssi', $firstName, $lastName, $id);
            }

            if (!$stmt->execute()) {
                send_json(500, ['success' => false, 'message' => 'Update failed: ' . $stmt->error]);
            }
            $stmt->close();
        }

        // Remove photo
        if (($_POST['remove_image'] ?? '') === '1') {
            $stmt = $conn->prepare("UPDATE users_tables SET profile_image = NULL, profile_image_data = NULL, profile_image_mime = NULL WHERE AccountID = ?");
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $stmt->close();
        }

        // Photo upload
        if (isset($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
            $file = $_FILES['image'];

            if ($file['error'] !== UPLOAD_ERR_OK) {
                send_json(400, ['success' => false, 'message' => 'Upload failed (error code ' . $file['error'] . ')']);
            }

            if ($file['size'] > $avatarMaxBytes) {
                send_json(400, ['success' => false, 'message' => 'Image is too large. Maximum size is 3 MB.']);
            }

            if (!is_uploaded_file($file['tmp_name'])) {
                send_json(400, ['success' => false, 'message' => 'Invalid upload']);
            }

            $ext = strtolower(pathinfo(basename($file['name']), PATHINFO_EXTENSION));
            if (!in_array($ext, $avatarAllowedExt, true)) {
                send_json(400, ['success' => false, 'message' => 'Only JPG, PNG, GIF, and WEBP images are allowed.']);
            }

            // Detected from the file's actual bytes, not the client-supplied
            // extension/Content-Type — that's what api/avatar.php serves back
            // as the image's real Content-Type.
            $mime = @mime_content_type($file['tmp_name']) ?: 'image/' . ($ext === 'jpg' ? 'jpeg' : $ext);
            if (!in_array($mime, $avatarAllowedMime, true)) {
                send_json(400, ['success' => false, 'message' => 'Only JPG, PNG, GIF, and WEBP images are allowed.']);
            }

            $imageData = file_get_contents($file['tmp_name']);
            if ($imageData === false) {
                send_json(500, ['success' => false, 'message' => 'Failed to read the uploaded image']);
            }

            // Just an opaque token now — api/avatar.php?id=X ignores it beyond
            // using it as a cache-busting ?v= value (see fetch_profile()).
            $token = 'avatar_' . $id . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;

            $stmt = $conn->prepare("UPDATE users_tables SET profile_image = ?, profile_image_data = ?, profile_image_mime = ? WHERE AccountID = ?");
            $stmt->bind_param('sssi', $token, $imageData, $mime, $id);
            $stmt->execute();
            $stmt->close();
        }

        $profile = fetch_profile($conn, $id);
        send_json(200, ['success' => true, 'message' => 'Profile updated successfully', 'data' => $profile]);
    }

    send_json(405, ['success' => false, 'message' => 'Method not allowed']);
} catch (Throwable $e) {
    send_json(500, ['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
