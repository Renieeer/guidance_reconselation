<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Settings - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-coordinator.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Topbar -->
            <div class="topbar">
                <div class="topbar-left">
                    <h1>Account Settings</h1>
                </div>
                <div class="topbar-right">
                    <div class="user-info">
                        <div class="user-avatar" id="userAvatar">CJ</div>
                        <div>
                            <div style="font-weight: 600;" id="userName">Coordinator</div>
                            <small class="text-muted" id="userRole">Coordinator</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <div class="max-w-lg mx-auto">
                    <!-- Profile Section -->
                    <div class="card mb-5">
                        <div class="card-header">
                            <div class="card-title">Profile Information</div>
                        </div>
                        <div class="profile-header">
                            <div class="user-avatar profile-avatar-lg" id="profileAvatar">CJ</div>
                            <div class="profile-name" id="profileName">Coordinator Name</div>
                            <div class="profile-role" id="profileEmail">coordinator@school.com</div>
                        </div>

                        <form id="profileForm">
                            <div class="form-group">
                                <label for="fullName">Full Name</label>
                                <input type="text" id="fullName" name="fullName" required>
                            </div>

                            <div class="form-group">
                                <label for="email">Email Address</label>
                                <input type="email" id="email" name="email" disabled>
                            </div>

                            <div class="form-group">
                                <label for="phone">Phone Number</label>
                                <input type="tel" id="phone" name="phone">
                            </div>

                            <div class="form-group">
                                <label for="department">Department</label>
                                <input type="text" id="department" name="department" placeholder="e.g., Guidance Services">
                            </div>

                            <button type="submit" class="btn btn-success">Save Changes</button>
                        </form>
                    </div>

                    <!-- Password Section -->
                    <div class="card mb-5">
                        <div class="card-header">
                            <div class="card-title">Change Password</div>
                        </div>
                        <form id="passwordForm">
                            <div class="form-group">
                                <label for="currentPassword">Current Password</label>
                                <input type="password" id="currentPassword" name="currentPassword" required>
                            </div>

                            <div class="form-group">
                                <label for="newPassword">New Password</label>
                                <input type="password" id="newPassword" name="newPassword" required>
                            </div>

                            <div class="form-group">
                                <label for="confirmPassword">Confirm Password</label>
                                <input type="password" id="confirmPassword" name="confirmPassword" required>
                            </div>

                            <button type="submit" class="btn btn-primary">Update Password</button>
                        </form>
                    </div>

                    <!-- Preferences Section -->
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">Preferences</div>
                        </div>
                        <form id="preferencesForm">
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="emailNotifications" name="emailNotifications" checked>
                                    Receive email notifications for new referrals
                                </label>
                            </div>

                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="weeklyReport" name="weeklyReport" checked>
                                    Receive weekly summary reports
                                </label>
                            </div>

                            <div class="form-group">
                                <label for="theme">Theme Preference</label>
                                <select id="theme" name="theme">
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                </select>
                            </div>

                            <button type="submit" class="btn btn-primary">Save Preferences</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="account.js"></script>
</body>
</html>
