<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Combined Dashboard - Guidance Management System (Other School)</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-other-school.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Topbar -->
            <div class="topbar">
                <div class="topbar-left">
                    <h1>Combined Dashboard</h1>
                </div>
                <div class="topbar-right">
                    <div class="user-info">
                        <div class="user-avatar" id="userAvatar">CC</div>
                        <div>
                            <div class="fw-bold" id="userName">Staff</div>
                            <small class="text-muted" id="userRole">Coordinator & Counselor</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Quick Stats Grid -->
                <div class="dashboard-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="bi bi-clipboard-data"></i></div>
                        <div>
                            <h3 id="totalReferrals">0</h3>
                            <p>Total Referrals</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="bi bi-hourglass-split"></i></div>
                        <div>
                            <h3 id="pendingReferrals">0</h3>
                            <p>Pending Review</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="bi bi-chat-dots"></i></div>
                        <div>
                            <h3 id="activeCases">0</h3>
                            <p>Active Cases</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="bi bi-check-circle"></i></div>
                        <div>
                            <h3 id="closedCases">0</h3>
                            <p>Closed Cases</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="bi bi-person-check"></i></div>
                        <div>
                            <h3 id="totalStudents">0</h3>
                            <p>Students Served</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="bi bi-calendar-check"></i></div>
                        <div>
                            <h3 id="weekSessions">0</h3>
                            <p>Sessions This Week</p>
                        </div>
                    </div>
                </div>

                <!-- Stage Distribution -->
                <div class="content-section">
                    <h2>Referral Pipeline</h2>
                    <div class="pipeline-grid">
                        <div class="pipeline-stage">
                            <div class="stage-label">Submitted</div>
                            <div class="stage-count" id="stageSub">0</div>
                        </div>
                        <div class="pipeline-stage">
                            <div class="stage-label">Under Review</div>
                            <div class="stage-count" id="stageReview">0</div>
                        </div>
                        <div class="pipeline-stage">
                            <div class="stage-label">Follow Up</div>
                            <div class="stage-count" id="stageFollowUp">0</div>
                        </div>
                        <div class="pipeline-stage">
                            <div class="stage-label">Counseling</div>
                            <div class="stage-count" id="stageCounseling">0</div>
                        </div>
                        <div class="pipeline-stage">
                            <div class="stage-label">In Progress</div>
                            <div class="stage-count" id="stageProgress">0</div>
                        </div>
                        <div class="pipeline-stage">
                            <div class="stage-label">Closed</div>
                            <div class="stage-count" id="stageClosed">0</div>
                        </div>
                    </div>
                </div>

                <!-- Recent Referrals -->
                <div class="content-section">
                    <h2>Recent Referrals</h2>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Student Name</th>
                                <th>Reason</th>
                                <th>Submitted By</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="recentReferralsBody">
                            <tr>
                                <td colspan="6" style="text-align: center; padding: 30px; color: #999;">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/utils.js"></script>
    <script src="../../js/auth.js"></script>
    <script src="other-school.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', loadCombinedDashboard);
    </script>
</body>
</html>
