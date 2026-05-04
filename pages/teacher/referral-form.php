<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Submit Referral - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-teacher.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Topbar -->
            <div class="topbar">
                <div class="topbar-left">
                    <h1>Submit Student Referral Form</h1>
                </div>
                <div class="topbar-right">
                    <div class="user-info">
                        <div class="user-avatar" id="userAvatar">TJ</div>
                        <div>
                            <div class="fw-bold" id="userName">Teacher</div>
                            <small class="text-muted" id="userRole">Teacher</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <div class="referral-paper">
                    <form id="referralForm" class="referral-sheet">
                        <div class="referral-sheet-title">Counseling Referral Form</div>
                        <div class="referral-sheet-intro">
                            Please complete this form with clear, respectful details so the counselor can respond promptly and appropriately.
                        </div>

                        <div class="referral-table-row">
                            <div class="referral-label">Name of Student:</div>
                            <div class="referral-field"><input type="text" id="studentName" name="studentName" required><input type="hidden" id="studentId" name="studentId"><input type="hidden" id="studentSchool" name="studentSchool"></div>
                        </div>

                        <div class="referral-table-row referral-two-col">
                            <div class="referral-label">Grade &amp; Level:</div>
                            <div class="referral-field">
                                <select id="grade" name="grade" required>
                                    <option value="">Select Grade</option>
                                    <option value="Grade 7">Grade 7</option>
                                    <option value="Grade 8">Grade 8</option>
                                    <option value="Grade 9">Grade 9</option>
                                    <option value="Grade 10">Grade 10</option>
                                    <option value="Grade 11">Grade 11</option>
                                    <option value="Grade 12">Grade 12</option>
                                </select>
                            </div>
                            <div class="referral-label">Gender:</div>
                            <div class="referral-field">
                                <select id="gender" name="gender" required>
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div class="referral-table-row">
                            <div class="referral-label">Date of Referral:</div>
                            <div class="referral-field"><input type="date" id="referralDate" name="referralDate" required></div>
                        </div>

                        <div class="referral-table-row referral-text-row">
                            <div class="referral-label">Reason/s for Referral:</div>
                            <div class="referral-field"><textarea id="referralReason" name="referralReason" required></textarea></div>
                        </div>

                        <div class="referral-table-row referral-text-row">
                            <div class="referral-label">Initial Actions Taken:</div>
                            <div class="referral-field"><textarea id="interventionAttempts" name="interventionAttempts"></textarea></div>
                        </div>

                        <div class="referral-table-row referral-agreement-row">
                            <div class="referral-label">Did the student agree to be referred to GCO:</div>
                            <div class="referral-field">
                                <label class="referral-inline-option"><input type="radio" name="agreement" value="YES"> YES</label>
                                <label class="referral-inline-option"><input type="radio" name="agreement" value="NO"> NO</label>
                            </div>
                        </div>

                        <div class="referral-table-row">
                            <div class="referral-label">Parent/Guardian’s Name:</div>
                            <div class="referral-field"><input type="text" id="parentGuardian" name="parentGuardian"></div>
                        </div>

                        <div class="referral-table-row">
                            <div class="referral-label">Parent/Guardian’s Contact Number:</div>
                            <div class="referral-field"><input type="tel" id="parentContact" name="parentContact"></div>
                        </div>

                        <div class="referral-table-row">
                            <div class="referral-label">Referred by:</div>
                            <div class="referral-field"><input type="text" id="teacherName" name="teacherName" readonly></div>
                        </div>

                        <div class="referral-table-row">
                            <div class="referral-label">Designation:</div>
                            <div class="referral-field"><input type="text" id="teacherDesignation" name="teacherDesignation" readonly></div>
                        </div>

                        <div class="referral-table-row">
                            <div class="referral-label">Contact Number:</div>
                            <div class="referral-field"><input type="tel" id="teacherContact" name="teacherContact" readonly></div>
                        </div>

                        <div class="referral-table-row referral-text-row">
                            <div class="referral-label">Description of Concern:</div>
                            <div class="referral-field"><textarea id="description" name="description" required></textarea></div>
                        </div>

                        <div class="referral-table-row referral-text-row">
                            <div class="referral-label">Observed Behaviors/Symptoms:</div>
                            <div class="referral-field"><textarea id="observedBehaviors" name="observedBehaviors"></textarea></div>
                        </div>

                        <div class="referral-table-row referral-text-row">
                            <div class="referral-label">Additional Notes/Comments:</div>
                            <div class="referral-field"><textarea id="attachments" name="attachments"></textarea></div>
                        </div>

                        <div class="form-actions referral-actions">
                            <button type="submit" class="btn btn-success">Submit Referral</button>
                            <button type="reset" class="btn btn-secondary">Clear Form</button>
                            <a href="dashboard.php" class="btn btn-secondary">Cancel</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="referral-form.js"></script>
</body>
</html>
