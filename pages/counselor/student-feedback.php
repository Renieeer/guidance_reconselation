<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Feedback - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-counselor.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Page Hero -->
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-chat-square-text"></i> Communication</div>
                    <h2 class="page-hero-title">Student Feedback</h2>
                    <p class="page-hero-text">Review feedback students sent about their counseling sessions, appointments, and events, and reply directly.</p>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <div class="feedback-messenger" id="feedbackMessenger">
                    <!-- Conversation list -->
                    <div class="feedback-conversation-list">
                        <div class="feedback-conversation-list-filter">
                            <select id="statusFilter">
                                <option value="">All conversations</option>
                                <option value="new">Needs Reply</option>
                                <option value="replied">Replied</option>
                            </select>
                        </div>
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
    <script src="student-feedback.js"></script>
</body>
</html>
