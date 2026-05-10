<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coordinator Dashboard - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-coordinator.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Page Hero -->
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-speedometer2"></i> Overview</div>
                    <h2 class="page-hero-title">Coordinator Dashboard</h2>
                    <p class="page-hero-text">Track referrals, manage schedules, and oversee guidance activities across your school.</p>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Dashboard Grid -->
                <div class="dashboard-grid">
                    <!-- Total Referrals -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Total Referrals</h3>
                            </div>
                            <div class="card-icon"><i class="bi bi-box-arrow-up"></i></div>
                        </div>
                        <div class="card-content">
                            <div class="card-stats" id="totalReferrals">0</div>
                            <p>All referrals in system</p>
                        </div>
                        <div class="card-footer">
                            <a href="referrals.php" class="btn btn-primary btn-sm">View All</a>
                        </div>
                    </div>

                    <!-- Pending Review -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Pending Review</h3>
                            </div>
                            <div class="card-icon"><i class="bi bi-hourglass-split"></i></div>
                        </div>
                        <div class="card-content">
                            <div class="card-stats" id="pendingReferrals">0</div>
                            <p>Awaiting review</p>
                        </div>
                        <div class="card-footer">
                            <a href="referrals.html?status=pending" class="btn btn-warning btn-sm">Review</a>
                        </div>
                    </div>

                    <!-- Active Cases -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Active Cases</h3>
                            </div>
                            <div class="card-icon"><i class="bi bi-arrow-repeat"></i></div>
                        </div>
                        <div class="card-content">
                            <div class="card-stats" id="activeCases">0</div>
                            <p>Currently in progress</p>
                        </div>
                        <div class="card-footer">
                            <a href="referrals.html?status=active" class="btn btn-primary btn-sm">Manage</a>
                        </div>
                    </div>

                    <!-- Closed Cases -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Closed Cases</h3>
                            </div>
                            <div class="card-icon">✅</div>
                        </div>
                        <div class="card-content">
                            <div class="card-stats" id="closedCases">0</div>
                            <p>Completed cases</p>
                        </div>
                    </div>
                </div>

                <!-- Recent Referrals & Activities -->
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
                    <!-- Recent Referrals -->
                    <div class="table-container">
                        <h2 class="mb-4">Recent Referrals</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Referral ID</th>
                                    <th>Student</th>
                                    <th>Reason</th>
                                    <th>Submitted By</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="recentReferralsBody">
                                <tr>
                                    <td colspan="6" class="text-center p-5 text-muted">No referrals yet</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Quick Stats -->
                    <div>
                        <div class="card">
                            <h3 class="card-title">Referral Distribution</h3>
                            <div style="margin-top: 15px;">
                                <p class="text-sm m-2"><strong>Submitted:</strong> <span id="stageSub">0</span></p>
                                <p class="text-sm m-2"><strong>In Review:</strong> <span id="stageReview">0</span></p>
                                <p class="text-sm m-2"><strong>Follow-up:</strong> <span id="stageFollowUp">0</span></p>
                                <p class="text-sm m-2"><strong>Counseling:</strong> <span id="stageCounseling">0</span></p>
                                <p class="text-sm m-2"><strong>In Progress:</strong> <span id="stageProgress">0</span></p>
                                <p class="text-sm m-2"><strong>Closed:</strong> <span id="stageClosed">0</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="coordinator.js"></script>
</body>
</html>
