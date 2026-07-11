<?php
/**
 * Shared staff access code.
 *
 * Gates staff-login.php so students can't even reach the staff sign-in
 * form. This is a single shared code (not tied to any account) — change
 * it here to rotate it, and share the new value with teachers, counselors,
 * and coordinators through your SDO/school office, not publicly.
 *
 * Note: this is an obscurity layer to keep the staff portal off students'
 * radar, not the real access control — actual authorization still comes
 * from each account's own email/password and role (see api/login.php and
 * js/auth.js's staff-portal role guard).
 */
define('STAFF_ACCESS_PIN', '482913');
