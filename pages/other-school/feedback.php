<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feedback - Guidance Management System (Other School)</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-other-school.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Page Hero -->
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-chat-dots"></i> Assessment</div>
                    <h2 class="page-hero-title">Feedback</h2>
                    <p class="page-hero-text">Review and manage feedback on guidance services provided to your school's students.</p>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Submit Feedback Section -->
                <div class="content-section">
                    <h2>Submit Feedback</h2>
                    <form id="feedbackForm" class="form-group">
                        <div class="form-group">
                            <label for="feedbackType">Feedback Type:</label>
                            <select id="feedbackType" class="form-control" required>
                                <option value="">Select Type</option>
                                <option value="suggestion">Suggestion</option>
                                <option value="complaint">Complaint</option>
                                <option value="praise">Praise</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="feedbackMessage">Message:</label>
                            <textarea id="feedbackMessage" class="form-control" rows="5" required></textarea>
                        </div>

                        <button type="submit" class="btn btn-primary">Submit Feedback</button>
                    </form>
                </div>

                <!-- Received Feedback Section -->
                <div class="content-section">
                    <h2>Feedback Received</h2>
                    <div id="feedbackList"></div>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/utils.js"></script>
    <script src="../../js/auth.js"></script>
    <script src="feedback.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', loadFeedback);
    </script>
</body>
</html>
