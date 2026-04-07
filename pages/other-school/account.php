<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account - Guidance Management System (Other School)</title>
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
                    <h1>Account Settings</h1>
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
                <!-- Profile Section -->
                <div class="content-section">
                    <h2>Profile Information</h2>
                    <form id="profileForm" class="form-group">
                        <div class="form-row">
                            <div class="form-col">
                                <label for="firstName">First Name:</label>
                                <input type="text" id="firstName" class="form-control" required>
                            </div>
                            <div class="form-col">
                                <label for="lastName">Last Name:</label>
                                <input type="text" id="lastName" class="form-control" required>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-col">
                                <label for="email">Email:</label>
                                <input type="email" id="email" class="form-control" required>
                            </div>
                            <div class="form-col">
                                <label for="phone">Phone:</label>
                                <input type="tel" id="phone" class="form-control">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-col">
                                <label for="position">Position:</label>
                                <input type="text" id="position" class="form-control" value="Coordinator & Counselor" disabled>
                            </div>
                            <div class="form-col">
                                <label for="schoolName">School:</label>
                                <input type="text" id="schoolName" class="form-control" value="Other School" disabled>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary" style="margin-top: 20px;">Update Profile</button>
                    </form>
                </div>

                <!-- Security Section -->
                <div class="content-section">
                    <h2>Security</h2>
                    <form id="securityForm" class="form-group">
                        <div class="form-group">
                            <label for="currentPassword">Current Password:</label>
                            <input type="password" id="currentPassword" class="form-control" required>
                        </div>

                        <div class="form-group">
                            <label for="newPassword">New Password:</label>
                            <input type="password" id="newPassword" class="form-control" required>
                        </div>

                        <div class="form-group">
                            <label for="confirmPassword">Confirm Password:</label>
                            <input type="password" id="confirmPassword" class="form-control" required>
                        </div>

                        <button type="submit" class="btn btn-primary">Change Password</button>
                    </form>
                </div>

                <!-- Preferences Section -->
                <div class="content-section">
                    <h2>Preferences</h2>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="emailNotifications" checked>
                            Receive email notifications
                        </label>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="dailyReport" checked>
                            Receive daily reports
                        </label>
                    </div>
                    <button class="btn btn-primary" onclick="savePreferences()">Save Preferences</button>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/utils.js"></script>
    <script src="../../js/auth.js"></script>
    <script src="account.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', loadAccountPage);
    </script>
</body>
</html>
