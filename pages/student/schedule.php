<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Schedule - Guidance Management System</title>
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
                    <h1>My Schedule</h1>
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
                <!-- Calendar View -->
                <div class="card">
                    <h2 class="card-title"><i class="bi bi-calendar-event"></i> My Schedule</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <div id="calendar"></div>
                    </div>
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
                                <label>Location</label>
                                <input type="text" id="appointmentLocation" readonly>
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
    <script src="schedule.js"></script>
</body>
</html>
