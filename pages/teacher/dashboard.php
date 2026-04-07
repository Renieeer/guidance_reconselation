<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teacher Dashboard - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-teacher.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Topbar -->
            <div class="topbar">
                <div class="topbar-left">
                    <h1>Dashboard</h1>
                </div>
                <div class="topbar-right">
                    <div class="user-info">
                        <div class="user-avatar" id="userAvatar">TJ</div>
                        <div>
                            <div class="fw-bold" id="userName">Teacher</div>
                            <small class="text-muted" id="userRole">Teacher</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <div class="alert alert-success" id="successMessage" style="display: none;"></div>

                <!-- Dashboard Grid -->
                <div class="dashboard-grid">
                    <!-- Referral Stats -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Total Referrals</h3>
                            </div>
                            <div class="card-icon"><i class="bi bi-box-arrow-up"></i></div>
                        </div>
                        <div class="card-content">
                            <div class="card-stats" id="totalReferrals">0</div>
                            <p>Referrals submitted by you</p>
                        </div>
                        <div class="card-footer">
                            <a href="referral-form.php" class="btn btn-primary btn-sm">Submit New</a>
                        </div>
                    </div>

                    <!-- Pending Referrals -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Pending Review</h3>
                            </div>
                            <div class="card-icon"><i class="bi bi-hourglass-split"></i></div>
                        </div>
                        <div class="card-content">
                            <div class="card-stats" id="pendingReferrals">0</div>
                            <p>Awaiting coordinator review</p>
                        </div>
                    </div>

                    <!-- Approved Referrals -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Approved</h3>
                            </div>
                            <div class="card-icon"><i class="bi bi-check-circle"></i></div>
                        </div>
                        <div class="card-content">
                            <div class="card-stats" id="approvedReferrals">0</div>
                            <p>Approved and in progress</p>
                        </div>
                    </div>

                    <!-- Closed Cases -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Closed Cases</h3>
                            </div>
                            <div class="card-icon"><i class="bi bi-flag"></i></div>
                        </div>
                        <div class="card-content">
                            <div class="card-stats" id="closedReferrals">0</div>
                            <p>Completed cases</p>
                        </div>
                    </div>
                </div>

                <!-- Recent Referrals Table -->
                <div class="table-container">
                    <h2 class="mb-4">Your Recent Referrals</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Referral ID</th>
                                <th>Student Name</th>
                                <th>Grade</th>
                                <th>Date Submitted</th>
                                <th>Status</th>
                                <th>Stage</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="referralsTableBody">
                            <tr>
                                <td colspan="7" class="text-center p-5 text-muted">
                                    No referrals yet. <a href="referral-form.php">Submit one now</a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="teacher.js"></script>
</body>
</html>
