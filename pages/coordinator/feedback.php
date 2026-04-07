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
        <?php include '../../includes/sidebar-coordinator.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Topbar -->
            <div class="topbar">
                <div class="topbar-left">
                    <h1>Feedback Management</h1>
                </div>
                <div class="topbar-right">
                    <div class="user-info">
                        <div class="user-avatar" id="userAvatar">CJ</div>
                        <div>
                            <div class="fw-bold" id="userName">Coordinator</div>
                            <small class="text-muted" id="userRole">Coordinator</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Submit Feedback Form -->
                <div class="card mb-5">
                    <h2 class="card-title mb-4">Provide Feedback</h2>
                    
                    <form id="feedbackForm">
                        <div class="form-group">
                            <label for="feedbackType">Feedback Type *</label>
                            <select id="feedbackType" name="feedbackType" required>
                                <option value="">Select Type</option>
                                <option value="Suggestion">Suggestion</option>
                                <option value="Issue">Issue/Bug</option>
                                <option value="Compliment">Compliment</option>
                                <option value="Improvement">Area for Improvement</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="feedbackTitle">Feedback Title *</label>
                            <input type="text" id="feedbackTitle" name="feedbackTitle" placeholder="Brief title" required>
                        </div>

                        <div class="form-group">
                            <label for="feedbackContent">Feedback Content *</label>
                            <textarea id="feedbackContent" name="feedbackContent" placeholder="Provide detailed feedback..." required></textarea>
                        </div>

                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="allowResponse" name="allowResponse" checked>
                                Allow response to this feedback
                            </label>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn btn-success">Submit Feedback</button>
                            <button type="reset" class="btn btn-secondary">Clear</button>
                        </div>
                    </form>
                </div>

                <!-- Feedback History -->
                <div class="table-container">
                    <h2 class="mb-4">Your Feedback History</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Response</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="feedbackTableBody">
                            <tr>
                                <td colspan="6" class="text-center p-5 text-muted">No feedback submitted yet</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="feedback.js"></script>
</body>
</html>
