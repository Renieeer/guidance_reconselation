<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment History - Guidance Management System</title>
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
                    <h1>Appointment History</h1>
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
                <!-- History Table -->
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Counselor</th>
                                <th>Session Type</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="historyTableBody">
                            <tr>
                                <td colspan="6" style="text-align: center; padding: 30px; color: #999;">No appointment history yet</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Appointment Details Modal -->
                <div id="appointmentModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Appointment Details</h2>
                            <button class="modal-close" id="closeAppointmentModal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label>Date</label>
                                <input type="text" id="appointmentDate" readonly>
                            </div>
                            <div class="form-group">
                                <label>Time</label>
                                <input type="text" id="appointmentTime" readonly>
                            </div>
                            <div class="form-group">
                                <label>Counselor</label>
                                <input type="text" id="appointmentCounselor" readonly>
                            </div>
                            <div class="form-group">
                                <label>Session Type</label>
                                <input type="text" id="appointmentType" readonly>
                            </div>
                            <div class="form-group">
                                <label>Status</label>
                                <input type="text" id="appointmentStatus" readonly>
                            </div>
                            <div class="form-group">
                                <label>Notes</label>
                                <textarea id="appointmentNotes" readonly rows="4"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" id="closeAppointmentBtn">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="appointment-history.js"></script>
</body>
</html>
