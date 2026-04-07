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
        <?php include '../../includes/sidebar-counselor.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Topbar -->
            <div class="topbar">
                <div class="topbar-left">
                    <h1>Counseling Schedule</h1>
                </div>
                <div class="topbar-right">
                    <div class="user-info">
                        <div class="user-avatar" id="userAvatar">CM</div>
                        <div>
                            <div class="fw-bold" id="userName">Counselor</div>
                            <small class="text-muted" id="userRole">Counselor</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Student Appointment Requests -->
                <div class="table-container mb-5">
                    <h2 class="mb-4"><i class="bi bi-hourglass-split"></i> Student Appointment Requests</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Requested Date</th>
                                <th>Time</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="appointmentRequestsBody">
                            <tr>
                                <td colspan="6" class="text-center p-5 text-muted">No appointment requests yet</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Edit Appointment Modal -->
    <div id="editAppointmentModal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>Edit Appointment Request</h2>
                <span class="modal-close" onclick="closeEditModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="editAppointmentForm">
                    <div class="form-group">
                        <label>Student Name</label>
                        <input type="text" id="editStudentName" readonly style="background-color: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label for="editAppointmentDate">Date *</label>
                        <input type="date" id="editAppointmentDate" required>
                    </div>
                    <div class="form-group">
                        <label for="editAppointmentTime">Time *</label>
                        <input type="time" id="editAppointmentTime" required>
                    </div>
                    <div class="form-group">
                        <label for="editAppointmentLocation">Location/Office</label>
                        <input type="text" id="editAppointmentLocation" placeholder="e.g., Counseling Office, Room 101">
                    </div>
                    <div class="form-group">
                        <label for="editAppointmentNotes">Notes</label>
                        <textarea id="editAppointmentNotes" style="min-height: 80px;"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-success">Save Changes</button>
                        <button type="button" class="btn btn-secondary" onclick="closeEditModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- View Request Modal -->
    <div id="requestModal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Appointment Request Details</h2>
                <span class="modal-close" onclick="closeRequestModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div id="requestModalBody"></div>
            </div>
        </div>
    </div>

    <!-- Decline Appointment Modal -->
    <div id="declineAppointmentModal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>Decline Appointment Request</h2>
                <span class="modal-close" onclick="closeDeclineModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="declineAppointmentForm">
                    <div class="form-group">
                        <label>Student Name</label>
                        <input type="text" id="declineStudentName" readonly style="background-color: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label for="declineReason">Reason for Declining *</label>
                        <textarea id="declineReason" placeholder="Explain why you are declining this appointment request..." required style="min-height: 100px;"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="suggestAlternative">Suggest Alternative (Optional)</label>
                        <textarea id="suggestAlternative" placeholder="Suggest a different time or provide guidance on next steps..." style="min-height: 80px;"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-danger"><i class="bi bi-x-lg"></i> Decline Request</button>
                        <button type="button" class="btn btn-secondary" onclick="closeDeclineModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="schedule.js"></script>
</body>
</html>
