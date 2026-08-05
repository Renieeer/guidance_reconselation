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
                <button type="button" class="btn btn-primary" id="openFeedbackFormBtn">
                    <i class="bi bi-plus-circle"></i> Send Feedback
                </button>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Send Feedback Form -->
                <div class="card mb-5" id="feedbackFormWrapper" style="display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h2 class="card-title">Send Feedback</h2>
                        <button type="button" class="btn btn-ghost btn-sm" id="cancelFeedbackFormBtn" title="Close">
                            <i class="bi bi-x-lg"></i> Cancel
                        </button>
                    </div>
                    <form id="feedbackForm">
                        <div class="form-group">
                            <label for="feedbackSubjectType">What is this feedback about? *</label>
                            <select id="feedbackSubjectType" name="feedbackSubjectType" required>
                                <option value="">Select a category</option>
                                <option value="counseling_case">Counseling Session</option>
                                <option value="appointment">Appointment</option>
                                <option value="event">Calendar Event</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="feedbackSubjectId">Which one? *</label>
                            <select id="feedbackSubjectId" name="feedbackSubjectId" required disabled>
                                <option value="">Select a category first</option>
                            </select>
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
                    <div id="feedbackEmptyState" style="display: none; text-align: center; padding: 30px; color: #999;">
                        You don't have any counseling sessions, appointments, or calendar events yet. Once you have one, you'll be able to send feedback about it here.
                    </div>
                </div>

                <!-- Your Feedback -->
                <h2 class="mb-4">Your Feedback</h2>
                <div class="feedback-messenger" id="feedbackMessenger">
                    <!-- Conversation list -->
                    <div class="feedback-conversation-list">
                        <div id="conversationListItems">
                            <div class="feedback-conversation-list-empty">Loading…</div>
                        </div>
                    </div>

                    <!-- Active thread -->
                    <div class="feedback-conversation-panel">
                        <div class="feedback-conversation-empty" id="conversationEmpty">
                            <i class="bi bi-chat-dots"></i>
                            <div>Select a conversation to view messages</div>
                        </div>
                        <div class="feedback-conversation-active" id="conversationActive">
                            <div class="feedback-conversation-header">
                                <button type="button" class="feedback-back-to-list" id="backToList"><i class="bi bi-arrow-left"></i></button>
                                <div class="feedback-conversation-header-info">
                                    <h2 id="threadSubjectLabel"></h2>
                                    <div id="threadMeta" class="feedback-thread-meta"></div>
                                </div>
                            </div>
                            <div class="feedback-thread-body" id="threadMessages"></div>
                            <form id="threadReplyForm" class="feedback-thread-composer">
                                <textarea id="threadReplyInput" rows="1" placeholder="Write a reply..." required></textarea>
                                <button type="submit" class="btn btn-success"><i class="bi bi-send"></i></button>
                            </form>
                        </div>
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
