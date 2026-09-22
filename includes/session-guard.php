<?php
// Real, server-side, DB-backed session validation — one account can only
// ever have ONE active login at a time, across every role, every page,
// and every API request. Enforced here, not by sessionStorage/localStorage
// (see js/auth.js, which still writes those for the existing client-side
// UI code to read from, but no longer for actual authorization).
//
// How single-session-per-account works: users_tables.active_session_token
// always holds the token for that account's MOST RECENT successful login
// (api/login.php generates a fresh one and overwrites the column on every
// login). Every other page/request checks its own $_SESSION['session_token']
// against that column — a session whose token doesn't match the DB's
// current value has been superseded by a newer login somewhere else, and
// is treated as invalid immediately, without waiting for it to expire.
//
// Include this file, then call EXACTLY ONE of:
//   require_page_session()  — at the very top of a pages/<role>/*.php file,
//                              before any HTML output. Redirects to the
//                              login page and exits on failure.
//   require_api_session()   — at the top of an api/*.php endpoint that
//                              needs a logged-in user. Emits a 401 JSON
//                              response and exits on failure.
// Both return the validated user array (the same shape as $_SESSION['user']
// from api/login.php) on success.

// Reuses an existing $conn if the including file (an api/*.php endpoint)
// already made one; otherwise pulls in api/conn.php — this is the only
// spot that needs to know both files might run standalone or together.
// `global $conn` before the require is what makes conn.php's top-level
// `$conn = new mysqli(...)` write to the real global instead of getting
// trapped in this function's local scope.
function session_guard_conn(): mysqli {
    global $conn;
    if (!($conn instanceof mysqli)) {
        require_once __DIR__ . '/../api/conn.php';
    }
    return $conn;
}

// Same defensive-migration pattern as every other schema change in this
// app (see e.g. ensure_users_table_active_column() in api/account-status.php).
function ensure_users_table_session_column(mysqli $conn): void {
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $result = $conn->query("SHOW COLUMNS FROM users_tables LIKE 'active_session_token'");
    if ($result && $result->num_rows > 0) {
        return;
    }

    $conn->query("ALTER TABLE users_tables ADD COLUMN active_session_token VARCHAR(64) DEFAULT NULL");
}

// The core check, shared by both entry points below. Returns the logged-in
// user array if this exact browser session is still the account's one
// active session, or null otherwise (not logged in at all, or superseded
// by a newer login elsewhere — in which case this session is destroyed
// immediately so it can't be reused).
function session_guard_current_user(): ?array {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    if (empty($_SESSION['user']) || empty($_SESSION['session_token'])) {
        return null;
    }

    $accountId = (int)($_SESSION['user']['id'] ?? 0);
    if ($accountId <= 0) {
        return null;
    }

    $conn = session_guard_conn();
    ensure_users_table_session_column($conn);

    $stmt = $conn->prepare('SELECT active_session_token FROM users_tables WHERE AccountID = ?');
    $stmt->bind_param('i', $accountId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $currentToken = $row['active_session_token'] ?? null;
    if ($currentToken === null || !hash_equals($currentToken, $_SESSION['session_token'])) {
        // Someone (possibly this same person, in another tab/browser/device)
        // has logged in again since this session started — this one is no
        // longer the account's active session. Tear it down so the token
        // and user data can't be read again from this browser.
        $_SESSION = [];
        session_unset();
        session_destroy();
        return null;
    }

    return $_SESSION['user'];
}

// Folder name (pages/<this>/*.php) -> the account role(s) allowed on it.
// Derived from the actually-requested script's own path rather than
// __DIR__ (which, inside an included file, always resolves to *this*
// file's folder — includes/ — not the including page's folder), so this
// works correctly regardless of how deep the app is installed.
function session_guard_expected_roles(): ?array {
    $folder = basename(dirname($_SERVER['SCRIPT_FILENAME'] ?? ''));
    $map = [
        'coordinator' => ['coordinator'],
        'counselor' => ['counselor'],
        'other-school' => ['counselor-and-coordinator'],
        'sdo' => ['admin', 'sdo'],
        'teacher' => ['teacher'],
        'student' => ['student'],
    ];
    return $map[$folder] ?? null;
}

// Every page in pages/<role>/ sits at the same fixed depth from the app
// root, so one relative path works for all of them — same value
// js/auth.js's checkAuth() already redirects to for a client-side-detected
// logged-out state, kept identical here for consistency.
const SESSION_GUARD_LOGIN_REDIRECT = '../../index.php';

// Call at the very top of a pages/<role>/*.php file, before any HTML.
function require_page_session(): array {
    // api/conn.php sets Content-Type: application/json (it's normally only
    // ever included by JSON API endpoints) — a page needs to override that
    // back to HTML, or the browser renders the page as raw text instead of
    // markup. Must happen AFTER session_guard_current_user() below, not
    // before: that call is what actually pulls in conn.php (via
    // session_guard_conn()) on a page's very first touch of the DB, and
    // conn.php's own header('Content-Type: application/json') would
    // overwrite an earlier text/html call here, since header() calls
    // apply in the order they run, last one wins.
    $user = session_guard_current_user();
    if ($user === null) {
        header('Location: ' . SESSION_GUARD_LOGIN_REDIRECT);
        exit;
    }

    $expectedRoles = session_guard_expected_roles();
    if ($expectedRoles !== null && !in_array($user['role'], $expectedRoles, true)) {
        header('Location: ' . SESSION_GUARD_LOGIN_REDIRECT);
        exit;
    }

    header('Content-Type: text/html; charset=UTF-8');
    return $user;
}

// Call at the top of an api/*.php endpoint that requires a logged-in user.
function require_api_session(): array {
    $user = session_guard_current_user();
    if ($user === null) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Your session is no longer active — you may have logged in elsewhere. Please log in again.',
            'sessionExpired' => true
        ]);
        exit;
    }
    return $user;
}
