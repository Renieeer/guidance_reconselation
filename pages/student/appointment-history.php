<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My History - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="../../css/student-history.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <?php include '../../includes/sidebar-student.php'; ?>
        <div class="main-content">
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-clock-history"></i> Records</div>
                    <h2 class="page-hero-title">My History</h2>
                    <p class="page-hero-text">Every referral, counseling case, follow-up, and online appointment on your record — organized as folders you can open, with filters to find things fast.</p>
                </div>
            </div>

            <div class="page-content">
                <!-- Summary -->
                <div id="shStudentHeaderCard" class="card" style="margin-bottom: 20px; display:none;">
                    <div class="sh-student-header">
                        <div id="shAvatar" class="sh-avatar">?</div>
                        <div>
                            <div id="shStudentName" class="sh-student-name">—</div>
                            <div id="shStudentSub" class="sh-student-sub">—</div>
                        </div>
                        <div id="shStatChips" class="sh-stat-chips"></div>
                    </div>
                </div>

                <!-- Filters -->
                <div id="shFilterCard" class="card" style="margin-bottom: 20px; display:none;">
                    <div class="sh-filter-bar">
                        <div class="sh-filter-field">
                            <label>Search</label>
                            <input type="text" id="shSearchText" placeholder="Search reason, notes, case title...">
                        </div>
                        <div class="sh-filter-field">
                            <label>Record Type</label>
                            <select id="shTypeFilter">
                                <option value="">All Records</option>
                                <option value="referrals">Referrals</option>
                                <option value="counseling">Counseling Sessions</option>
                                <option value="follow_ups">Counseling Follow-Ups</option>
                                <option value="appointments">Online Appointments</option>
                            </select>
                        </div>
                        <div class="sh-filter-field">
                            <label>Status</label>
                            <select id="shStatusFilter">
                                <option value="">All Statuses</option>
                            </select>
                        </div>
                        <div class="sh-filter-field">
                            <label>From</label>
                            <input type="date" id="shDateFrom">
                        </div>
                        <div class="sh-filter-field">
                            <label>To</label>
                            <input type="date" id="shDateTo">
                        </div>
                        <div class="sh-filter-actions">
                            <button class="btn btn-secondary btn-sm" id="shClearFilters" type="button">Clear</button>
                        </div>
                    </div>
                    <div class="sh-result-count" id="shResultCount"></div>
                </div>

                <!-- Folders: narrow nav on the left, wide content panel on the right -->
                <div id="shFolderGrid" class="sh-folder-layout" style="display:none;">
                    <div class="sh-folder-nav" id="shFolderNav">
                        <div class="sh-folder-tab" data-folder="referrals">
                            <div class="sh-folder-icon"><i class="fas fa-file-alt"></i></div>
                            <div>
                                <div class="sh-folder-title">Referrals</div>
                                <div class="sh-folder-subtitle">Intake &amp; screening records</div>
                            </div>
                            <div class="sh-folder-count" id="shCount-referrals">0</div>
                        </div>

                        <div class="sh-folder-tab" data-folder="counseling">
                            <div class="sh-folder-icon"><i class="fas fa-comments"></i></div>
                            <div>
                                <div class="sh-folder-title">Counseling Sessions</div>
                                <div class="sh-folder-subtitle">Case scenarios &amp; notes</div>
                            </div>
                            <div class="sh-folder-count" id="shCount-counseling">0</div>
                        </div>

                        <div class="sh-folder-tab" data-folder="follow_ups">
                            <div class="sh-folder-icon"><i class="fas fa-calendar-check"></i></div>
                            <div>
                                <div class="sh-folder-title">Counseling Appointment Span</div>
                                <div class="sh-folder-subtitle">Follow-up sessions over time</div>
                            </div>
                            <div class="sh-folder-count" id="shCount-follow_ups">0</div>
                        </div>

                        <div class="sh-folder-tab" data-folder="appointments">
                            <div class="sh-folder-icon"><i class="fas fa-calendar-day"></i></div>
                            <div>
                                <div class="sh-folder-title">Online Appointments</div>
                                <div class="sh-folder-subtitle">Your requested visits</div>
                            </div>
                            <div class="sh-folder-count" id="shCount-appointments">0</div>
                        </div>
                    </div>

                    <div class="sh-folder-content">
                        <div class="sh-folder-content-header">
                            <div class="sh-folder-content-title" id="shActiveFolderTitle">Referrals</div>
                        </div>
                        <div class="sh-folder-body" id="shBody-referrals"></div>
                        <div class="sh-folder-body" id="shBody-counseling"></div>
                        <div class="sh-folder-body" id="shBody-follow_ups"></div>
                        <div class="sh-folder-body" id="shBody-appointments"></div>
                    </div>
                </div>

                <!-- Empty / loading states -->
                <div id="shEmptyState" class="sh-empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>Loading your history…</h3>
                    <p>Hang tight while we gather your records.</p>
                </div>
                <div id="shLoadingState" class="sh-loading" style="display:none;">Loading your history…</div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="appointment-history.js"></script>
</body>
</html>
