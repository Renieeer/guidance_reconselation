<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Schedule - Guidance Management System (Other School)</title>
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
                    <h1>Schedule</h1>
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
                <!-- Schedule Controls -->
                <div class="content-section">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h2>My Appointments</h2>
                        <button class="btn btn-primary" onclick="openAddAppointment()">+ Add Appointment</button>
                    </div>
                </div>

                <!-- Schedule Table -->
                <div class="content-section">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Student</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="scheduleBody">
                            <tr>
                                <td colspan="6" style="text-align: center; padding: 30px; color: #999;">No appointments scheduled</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Appointment Modal -->
    <div id="appointmentModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 8px; width: 90%; max-width: 400px;">
            <h2>Add Appointment</h2>
            <form id="appointmentForm">
                <div class="form-group">
                    <label>Student Name:</label>
                    <input type="text" id="apptStudent" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Date:</label>
                    <input type="date" id="apptDate" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Time:</label>
                    <input type="time" id="apptTime" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Type:</label>
                    <select id="apptType" class="form-control" required>
                        <option value="">Select Type</option>
                        <option value="consultation">Consultation</option>
                        <option value="counseling">Counseling</option>
                        <option value="meeting">Meeting</option>
                    </select>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;">Save</button>
                    <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="closeAddAppointment()">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <script src="../../js/utils.js"></script>
    <script src="../../js/auth.js"></script>
    <script src="schedule.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', loadSchedule);
    </script>
</body>
</html>
