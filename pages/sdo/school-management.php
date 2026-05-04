<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>School Management - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <?php include '../../includes/sidebar-sdo.php'; ?>

        <div class="main-content">
            <div class="topbar">
                <div class="topbar-left">
                    <h1>School Management</h1>
                </div>
                <div class="topbar-right">
                    <div class="user-info">
                        <div class="user-avatar" id="userAvatar">SD</div>
                        <div>
                            <div class="fw-bold" id="userName">SDO</div>
                            <small class="text-muted" id="userRole">School District Officer</small>
                        </div>
                    </div>
                </div>
            </div>

            <div class="page-content">
                <div class="card">
                    <h2 class="mb-3">School Access Setup</h2>
                    <p class="text-muted mb-4">Add a school and assign a coordinator, counselor, or both.</p>

                    <div id="schoolAssignAlert" class="alert"></div>

                    <form id="schoolAssignmentForm" class="sdo-assignment-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="schoolName">School Name</label>
                                <input type="text" id="schoolName" name="schoolName" placeholder="e.g. San Isidro National High School" required>
                            </div>
                            <div class="form-group">
                                <label for="assignType">Assign Role</label>
                                <select id="assignType" name="assignType" required>
                                    <option value="">Select assignment</option>
                                    <option value="coordinator">Coordinator only</option>
                                    <option value="counselor">Counselor only</option>
                                    <option value="both">Coordinator and Counselor</option>
                                </select>
                            </div>
                        </div>

                        <div id="coordinatorFields" class="assignment-person-card" style="display: none;">
                            <h3>Coordinator Details</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="coordinatorFirstName">First Name</label>
                                    <input type="text" id="coordinatorFirstName" name="coordinatorFirstName" autocomplete="off">
                                </div>
                                <div class="form-group">
                                    <label for="coordinatorLastName">Last Name</label>
                                    <input type="text" id="coordinatorLastName" name="coordinatorLastName" autocomplete="off">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="coordinatorEmail">Email</label>
                                    <input type="email" id="coordinatorEmail" name="coordinatorEmail" autocomplete="off">
                                </div>
                                <div class="form-group">
                                    <label for="coordinatorPassword">Password</label>
                                    <input type="password" id="coordinatorPassword" name="coordinatorPassword" minlength="8" placeholder="Minimum 8 characters" autocomplete="new-password">
                                </div>
                            </div>
                        </div>

                        <div id="counselorFields" class="assignment-person-card" style="display: none;">
                            <h3>Counselor Details</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="counselorFirstName">First Name</label>
                                    <input type="text" id="counselorFirstName" name="counselorFirstName" autocomplete="off">
                                </div>
                                <div class="form-group">
                                    <label for="counselorLastName">Last Name</label>
                                    <input type="text" id="counselorLastName" name="counselorLastName" autocomplete="off">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="counselorEmail">Email</label>
                                    <input type="email" id="counselorEmail" name="counselorEmail" autocomplete="off">
                                </div>
                                <div class="form-group">
                                    <label for="counselorPassword">Password</label>
                                    <input type="password" id="counselorPassword" name="counselorPassword" minlength="8" placeholder="Minimum 8 characters" autocomplete="new-password">
                                </div>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="submit" id="schoolAssignmentSubmit" class="btn btn-primary">Save School Assignment</button>
                        </div>
                    </form>
                </div>

                <div class="table-container mt-5">
                    <h2 class="mb-4">School Staff Assignments</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>School</th>
                                <th>Coordinator</th>
                                <th>Counselor</th>
                                <th>Accounts</th>
                            </tr>
                        </thead>
                        <tbody id="schoolAssignmentTableBody">
                            <tr>
                                <td colspan="4" class="text-center p-5 text-muted">No school assignments yet.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="school-management.js"></script>
</body>
</html>
