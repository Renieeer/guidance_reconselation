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
        <?php include '../../includes/sidebar-student.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Topbar -->
            <div class="topbar">
                <div class="topbar-left">
                    <h1>Referral Status</h1>
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
                <!-- Referrals Table -->
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Reason</th>
                                <th>Submitted By</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="referralsTableBody">
                            <tr>
                                <td colspan="5" style="text-align: center; padding: 30px; color: #999;">No referrals yet</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Referral Details Modal -->
                <div id="referralModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Referral Details</h2>
                            <button class="modal-close" id="closeReferralModal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label>Referral ID</label>
                                <input type="text" id="referralId" readonly>
                            </div>
                            <div class="form-group">
                                <label>Reason</label>
                                <textarea id="referralReason" readonly rows="3"></textarea>
                            </div>
                            <div class="form-group">
                                <label>Submitted By</label>
                                <input type="text" id="referralSubmittedBy" readonly>
                            </div>
                            <div class="form-group">
                                <label>Date</label>
                                <input type="text" id="referralDate" readonly>
                            </div>
                            <div class="form-group">
                                <label>Status</label>
                                <input type="text" id="referralStatus" readonly>
                            </div>
                            <div class="form-group">
                                <label>Notes</label>
                                <textarea id="referralNotes" readonly rows="4"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" id="closeReferralBtn">Close</button>
                        </div>
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
