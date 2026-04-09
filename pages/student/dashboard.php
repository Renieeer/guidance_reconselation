<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Dashboard - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-student.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Topbar -->
            <div class="topbar">
                <div class="topbar-left">
                    <h1>Dashboard</h1>
                </div>
                <div class="topbar-right">
                    <div class="user-info">
                        <div class="user-avatar" id="userAvatar">ST</div>
                        <div>
                            <div style="font-weight: 600;" id="userName">Student</div>
                            <small style="color: #64748b;" id="userRole">Student</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Dashboard Grid -->
                <div class="dashboard-grid">
                    <!-- Referral Status Card -->
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h3 style="margin: 0;"><i class="bi bi-clipboard-data"></i> Referral Status</h3>
                            <span class="badge" id="referralCount" style="background: #3b82f6; padding: 6px 12px; border-radius: 20px; color: white; font-size: 0.85em;">0</span>
                        </div>
                        <p style="color: #64748b; margin-bottom: 12px;">View your referral progress</p>
                        <div id="referralProgressPreview" style="margin-bottom: 12px; font-size: 0.9em;">
                            <!-- Quick progress preview will appear here -->
                        </div>
                        <a href="referral-status.php" class="btn btn-primary" style="width: 100%;">View Referrals</a>
                    </div>

                    <!-- Appointments Card -->
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h3 style="margin: 0;"><i class="bi bi-calendar3"></i> Appointments</h3>
                            <span class="badge" id="appointmentCount" style="background: #8b5cf6; padding: 6px 12px; border-radius: 20px; color: white; font-size: 0.85em;">0</span>
                        </div>
                        <p style="color: #64748b; margin-bottom: 12px;">Check your scheduled appointments</p>
                        <a href="schedule.php" class="btn btn-primary" style="width: 100%;">View Schedule</a>
                    </div>

                    <!-- Feedback Card -->
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h3 style="margin: 0;"><i class="bi bi-chat-dots"></i> Feedback</h3>
                        </div>
                        <p style="color: #64748b; margin-bottom: 12px;">Send feedback to counselor</p>
                        <a href="feedback.php" class="btn btn-primary" style="width: 100%;">Send Feedback</a>
                    </div>

                    <!-- History Card -->
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h3 style="margin: 0;"><i class="bi bi-calendar-check"></i> History</h3>
                            <span class="badge" id="historyCount" style="background: #ec4899; padding: 6px 12px; border-radius: 20px; color: white; font-size: 0.85em;">0</span>
                        </div>
                        <p style="color: #64748b; margin-bottom: 12px;">View past appointments and sessions</p>
                        <a href="appointment-history.php" class="btn btn-primary" style="width: 100%;">View History</a>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="card mt-5">
                    <h2 class="card-title">Recent Activity</h2>
                    <div id="activityFeed" style="max-height: 400px; overflow-y: auto;">
                        <p style="text-align: center; color: #999; padding: 30px;">No recent activity</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="dashboard.js"></script>
</body>
</html>
