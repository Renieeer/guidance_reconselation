<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Request Appointment - Guidance Management System</title>
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
                    <h1>Request Counseling Appointment</h1>
                </div>
                <div class="topbar-right">
                    <div class="user-info">
                        <div class="user-avatar" id="userAvatar">ST</div>
                        <div>
                            <div class="fw-bold" id="userName">Student</div>
                            <small class="text-muted" id="userRole">Student</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Request Form -->
                <div class="card mb-5">
                    <h2 class="card-title mb-4"><i class="bi bi-calendar-plus"></i> New Appointment Request</h2>
                    
                    <form id="appointmentRequestForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="preferredDate">Preferred Date *</label>
                                <input type="date" id="preferredDate" required>
                            </div>
                            <div class="form-group">
                                <label for="preferredTime">Preferred Time *</label>
                                <input type="time" id="preferredTime" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="reason">Reason for Appointment *</label>
                            <select id="reason" required>
                                <option value="">Select reason</option>
                                <option value="academic">Academic Concerns</option>
                                <option value="behavioral">Behavioral Issues</option>
                                <option value="emotional">Emotional Support</option>
                                <option value="mental-health">Mental Health</option>
                                <option value="personal">Personal Problems</option>
                                <option value="career">Career Guidance</option>
                                <option value="family">Family Issues</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="description">Additional Details</label>
                            <textarea id="description" placeholder="Tell the counselor more about what you'd like to discuss..." style="min-height: 100px;"></textarea>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn btn-success"><i class="bi bi-check-lg"></i> Submit Request</button>
                            <button type="reset" class="btn btn-secondary">Clear</button>
                        </div>
                    </form>
                </div>

                <!-- All Appointments -->
                <div class="table-container">
                    <h2 class="mb-4"><i class="bi bi-calendar-check"></i> My Appointments</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Reason</th>
                                <th>Counselor</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="appointmentsTableBody">
                            <tr>
                                <td colspan="6" class="text-center p-5 text-muted">No appointments yet</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- View/Edit Request Modal -->
    <div id="requestModal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2 id="modalTitle">Appointment Request Details</h2>
                <span class="modal-close" onclick="closeRequestModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div id="requestModalBody"></div>
            </div>
        </div>
    </div>

    <!-- Edit During Discussion Modal -->
    <div id="editDuringDiscussionModal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>Reschedule Appointment</h2>
                <span class="modal-close" onclick="closeEditDuringModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="editDuringDiscussionForm">
                    <div class="form-group">
                        <label for="editDiscussionDate">New Date *</label>
                        <input type="date" id="editDiscussionDate" required>
                    </div>
                    <div class="form-group">
                        <label for="editDiscussionTime">New Time *</label>
                        <input type="time" id="editDiscussionTime" required>
                    </div>
                    <div class="form-group">
                        <label for="editDiscussionNotes">Comments</label>
                        <textarea id="editDiscussionNotes" placeholder="Let the counselor know why you need to reschedule..." style="min-height: 80px;"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-warning"><i class="bi bi-arrow-repeat"></i> Propose Change</button>
                        <button type="button" class="btn btn-secondary" onclick="closeEditDuringModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="appointment-request.js"></script>
</body>
</html>
