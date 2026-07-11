<?php
/**
 * Shared grade-scope helpers.
 *
 * A staff account's grade scope is stored on users_tables.Grade as a
 * comma-separated list of grade numbers, e.g. "7", "11,12", "7,8,9,10".
 * Empty/NULL means "no restriction" (fail-open) so schools that don't use
 * per-grade staff splitting are unaffected.
 *
 * Student/case/appointment grade values are messy free text ("Grade 7",
 * "7", or legacy codes "1"-"6" mapping to Grade 7-12), so everything here
 * normalizes through grade_text_variants()/normalize_grade_number().
 */

/**
 * users_tables.Grade doesn't exist on every deployment of this schema yet
 * (it's newer than the original table). Add it defensively the same way
 * api/follow-up.php does for its own columns — MySQL 8 has no "ADD COLUMN
 * IF NOT EXISTS", so existence is checked via SHOW COLUMNS first.
 */
function ensure_users_table_grade_column(mysqli $conn): void {
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $result = $conn->query("SHOW COLUMNS FROM users_tables LIKE 'Grade'");
    if ($result && $result->num_rows > 0) {
        return;
    }

    $conn->query("ALTER TABLE users_tables ADD COLUMN Grade VARCHAR(45) DEFAULT NULL");
}

function grade_scope_to_list(?string $scope): array {
    $scope = trim((string)$scope);
    if ($scope === '') {
        return [];
    }

    $grades = [];
    foreach (explode(',', $scope) as $part) {
        $num = (int)trim($part);
        if ($num >= 7 && $num <= 12) {
            $grades[] = $num;
        }
    }

    return array_values(array_unique($grades));
}

/** Legacy code (as used by referral-form.js's gradeMap) -> grade number. */
function grade_legacy_code_map(): array {
    return ['1' => 7, '2' => 8, '3' => 9, '4' => 10, '5' => 11, '6' => 12];
}

function normalize_grade_number($rawGrade): ?int {
    $raw = trim((string)$rawGrade);
    if ($raw === '') {
        return null;
    }

    if (ctype_digit($raw)) {
        $num = (int)$raw;
        if ($num >= 7 && $num <= 12) {
            return $num;
        }
        $legacy = grade_legacy_code_map();
        if (isset($legacy[$raw])) {
            return $legacy[$raw];
        }
    }

    // Free-text fields (e.g. "Grade 10 - Section Alpha") — pull the first
    // grade-shaped number out of the string rather than requiring an exact match.
    if (preg_match('/grade\s*(\d{1,2})/i', $raw, $m)) {
        $num = (int)$m[1];
        if ($num >= 7 && $num <= 12) {
            return $num;
        }
    }

    return null;
}

/** Expand grade numbers into every text form that might be stored for them. */
function grade_text_variants(array $gradeNumbers): array {
    $legacy = array_flip(grade_legacy_code_map());
    $variants = [];

    foreach ($gradeNumbers as $num) {
        $num = (int)$num;
        $variants[] = 'Grade ' . $num;
        $variants[] = (string)$num;
        if (isset($legacy[$num])) {
            $variants[] = (string)$legacy[$num];
        }
    }

    return array_values(array_unique($variants));
}

/** True if $scopeGrades is empty (no restriction) or $rawGrade normalizes into it. */
function grade_matches_scope(?string $rawGrade, array $scopeGrades): bool {
    if (empty($scopeGrades)) {
        return true;
    }

    $normalized = normalize_grade_number($rawGrade);
    if ($normalized === null) {
        return false;
    }

    return in_array($normalized, $scopeGrades, true);
}

/**
 * Build a `column IN (?,?,...)` fragment (plus bound params/types) for the
 * given grade scope. Returns null when the scope is empty (no restriction —
 * caller should simply skip adding a clause in that case).
 *
 * @return array{0:string,1:array,2:string}|null [$sql, $params, $types]
 */
function build_grade_in_clause(string $column, array $scopeGrades): ?array {
    if (empty($scopeGrades)) {
        return null;
    }

    $variants = grade_text_variants($scopeGrades);
    $placeholders = implode(',', array_fill(0, count($variants), '?'));

    return [
        "{$column} IN ({$placeholders})",
        $variants,
        str_repeat('s', count($variants))
    ];
}

/** Human label for a grade scope, e.g. "Grade 8" / "Grades 11-12" / "Grades 7-10". */
function grade_scope_label(array $scopeGrades): string {
    if (empty($scopeGrades)) {
        return '';
    }

    sort($scopeGrades);
    if (count($scopeGrades) === 1) {
        return 'Grade ' . $scopeGrades[0];
    }

    $isConsecutive = true;
    for ($i = 1; $i < count($scopeGrades); $i++) {
        if ($scopeGrades[$i] !== $scopeGrades[$i - 1] + 1) {
            $isConsecutive = false;
            break;
        }
    }

    if ($isConsecutive) {
        return 'Grades ' . $scopeGrades[0] . '-' . $scopeGrades[count($scopeGrades) - 1];
    }

    return 'Grades ' . implode(', ', $scopeGrades);
}
