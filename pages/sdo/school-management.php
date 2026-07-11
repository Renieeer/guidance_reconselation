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
            <!-- Page Hero -->
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-building"></i> Administration</div>
                    <h2 class="page-hero-title">School Management</h2>
                    <p class="page-hero-text">Oversee all schools in the district, manage staff accounts, and coordinate district activities.</p>
                </div>
                <div>
                    <button type="button" id="openSchoolAssignmentModalBtn" class="btn btn-primary"><i class="bi bi-plus-lg"></i> Add School</button>
                </div>
            </div>

            <div class="page-content">
                <div id="schoolAssignmentModal" class="modal modal-lg">
                    <div class="modal-content sdo-assignment-modal">
                        <div class="modal-header">
                            <h2>School Access Setup</h2>
                            <button type="button" class="modal-close" id="closeSchoolAssignmentModal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <p class="text-muted mb-4" id="schoolAssignmentIntro">Add a school and assign a coordinator, counselor, or both.</p>

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
                                            <option value="both">Coordinator and Counselor (separate logins)</option>
                                            <option value="combined">Combined Coordinator &amp; Counselor (single login)</option>
                                        </select>
                                    </div>
                                </div>

                                <div id="assignmentRoleHint" class="assignment-role-hint">
                                    <i class="bi bi-info-circle"></i>
                                    <span>Select a role above to enter the account details.</span>
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
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="coordinatorGrade">Grade Assignment</label>
                                    <select id="coordinatorGrade" name="coordinatorGrade">
                                        <option value="">All grades (no restriction)</option>
                                        <option value="7,8,9,10">Grades 7-10</option>
                                        <option value="11,12">Grades 11 &amp; 12</option>
                                        <option value="7">Grade 7 only</option>
                                        <option value="8">Grade 8 only</option>
                                        <option value="9">Grade 9 only</option>
                                        <option value="10">Grade 10 only</option>
                                    </select>
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
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="counselorGrade">Grade Assignment</label>
                                    <select id="counselorGrade" name="counselorGrade">
                                        <option value="">All grades (no restriction)</option>
                                        <option value="7">Grade 7 only</option>
                                        <option value="8">Grade 8 only</option>
                                        <option value="9">Grade 9 only</option>
                                        <option value="10">Grade 10 only</option>
                                        <option value="11,12">Grades 11 &amp; 12</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div id="combinedFields" class="assignment-person-card" style="display: none;">
                            <h3>Combined Coordinator &amp; Counselor Details</h3>
                            <p class="text-muted" style="margin-top:-6px;">One login that acts as both coordinator and counselor for its assigned grades — e.g. a Senior High (Grade 11/12) team that manages itself within the same school.</p>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="combinedFirstName">First Name</label>
                                    <input type="text" id="combinedFirstName" name="combinedFirstName" autocomplete="off">
                                </div>
                                <div class="form-group">
                                    <label for="combinedLastName">Last Name</label>
                                    <input type="text" id="combinedLastName" name="combinedLastName" autocomplete="off">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="combinedEmail">Email</label>
                                    <input type="email" id="combinedEmail" name="combinedEmail" autocomplete="off">
                                </div>
                                <div class="form-group">
                                    <label for="combinedPassword">Password</label>
                                    <input type="password" id="combinedPassword" name="combinedPassword" minlength="8" placeholder="Minimum 8 characters" autocomplete="new-password">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="combinedGrade">Grade Assignment</label>
                                    <select id="combinedGrade" name="combinedGrade">
                                        <option value="11,12">Grades 11 &amp; 12</option>
                                        <option value="">All grades (no restriction)</option>
                                        <option value="7,8,9,10">Grades 7-10</option>
                                        <option value="7">Grade 7 only</option>
                                        <option value="8">Grade 8 only</option>
                                        <option value="9">Grade 9 only</option>
                                        <option value="10">Grade 10 only</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                                <div class="form-actions">
                                    <button type="submit" id="schoolAssignmentSubmit" class="btn btn-primary">Save School Assignment</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div id="schoolAssignAlert" class="alert"></div>

                <div class="school-folders-toolbar">
                    <div class="school-search-wrap">
                        <i class="bi bi-search"></i>
                        <input type="text" id="schoolSearchInput" placeholder="Search school or staff name...">
                    </div>
                    <div class="school-filter-group" id="schoolFilterGroup">
                        <button type="button" class="school-filter-btn active" data-filter="all">All</button>
                        <button type="button" class="school-filter-btn" data-filter="with-staff">With staff</button>
                        <button type="button" class="school-filter-btn" data-filter="no-staff">No staff</button>
                    </div>
                </div>

                <div id="schoolFolderGrid" class="school-folder-grid">
                    <p class="text-center p-5 text-muted">Loading schools...</p>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="school-management.js"></script>
</body>
</html>
