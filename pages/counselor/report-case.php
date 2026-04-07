<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Cases - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-counselor.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Topbar -->
            <div class="topbar">
                <div class="topbar-left">
                    <h1>Report Cases</h1>
                </div>
                <div class="topbar-right">
                    <div class="user-info">
                        <div class="user-avatar" id="userAvatar">CM</div>
                        <div>
                            <div style="font-weight: 600;" id="userName">Counselor</div>
                            <small style="color: #64748b;" id="userRole">Counselor</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Action Buttons -->
                <div class="card mb-5">
                    <div style="display: flex; gap: 16px; align-items: center;">
                        <button class="btn btn-primary" id="exportBtn"><i class="bi bi-download"></i> Export Report</button>
                        <button class="btn btn-secondary" id="filterBtn" style="background: #e2e8f0; color: #0f172a;"><i class="bi bi-funnel"></i> Filter</button>
                    </div>
                </div>

                <!-- Report Cases Table -->
                <div class="table-container">
                    <table id="reportCasesTable">
                        <thead>
                            <tr>
                                <th>Category of Cases</th>
                                <th colspan="3" style="text-align: center;">Grade 7</th>
                                <th colspan="3" style="text-align: center;">Grade 8</th>
                                <th colspan="3" style="text-align: center;">Grade 9</th>
                                <th colspan="3" style="text-align: center;">Grade 10</th>
                                <th colspan="3" style="text-align: center;">Grade 11</th>
                                <th colspan="3" style="text-align: center;">Grade 12</th>
                                <th colspan="3" style="text-align: center;">Totals</th>
                            </tr>
                            <tr>
                                <th></th>
                                <th>Male</th><th>Female</th><th>Total</th>
                                <th>Male</th><th>Female</th><th>Total</th>
                                <th>Male</th><th>Female</th><th>Total</th>
                                <th>Male</th><th>Female</th><th>Total</th>
                                <th>Male</th><th>Female</th><th>Total</th>
                                <th>Male</th><th>Female</th><th>Total</th>
                                <th>Male</th><th>Female</th><th>Total</th>
                            </tr>
                        </thead>
                        <tbody id="casesTableBody">
                            <!-- Data will be inserted here -->
                        </tbody>
                    </table>
                </div>

                <!-- Case Details Modal -->
                <div id="caseModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Case Details</h2>
                            <button class="modal-close" id="closeModal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label>Case ID</label>
                                <input type="text" id="caseId" readonly>
                            </div>
                            <div class="form-group">
                                <label>Category</label>
                                <input type="text" id="caseCategory" readonly>
                            </div>
                            <div class="form-group">
                                <label>Grade Level</label>
                                <input type="text" id="caseGrade" readonly>
                            </div>
                            <div class="form-group">
                                <label>Status</label>
                                <input type="text" id="caseStatus" readonly>
                            </div>
                            <div class="form-group">
                                <label>Reported Date</label>
                                <input type="text" id="caseDate" readonly>
                            </div>
                            <div class="form-group">
                                <label>Notes</label>
                                <textarea id="caseNotes" readonly rows="4"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" id="editCaseBtn">Edit Case</button>
                            <button class="btn btn-primary" id="closeCaseModal">Close</button>
                        </div>
                    </div>
                </div>

                <!-- New Case Modal -->
                <div id="newCaseModal" class="modal">
                    <div class="modal-content" style="max-width: 600px;">
                        <div class="modal-header">
                            <h2>Create New Case Report</h2>
                            <button class="modal-close" id="closeNewCaseModal">&times;</button>
                        </div>
                        <form id="caseReportForm">
                            <div class="modal-body">
                                <div class="form-group">
                                    <label for="caseTitle">Case Title *</label>
                                    <input type="text" id="caseTitle" name="caseTitle" placeholder="e.g., Student Behavioral Incident" required>
                                </div>

                                <div class="form-group">
                                    <label for="caseType">Case Type *</label>
                                    <select id="caseType" name="caseType" required>
                                        <option value="">Select Type</option>
                                        <option value="Academic">Academic Case</option>
                                        <option value="Behavioral">Behavioral Case</option>
                                        <option value="Mental_Health">Mental Health</option>
                                        <option value="Family">Family Issues</option>
                                        <option value="Abuse">Abuse/Neglect</option>
                                        <option value="Substance">Substance Abuse</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="caseDescription">Case Description *</label>
                                    <textarea id="caseDescription" name="caseDescription" placeholder="Provide details about the case..." required rows="4"></textarea>
                                </div>

                                <div class="form-group">
                                    <label for="severity">Severity Level *</label>
                                    <select id="severity" name="severity" required>
                                        <option value="">Select Level</option>
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="submit" class="btn btn-success">Submit Report</button>
                                <button type="button" class="btn btn-secondary" id="cancelNewCase">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="report-case.js"></script>
</body>
</html>
