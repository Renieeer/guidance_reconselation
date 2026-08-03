<?php
// Email OTP verification for new self-registered accounts (register.php /
// staff-register.php -> api/register.php). Reuses EmailJsMailer + mail-config.php
// (see api/notify-appointment.php for the same pattern with appointment mail).
require_once __DIR__ . DIRECTORY_SEPARATOR . 'EmailJsMailer.php';

function otp_log(string $line): void
{
    $logDir = __DIR__ . DIRECTORY_SEPARATOR . 'logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    $file = $logDir . DIRECTORY_SEPARATOR . 'email-otp.log';
    $time = date('Y-m-d H:i:s');
    @file_put_contents($file, "[{$time}] " . $line . "\n", FILE_APPEND | LOCK_EX);
}

function is_mail_enabled(): bool
{
    $configPath = __DIR__ . DIRECTORY_SEPARATOR . 'mail-config.php';
    if (!file_exists($configPath)) {
        return false;
    }
    $config = require $configPath;
    return !empty($config['enabled']);
}

function ensure_email_verification_schema(mysqli $conn): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    // Existing accounts predate this feature and are grandfathered in as
    // verified (DEFAULT 1) — only new self-registrations explicitly insert
    // 0, otherwise every current user would be locked out at their next login.
    $result = $conn->query("SHOW COLUMNS FROM users_tables LIKE 'email_verified'");
    if ($result && $result->num_rows === 0) {
        $conn->query("ALTER TABLE users_tables ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 1");
    }

    $conn->query("
        CREATE TABLE IF NOT EXISTS email_otps (
            id VARCHAR(64) NOT NULL,
            email VARCHAR(255) NOT NULL,
            otp_hash VARCHAR(255) NOT NULL,
            expires_at DATETIME NOT NULL,
            attempts INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    ");
}

function otp_email_content(string $name, string $code): array
{
    $safeName = htmlspecialchars($name !== '' ? $name : 'there', ENT_QUOTES, 'UTF-8');
    $subject = 'Verify your email address';
    $html = <<<HTML
        <p>Hi {$safeName},</p>
        <p>Use the code below to verify your email address and activate your account:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">{$code}</p>
        <p>This code expires in 10 minutes. If you didn't create this account, you can ignore this email.</p>
        <p>&mdash; Guidance Management System</p>
    HTML;
    $text = "Hi {$name},\n\nUse this code to verify your email address: {$code}\n\n"
        . "This code expires in 10 minutes. If you didn't create this account, you can ignore this email.\n\n"
        . "-- Guidance Management System";
    return ['subject' => $subject, 'html' => $html, 'text' => $text];
}

/**
 * Generates a new 6-digit code, stores it (replacing any previous one for
 * this email), and emails it. Throttled to one every 60s per email.
 *
 * @return array{success: bool, message: string, emailSent: bool}
 */
function generate_and_send_otp(mysqli $conn, string $email, string $name): array
{
    ensure_email_verification_schema($conn);

    $throttleStmt = $conn->prepare("SELECT created_at FROM email_otps WHERE email = ? ORDER BY created_at DESC LIMIT 1");
    $throttleStmt->bind_param('s', $email);
    $throttleStmt->execute();
    $lastRow = $throttleStmt->get_result()->fetch_assoc();
    $throttleStmt->close();

    if ($lastRow) {
        $secondsSinceLast = time() - strtotime($lastRow['created_at']);
        if ($secondsSinceLast < 60) {
            $wait = 60 - $secondsSinceLast;
            return ['success' => false, 'message' => "Please wait {$wait}s before requesting another code.", 'emailSent' => false];
        }
    }

    $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $hash = password_hash($code, PASSWORD_BCRYPT);
    // Computed in PHP (rather than left to MySQL's DEFAULT CURRENT_TIMESTAMP)
    // and compared later with PHP's own time() — this server's MySQL runs on
    // its OS "SYSTEM" timezone (Asia/Manila), while PHP defaults to UTC, an
    // 8-hour mismatch that would otherwise silently break every expiry/
    // throttle check against this table.
    $now = time();
    $createdAt = date('Y-m-d H:i:s', $now);
    $expiresAt = date('Y-m-d H:i:s', $now + 600);
    $id = 'otp_' . bin2hex(random_bytes(8));

    $deleteStmt = $conn->prepare("DELETE FROM email_otps WHERE email = ?");
    $deleteStmt->bind_param('s', $email);
    $deleteStmt->execute();
    $deleteStmt->close();

    $insertStmt = $conn->prepare("INSERT INTO email_otps (id, email, otp_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)");
    $insertStmt->bind_param('sssss', $id, $email, $hash, $expiresAt, $createdAt);
    $insertStmt->execute();
    $insertStmt->close();

    if (!is_mail_enabled()) {
        otp_log("Skipped OTP email to {$email}: mail sending disabled in mail-config.php");
        return ['success' => true, 'message' => 'Verification code generated but mail sending is disabled.', 'emailSent' => false];
    }

    $config = require __DIR__ . DIRECTORY_SEPARATOR . 'mail-config.php';
    $content = otp_email_content($name, $code);
    $mailer = new EmailJsMailer($config);
    $result = $mailer->send($email, $name, $content['subject'], $content['html'], $content['text']);

    otp_log(($result['success'] ? 'Sent' : 'Failed') . " OTP to {$email}: " . $result['message']);

    return [
        'success' => $result['success'],
        'message' => $result['success'] ? 'Verification code sent.' : $result['message'],
        'emailSent' => $result['success']
    ];
}

/**
 * @return array{success: bool, message: string}
 */
function verify_email_otp(mysqli $conn, string $email, string $code): array
{
    ensure_email_verification_schema($conn);

    $stmt = $conn->prepare("SELECT id, otp_hash, expires_at, attempts FROM email_otps WHERE email = ? ORDER BY created_at DESC LIMIT 1");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        return ['success' => false, 'message' => 'No verification code found for this email. Please request a new one.'];
    }

    if ((int)$row['attempts'] >= 5) {
        return ['success' => false, 'message' => 'Too many incorrect attempts. Please request a new code.'];
    }

    if (strtotime($row['expires_at']) < time()) {
        return ['success' => false, 'message' => 'This code has expired. Please request a new one.'];
    }

    if (!password_verify($code, $row['otp_hash'])) {
        $incStmt = $conn->prepare("UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?");
        $incStmt->bind_param('s', $row['id']);
        $incStmt->execute();
        $incStmt->close();
        return ['success' => false, 'message' => 'Incorrect code. Please try again.'];
    }

    $updateStmt = $conn->prepare("UPDATE users_tables SET email_verified = 1 WHERE email = ?");
    $updateStmt->bind_param('s', $email);
    $updateStmt->execute();
    $updateStmt->close();

    $deleteStmt = $conn->prepare("DELETE FROM email_otps WHERE email = ?");
    $deleteStmt->bind_param('s', $email);
    $deleteStmt->execute();
    $deleteStmt->close();

    otp_log("Verified email for {$email}");

    return ['success' => true, 'message' => 'Email verified successfully.'];
}
