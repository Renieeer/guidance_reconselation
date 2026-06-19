<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Case - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <?php include '../../includes/sidebar-counselor.php'; ?>

        <div class="main-content">
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-folder-plus"></i> Case Management</div>
                    <h2 class="page-hero-title">Case Scenario</h2>
                    <p class="page-hero-text">Open a new counseling case, attach involved students, and prepare the first follow-up plan.</p>
                </div>
                <button type="button" class="btn btn-primary" id="openCaseFormBtn">
                    <i class="bi bi-folder-plus"></i> Create case
                </button>
            </div>

            <!-- Form: hidden by default, shown when Create case is clicked -->
            <div class="case-dashboard" id="caseFormWrapper" style="display:none;">
                <form id="caseCreateForm" class="case-form card">
                    <div class="form-section">
                        <div class="section-header">
                            <div>
                                <h3>Student involvement</h3>
                                <p>Add every student who should be linked to this case.</p>
                            </div>
                            <div style="display:flex;gap:10px;align-items:center;">
                                <span class="pill" id="studentCountPill">0 students</span>
                                <button type="button" class="btn btn-ghost btn-sm" id="cancelCaseFormBtn" title="Discard and close">
                                    <i class="bi bi-x-lg"></i> Cancel
                                </button>
                            </div>
                        </div>

                        <div class="student-add-grid">
                            <div class="form-field">
                                <label for="studentName">Student name</label>
                                <input type="text" id="studentName" placeholder="e.g. Jane Doe">
                            </div>
                            <div class="form-field">
                                <label for="studentGrade">Grade / section</label>
                                <input type="text" id="studentGrade" placeholder="e.g. Grade 10 - Section Alpha">
                            </div>
                            <div class="form-field">
                                <label for="studentRole">Role in case</label>
                                <select id="studentRole">
                                    <option value="Primary student">Primary student</option>
                                    <option value="Peer involved">Peer involved</option>
                                    <option value="Witness">Witness</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <button type="button" class="btn btn-outline add-student-btn" id="addStudentBtn">
                                <i class="bi bi-plus-lg"></i> Add student
                            </button>
                        </div>

                        <div id="studentList" class="student-list"></div>
                    </div>

                    <div class="form-section">
                        <div class="section-header">
                            <div>
                                <h3>Case details</h3>
                                <p>Define the concern and the initial counseling direction.</p>
                            </div>
                            <span class="pill pill-soft">Draft-ready</span>
                        </div>

                        <div class="form-grid three-up">
                            <div class="form-field">
                                <label for="caseCategory">Case category *</label>
                                <select id="caseCategory" name="caseCategory" required>
                                    <option value="">Select category</option>
                                    <option value="Academic">Academic concern</option>
                                    <option value="Behavioral">Behavioral concern</option>
                                    <option value="Social-Emotional">Social-emotional issue</option>
                                    <option value="Attendance">Attendance / Truancy</option>
                                    <option value="Family">Family-related concern</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label for="caseType">Type of Cases</label>
                                <select id="caseType" name="caseType">
                                    <option value="Walk-in">Event</option>
                                    <option value="Referral" selected>Individual</option>
                                    <option value="Parent request">Other</option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label for="caseDate">Date logged</label>
                                <input type="date" id="caseDate" name="caseDate">
                            </div>
                        </div>

                        <div class="form-field">
                            <label for="caseSummary">Summary of concern *</label>
                            <textarea id="caseSummary" name="caseSummary" rows="4" placeholder="Describe the main issue and why this case is being opened." required></textarea>
                        </div>

                        <div class="form-grid two-up">
                            <div class="form-field">
                                <label for="caseObjective">Counseling objective</label>
                                <textarea id="caseObjective" name="caseObjective" rows="3" placeholder="What should the first counseling session accomplish?"></textarea>
                            </div>
                            <div class="form-field">
                                <label for="firstAction">Initial action plan</label>
                                <textarea id="firstAction" name="firstAction" rows="3" placeholder="Notes on the first intervention, coordination, or referral step."></textarea>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <div class="section-header">
                            <div>
                                <h3>Next steps</h3>
                                <p>Set the first follow-up and confirm the case ownership.</p>
                            </div>
                        </div>

                        <div class="form-grid two-up">
                            <div class="form-field">
                                <label for="followUpDate">First follow-up date</label>
                                <input type="date" id="followUpDate" name="followUpDate">
                            </div>
                            <div class="form-field">
                                <label for="assignedCounselor">Assigned counselor</label>
                                <input type="text" id="assignedCounselor" name="assignedCounselor" readonly>
                            </div>
                        </div>

                        <div class="checkbox-row">
                            <label>
                                <input type="checkbox" id="confidentialityAck" name="confidentialityAck">
                                Mark as confidential counseling record
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="submit" form="caseCreateForm" class="btn btn-primary"><i class="bi bi-send"></i> Submit case</button>
                        </div>
                    </div>
                </form>
            </div>

            <!-- Recent drafts: always visible -->
            <div class="card recent-cases-card">
                <div class="section-header">
                    <div>
                        <h3>Recent drafts</h3>
                        <p>Saved cases appear here. Click "View students" to see who is linked to each case.</p>
                    </div>
                </div>

                <div class="table-container">
                    <table class="recent-table">
                        <thead>
                            <tr>
                                <th>Case ID</th>
                                <th>Summary</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Students</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="recentCasesBody">
                            <tr>
                                <td colspan="7" class="empty-state">No saved drafts yet.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Counseling info modal -->
    <div class="modal" id="counselingInfoModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="bi bi-clipboard2-pulse"></i> Counseling Information</h2>
                <button type="button" class="modal-close" onclick="closeCounselingPanel()">&times;</button>
            </div>
            <div class="modal-body" id="counselingInfoBody"></div>
            <div class="form-actions" style="padding: 16px 32px 24px;">
                <button type="button" class="btn btn-secondary" onclick="closeCounselingPanel()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="saveCounselingInfo()"><i class="bi bi-check2"></i> Save</button>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="counseling.js"></script>
</body>
</html>