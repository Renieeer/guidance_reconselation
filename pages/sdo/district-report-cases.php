<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>District Report Cases - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-sdo.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Page Hero -->
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-file-earmark-text"></i> Documentation</div>
                    <h2 class="page-hero-title">District Report Cases</h2>
                    <p class="page-hero-text">Review all case reports from schools throughout the district and track outcomes.</p>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- District Navigation -->
                <div class="card mb-5">
                    <div class="card-header">
                        <div class="card-title">Select District</div>
                    </div>
                    <div class="district-nav">
                        <div class="district-buttons">
                            <button class="district-btn active" data-district="1">District 1</button>
                            <button class="district-btn" data-district="2">District 2</button>
                            <button class="district-btn" data-district="3">District 3</button>
                            <button class="district-btn" data-district="4">District 4</button>
                            <button class="district-btn" data-district="5">District 5</button>
                            <button class="district-btn" data-district="6">District 6</button>
                            <button class="district-btn" data-district="7">District 7</button>
                            <button class="district-btn" data-district="8">District 8</button>
                            <button class="district-btn" data-district="9">District 9</button>
                            <button class="district-btn" data-district="10">District 10</button>
                            <button class="district-btn" data-district="11">District 11</button>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
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
                                <th>Grade 7</th>
                                <th>Grade 8</th>
                                <th>Grade 9</th>
                                <th>Grade 10</th>
                                <th>Grade 11</th>
                                <th>Grade 12</th>
                                <th>Totals</th>
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
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="district-report-cases.js"></script>
</body>
</html>
