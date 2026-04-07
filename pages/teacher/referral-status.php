<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Referral Status - Guidance Management System</title>
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
                    <h1>Referral Status Tracking</h1>
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
                <div id="referralDetailContainer" style="display: none;">
                    <!-- Referral Details -->
                    <div class="card mb-5">
                        <h2 class="card-title">Referral Details</h2>
                        <div class="form-row">
                            <div>
                                <p><strong>Referral ID:</strong> <span id="refId"></span></p>
                                <p><strong>Student Name:</strong> <span id="refStudentName"></span></p>
                                <p><strong>Grade:</strong> <span id="refGrade"></span></p>
                            </div>
                            <div>
                                <p><strong>Date Submitted:</strong> <span id="refDateSubmitted"></span></p>
                                <p><strong>Urgency:</strong> <span id="refUrgency"></span></p>
                                <p><strong>Status:</strong> <span id="refStatus"></span></p>
                            </div>
                        </div>
                    </div>

                    <!-- Status Stages -->
                    <div class="card">
                        <h2 class="card-title">Referral Progress (6 Stages)</h2>
                        <div id="stagesContainer"></div>
                    </div>

                    <!-- Referral Information -->
                    <div class="card mt-5">
                        <h2 class="card-title">Referral Information</h2>
                        <div class="form-row">
                            <div>
                                <p><strong>Reason:</strong> <span id="refReason"></span></p>
                                <p><strong>Description:</strong></p>
                                <p id="refDescription" class="bg-light p-2 rounded"></p>
                            </div>
                        </div>
                    </div>

                    <div class="mt-5">
                        <a href="dashboard.php" class="btn btn-secondary">Back to Dashboard</a>
                    </div>
                </div>

                <!-- Referral Not Found or List View -->
                <div id="referralListContainer">
                    <div class="table-container">
                        <h2 class="mb-4">Your Referrals</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Referral ID</th>
                                    <th>Student Name</th>
                                    <th>Grade</th>
                                    <th>Date Submitted</th>
                                    <th>Reason</th>
                                    <th>Stage</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="referralListBody">
                                <tr>
                                    <td colspan="8" class="text-center p-5 text-muted">
                                        No referrals found. <a href="referral-form.php">Submit a new referral</a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="referral-status.js"></script>
</body>
</html>
