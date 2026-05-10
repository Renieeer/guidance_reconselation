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
            <!-- Page Hero -->
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-speedometer2"></i> Overview</div>
                    <h2 class="page-hero-title">Dashboard</h2>
                    <p class="page-hero-text">Monitor guidance activities and coordination with your school's counselor and district office.</p>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Quick Stats Grid -->
                <div class="dashboard-grid">
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Active Cases</h3>
                            </div>
                            <div class="card-icon"><i class="bi bi-arrow-repeat"></i></div>
                        </div>
                        <div class="card-content">
                            <div class="card-stats" id="activeCases">0</div>
                            <p>Currently under counseling</p>
                        </div>
                        <div class="card-footer">
                            <a href="referrals.php" class="btn btn-primary btn-sm">Manage</a>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">This Week</h3>
                            </div>
                            <div class="card-icon"><i class="bi bi-calendar3"></i></div>
                        </div>
                        <div class="card-content">
                            <div class="card-stats" id="weekSessions">0</div>
                            <p>Sessions scheduled</p>
                        </div>
                        <div class="card-footer">
                            <a href="schedule.php" class="btn btn-primary btn-sm">View Schedule</a>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Total Students</h3>
                            </div>
                            <div class="card-icon"><i class="bi bi-people"></i></div>
                        </div>
                        <div class="card-content">
                            <div class="card-stats" id="totalStudents">0</div>
                            <p>in your caseload</p>
                        </div>
                        <div class="card-footer">
                            <a href="student-record.php" class="btn btn-primary btn-sm">Records</a>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Follow-ups</h3>
                            </div>
                            <div class="card-icon"><i class="bi bi-file-earmark-text"></i></div>
                        </div>
                        <div class="card-content">
                            <div class="card-stats" id="followUps">0</div>
                            <p>Pending follow-ups</p>
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
