<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-counselor.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Page Hero -->
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-graph-up"></i> Insights</div>
                    <h2 class="page-hero-title">Analytics</h2>
                    <p class="page-hero-text">View performance metrics and analytics on your counseling activities and student outcomes.</p>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Analytics Cards -->
                <div class="dashboard-grid">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Referrals by Reason</h3>
                        </div>
                        <div class="card-content">
                            <div class="text-sm lh-lg">
                                <p><strong>Academic:</strong> <span id="analyticsAcademic">0</span></p>
                                <p><strong>Behavioral:</strong> <span id="analyticsBehavioral">0</span></p>
                                <p><strong>Mental Health:</strong> <span id="analyticsMental">0</span></p>
                                <p><strong>Family Issues:</strong> <span id="analyticsFamily">0</span></p>
                                <p><strong>Other:</strong> <span id="analyticsOther">0</span></p>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Case Status Distribution</h3>
                        </div>
                        <div class="card-content">
                            <div class="text-sm lh-lg">
                                <p><strong>Submitted:</strong> <span id="analyticsSub">0</span></p>
                                <p><strong>In Review:</strong> <span id="analyticsReview">0</span></p>
                                <p><strong>In Counseling:</strong> <span id="analyticsCounseling">0</span></p>
                                <p><strong>In Progress:</strong> <span id="analyticsProgress">0</span></p>
                                <p><strong>Closed:</strong> <span id="analyticsClosed">0</span></p>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Urgency Levels</h3>
                        </div>
                        <div class="card-content">
                            <div class="text-sm lh-lg">
                                <p><strong>Low:</strong> <span id="analyticsLow">0</span></p>
                                <p><strong>Medium:</strong> <span id="analyticsMedium">0</span></p>
                                <p><strong>High:</strong> <span id="analyticsHigh">0</span></p>
                                <p><strong>Crisis:</strong> <span id="analyticsCrisis">0</span></p>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Performance Metrics</h3>
                        </div>
                        <div class="card-content">
                            <div class="text-sm lh-lg">
                                <p><strong>Avg. Resolution Time:</strong> <span id="avgTime">N/A</span></p>
                                <p><strong>Cases Resolved:</strong> <span id="resolved">0</span></p>
                                <p><strong>Closure Rate:</strong> <span id="closureRate">0%</span></p>
                                <p><strong>Student Success:</strong> <span id="successRate">N/A</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Detailed Statistics Table -->
                <div class="table-container mt-5">
                    <h2 class="mb-4">Detailed Statistics</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Value</th>
                                <th>Percentage</th>
                                <th>Trend</th>
                            </tr>
                        </thead>
                        <tbody id="statsTableBody">
                            <tr>
                                <td colspan="4" class="text-center p-5 text-muted">Loading statistics...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Charts Section -->
                <div class="mt-5">
                    <h2 class="mb-4">Comprehensive Analytics Charts</h2>
                    
                    <div class="dashboard-grid">
                        <!-- Referral Reason Chart -->
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Referral Reasons Distribution</h3>
                            </div>
                            <div class="card-content" style="position: relative; height: 300px;">
                                <canvas id="referralReasonChart"></canvas>
                            </div>
                        </div>

                        <!-- Report Case Status Chart -->
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Report Case Status</h3>
                            </div>
                            <div class="card-content" style="position: relative; height: 300px;">
                                <canvas id="reportCaseChart"></canvas>
                            </div>
                        </div>

                        <!-- Follow-up Submission Status Chart -->
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Follow-up Submission Status</h3>
                            </div>
                            <div class="card-content" style="position: relative; height: 300px;">
                                <canvas id="followUpChart"></canvas>
                            </div>
                        </div>

                        <!-- Combined Timeline Chart -->
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Case Processing Timeline</h3>
                            </div>
                            <div class="card-content" style="position: relative; height: 300px;">
                                <canvas id="timelineChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="analytics.js"></script>
</body>
</html>
