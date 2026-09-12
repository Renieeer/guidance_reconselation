<?php
// Streams a user's profile photo out of users_tables.profile_image_data —
// the photo lives in the database now, not on disk (see
// ensure_users_table_profile_image_blob_columns() in profile-schema.php),
// so this is the only place a profile picture is actually read back out.
// Referenced as api/avatar.php?id=<AccountID>&v=<token> everywhere a page
// would otherwise have linked straight to uploads/profile-images/*.jpg —
// see userAvatarUrl() in js/utils.js.

require_once 'conn.php';
require_once 'profile-schema.php';

ensure_users_table_profile_image_blob_columns($conn);

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    exit;
}

$stmt = $conn->prepare('SELECT profile_image_data, profile_image_mime FROM users_tables WHERE AccountID = ?');
$stmt->bind_param('i', $id);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$row || $row['profile_image_data'] === null) {
    http_response_code(404);
    exit;
}

header('Content-Type: ' . ($row['profile_image_mime'] ?: 'application/octet-stream'));
header('Content-Length: ' . strlen($row['profile_image_data']));
// Long-lived — the URL's ?v= token changes on every new upload (see
// fetch_profile() in api/profile.php), so a stale cache is never stale.
header('Cache-Control: public, max-age=31536000, immutable');
echo $row['profile_image_data'];
