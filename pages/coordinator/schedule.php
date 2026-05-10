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
        <?php include '../../includes/sidebar-coordinator.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Page Hero -->
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-calendar3-week"></i> Calendar</div>
                    <h2 class="page-hero-title">Schedule Management</h2>
                    <p class="page-hero-text">Plan meetings, coordinate training sessions, and schedule case reviews for your team.</p>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Schedule Calendar -->
                <div class="schedule-calendar-card">
                    <div class="schedule-calendar-header">
                        <div class="schedule-calendar-title">
                            <div class="schedule-calendar-icon"><i class="bi bi-calendar3"></i></div>
                            <div>
                                <h2>Schedule Calendar</h2>
                                <p>Plan meetings, training, and review sessions.</p>
                            </div>
                        </div>
                        <div class="schedule-calendar-actions">
                            <!-- Add Schedule button removed per request -->
                            <button type="button" class="schedule-calendar-nav" id="schedulePrevMonth" aria-label="Previous month">
                                <i class="bi bi-chevron-left"></i>
                            </button>
                            <div class="schedule-calendar-month" id="scheduleCalendarMonth">May 2026</div>
                            <button type="button" class="schedule-calendar-nav" id="scheduleNextMonth" aria-label="Next month">
                                <i class="bi bi-chevron-right"></i>
                            </button>
                            <select id="scheduleViewSelect" class="schedule-calendar-view" disabled>
                                <option>Month View</option>
                            </select>
                            <button type="button" class="btn btn-outline-primary" id="scheduleTodayBtn">Today</button>
                        </div>
                    </div>
                    <div id="scheduleCalendar"></div>
                </div>

                <!-- Add Event Form -->
                <div class="card mb-5">
                    <h2 class="card-title mb-4">Create Schedule Event</h2>
                    
                    <form id="scheduleForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="eventTitle">Event Title *</label>
                                <input type="text" id="eventTitle" name="eventTitle" placeholder="e.g., Counseling Session" required>
                            </div>
                            <div class="form-group">
                                <label for="eventType">Event Type *</label>
                                <select id="eventType" name="eventType" required>
                                    <option value="">Select Type</option>
                                    <option value="Meeting">Meeting</option>
                                    <option value="Training">Training</option>
                                    <option value="Event">Event</option>
                                    <option value="Review">Case Review</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="eventDate">Date *</label>
                                <input type="date" id="eventDate" name="eventDate" required>
                            </div>
                            <div class="form-group">
                                <label for="eventTime">Time *</label>
                                <input type="time" id="eventTime" name="eventTime" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="eventDescription">Description</label>
                            <textarea id="eventDescription" name="eventDescription" placeholder="Event details..."></textarea>
                        </div>

                        <div class="form-group">
                            <label for="eventLocation">Location</label>
                            <input type="text" id="eventLocation" name="eventLocation" placeholder="e.g., Guidance Office">
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn btn-success">Add Event</button>
                            <button type="reset" class="btn btn-secondary">Clear</button>
                        </div>
                    </form>
                </div>

                <!-- Schedule Table -->
                <div class="table-container">
                    <h2 class="mb-4">Upcoming Events</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Event Title</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Location</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="scheduleTableBody">
                            <tr>
                                <td colspan="6" class="text-center p-5 text-muted">No scheduled events yet</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

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
            </div>

            <!-- Create Schedule Modal -->
            <div id="createScheduleModal" class="modal" style="display: none;">
                <div class="modal-content schedule-create-modal">
                    <div class="modal-header">
                        <h2>Create Schedule</h2>
                        <span class="modal-close" id="closeCreateScheduleModal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="createScheduleModalForm">
                            <div class="form-group">
                                <label for="modalEventTitle">Title</label>
                                <input type="text" id="modalEventTitle" placeholder="Enter title" required>
                            </div>
                            <div class="form-group">
                                <label for="modalEventStart">Start Date</label>
                                <input type="text" id="modalEventStart" readonly>
                            </div>
                            <div class="form-group">
                                <label for="modalEventEnd">End Date</label>
                                <input type="datetime-local" id="modalEventEnd" placeholder="yyyy/mm/dd hh:mm">
                            </div>
                            <div class="form-group">
                                <label class="modal-checkbox">
                                    <input type="checkbox" id="modalEventAllDay">
                                    <span>All Day</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label>Schedule Meeting</label>
                                <button type="button" class="btn btn-success btn-sm" style="width: 100%; justify-content: flex-start; gap: 8px;">
                                    <i class="bi bi-camera-video-fill"></i> Add video conference link
                                </button>
                            </div>
                            <div class="form-group">
                                <label for="modalEventDescription">Description</label>
                                <textarea id="modalEventDescription" rows="5"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="modalEventLabel">Label</label>
                                <select id="modalEventLabel">
                                    <option value="None">None</option>
                                    <option value="Meeting">Meeting</option>
                                    <option value="Training">Training</option>
                                    <option value="Event">Event</option>
                                    <option value="Review">Review</option>
                                    <option value="Notes">Notes</option>
                                </select>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-success">Save Event</button>
                                <button type="button" class="btn btn-secondary" id="cancelCreateScheduleModal">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Appointment Request Detail Modal -->
    <div id="requestModal" class="modal" style="display: none;">
        <div class="modal-content view-event-modal-new">
            <div class="view-modal-header">
                <h2 id="requestModalTitle">Appointment Request</h2>
                <span class="modal-close" onclick="closeRequestModal()" style="cursor: pointer;">&times;</span>
            </div>
                <div class="view-modal-body">
                <div class="event-detail-section">
                    <div class="event-detail-icon">
                        <i class="bi bi-person"></i>
                    </div>
                    <div class="event-detail-content">
                        <h3 class="event-detail-title">Student Name</h3>
                        <p id="requestStudentName" class="event-detail-text"></p>
                    </div>
                </div>
                <div class="event-detail-section">
                    <div class="event-detail-icon">
                        <i class="bi bi-pen"></i>
                    </div>
                    <div class="event-detail-content">
                        <h3 class="event-detail-title">Reason</h3>
                        <p id="requestReason" class="event-detail-text"></p>
                    </div>
                </div>
                <div class="event-detail-section">
                    <div class="event-detail-icon">
                        <i class="bi bi-clock"></i>
                    </div>
                    <div class="event-detail-content">
                        <h3 class="event-detail-title">Requested Date & Time</h3>
                        <p id="requestDateTime" class="event-detail-text"></p>
                    </div>
                </div>
                <div class="event-detail-section">
                    <div class="event-detail-icon">
                        <i class="bi bi-hourglass-split"></i>
                    </div>
                    <div class="event-detail-content">
                        <h3 class="event-detail-title">Status</h3>
                        <p id="requestStatus" class="event-detail-text"></p>
                    </div>
                </div>
                <div class="event-detail-section" id="requestNotesSection" style="display:none;">
                    <div class="event-detail-icon">
                        <i class="bi bi-journal-text"></i>
                    </div>
                    <div class="event-detail-content">
                        <h3 class="event-detail-title">Student Notes</h3>
                        <p id="requestNotes" class="event-detail-text"></p>
                    </div>
                </div>
            </div>
            <div class="view-modal-footer">
                <button type="button" class="btn btn-success" id="approveRequestBtn" onclick="approveAppointmentFromModal()">
                    <i class="bi bi-check-lg"></i> Approve
                </button>
                <button type="button" class="btn btn-warning" id="proposeChangeBtn" onclick="proposeChangesFromModal()">
                    <i class="bi bi-pencil-square"></i> Propose Changes
                </button>
                <button type="button" class="btn btn-danger" id="rejectRequestBtn" onclick="rejectRequestFromModal()">
                    <i class="bi bi-x-lg"></i> Reject
                </button>
            </div>
        </div>
    </div>
    
    <!-- View Event Modal (created dynamically by JS) -->

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="schedule.js"></script>
</body>
</html>
