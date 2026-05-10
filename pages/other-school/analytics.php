<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics - Guidance Management System (Other School)</title>
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
                    <div class="page-hero-eyebrow"><i class="bi bi-graph-up"></i> Insights</div>
                    <h2 class="page-hero-title">Analytics</h2>
                    <p class="page-hero-text">Review performance metrics and analytics on guidance activities for your school's students.</p>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Summary Stats -->
                <div class="dashboard-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="bi bi-clipboard-data"></i></div>
                        <div>
                            <h3 id="totalAnalytics">0</h3>
                            <p>Total Referrals</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="bi bi-percent"></i></div>
                        <div>
                            <h3 id="completionRate">0%</h3>
                            <p>Completion Rate</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="bi bi-graph-up"></i></div>
                        <div>
                            <h3 id="avgProcessTime">0</h3>
                            <p>Avg Days to Close</p>
                        </div>
                    </div>
                </div>

                <!-- Referral Reason Distribution -->
                <div class="content-section">
                    <h2>Referrals by Reason</h2>
                    <div id="reasonChart">
                        <p style="padding: 20px; color: #999;">Loading chart...</p>
                    </div>
                </div>

                <!-- Stage Distribution -->
                <div class="content-section">
                    <h2>Status Distribution</h2>
                    <table class="data-table" style="margin-top: 20px;">
                        <thead>
                            <tr>
                                <th>Stage</th>
                                <th>Count</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody id="stageTableBody">
                            <tr>
                                <td colspan="3" style="text-align: center; padding: 30px; color: #999;">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Monthly Trend -->
                <div class="content-section">
                    <h2>Referral Trend (Last 6 Months)</h2>
                    <div id="trendChart">
                        <p style="padding: 20px; color: #999;">Loading chart...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/utils.js"></script>
    <script src="../../js/auth.js"></script>
    <script src="analytics.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', loadAnalytics);
    </script>
</body>
</html>
