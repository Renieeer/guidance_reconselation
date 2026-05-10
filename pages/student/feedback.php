<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feedback - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-student.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Page Hero -->
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-chat-dots"></i> Assessment</div>
                    <h2 class="page-hero-title">Feedback</h2>
                    <p class="page-hero-text">Share your thoughts about your counseling experience and the guidance services you received.</p>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Send Feedback Form -->
                <div class="card mb-5">
                    <h2 class="card-title">Send Feedback</h2>
                    <form id="feedbackForm">
                        <div class="form-group">
                            <label for="feedbackSubject">Subject *</label>
                            <input type="text" id="feedbackSubject" name="feedbackSubject" placeholder="e.g., Feedback about counseling session" required>
                        </div>

                        <div class="form-group">
                            <label for="feedbackMessage">Message *</label>
                            <textarea id="feedbackMessage" name="feedbackMessage" placeholder="Write your feedback here..." required rows="5"></textarea>
                        </div>

                        <div class="form-group">
                            <label for="feedbackType">Type *</label>
                            <select id="feedbackType" name="feedbackType" required>
                                <option value="">Select Type</option>
                                <option value="Positive">Positive</option>
                                <option value="Suggestion">Suggestion</option>
                                <option value="Concern">Concern</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn btn-success">Send Feedback</button>
                            <button type="reset" class="btn btn-secondary">Clear</button>
                        </div>
                    </form>
                </div>

                <!-- Feedback History -->
                <div class="table-container">
                    <h2 class="mb-4">Your Feedback</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Subject</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="feedbackTableBody">
                            <tr>
                                <td colspan="5" style="text-align: center; padding: 30px; color: #999;">No feedback sent yet</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Edit Feedback Modal -->
                <div id="editFeedbackModal" class="modal">
                    <div class="modal-content" style="max-width: 600px;">
                        <div class="modal-header">
                            <h2>Edit Feedback</h2>
                            <button class="modal-close" id="closeEditModal">&times;</button>
                        </div>
                        <form id="editFeedbackForm">
                            <div class="modal-body">
                                <input type="hidden" id="editFeedbackId">
                                <div class="form-group">
                                    <label for="editSubject">Subject</label>
                                    <input type="text" id="editSubject" required>
                                </div>
                                <div class="form-group">
                                    <label for="editMessage">Message</label>
                                    <textarea id="editMessage" required rows="5"></textarea>
                                </div>
                                <div class="form-group">
                                    <label for="editType">Type</label>
                                    <select id="editType" required>
                                        <option value="Positive">Positive</option>
                                        <option value="Suggestion">Suggestion</option>
                                        <option value="Concern">Concern</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="submit" class="btn btn-success">Save Changes</button>
                                <button type="button" class="btn btn-secondary" id="cancelEdit">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="feedback.js"></script>
</body>
</html>
