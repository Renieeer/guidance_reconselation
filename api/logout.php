<?php
// js/auth.js's logout() has always POSTed here "for server-side logout"
// (its own comment) — this file didn't actually exist until now, so that
// fetch was a silent 404, and nothing server-side ever ended a session.
// Now that active_session_token is real (see includes/session-guard.php),
// a proper logout should clear it — otherwise a session that logged out
// client-side is still the account's recorded "active" one, and simply
// reopening the same browser tab (session cookie still present) would
// pass session_guard_current_user()'s check again.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

try {
    require_once 'conn.php';
    require_once __DIR__ . '/../includes/session-guard.php';
    ensure_users_table_session_column($conn);

    $accountId = (int)($_SESSION['user']['id'] ?? 0);
    $sessionToken = $_SESSION['session_token'] ?? '';

    if ($accountId > 0 && $sessionToken !== '') {
        // Only clears the token if it still matches THIS session's own
        // token — guards against a stale/delayed logout request from an
        // already-superseded session accidentally wiping out a newer,
        // legitimate login that happened in the meantime.
        $stmt = $conn->prepare('UPDATE users_tables SET active_session_token = NULL WHERE AccountID = ? AND active_session_token = ?');
        $stmt->bind_param('is', $accountId, $sessionToken);
        $stmt->execute();
        $stmt->close();
    }

    $_SESSION = [];
    session_unset();
    session_destroy();

    echo json_encode(['success' => true, 'message' => 'Logged out']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Logout error: ' . $e->getMessage()]);
}
