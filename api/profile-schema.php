<?php
/**
 * Shared profile-photo schema helper.
 *
 * users_tables.profile_image doesn't exist on every deployment of this
 * schema yet. Add it defensively the same way api/grade-scope.php and
 * api/account-status.php do for their own columns — MySQL 8 has no "ADD
 * COLUMN IF NOT EXISTS", so existence is checked via SHOW COLUMNS first.
 *
 * Pure-function file (no top-level execution) so it's safe to require from
 * multiple entry points (api/login.php, api/profile.php) the same way
 * grade-scope.php/account-status.php already are.
 */
function ensure_users_table_profile_image_column(mysqli $conn): void {
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $result = $conn->query("SHOW COLUMNS FROM users_tables LIKE 'profile_image'");
    if ($result && $result->num_rows > 0) {
        return;
    }

    $conn->query("ALTER TABLE users_tables ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL");
}
