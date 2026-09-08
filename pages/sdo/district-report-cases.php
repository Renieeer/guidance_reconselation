<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>District Report Cases - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css?v=<?php echo filemtime(__DIR__ . '/../../css/style.css'); ?>">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body class="district-report-page">
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
                <div class="card mb-5 dr-card-districts">
                    <div class="card-header">
                        <div class="card-title">Select District</div>
                    </div>
                    <div class="district-nav">
                        <div class="district-buttons" id="districtButtons">
                            <p class="text-muted">Loading districts...</p>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="card mb-5 dr-card-filters">
                    <div class="report-filter-bar">
                        <div class="report-filter-group">
                            <label class="report-filter-label">Period</label>
                            <div class="period-buttons" id="periodButtons">
                                <button type="button" class="period-btn active" data-period="all">All Time</button>
                                <button type="button" class="period-btn" data-period="weekly">Weekly</button>
                                <button type="button" class="period-btn" data-period="monthly">Monthly</button>
                                <button type="button" class="period-btn" data-period="annually">Annually</button>
                                <button type="button" class="period-btn" data-period="custom">Custom</button>
                            </div>
                        </div>
                        <div class="report-filter-group custom-range-group" id="customRangeGroup" hidden>
                            <input type="date" id="rangeStart" class="form-control">
                            <span class="custom-range-sep">to</span>
                            <input type="date" id="rangeEnd" class="form-control">
                            <button type="button" class="btn btn-primary btn-sm" id="applyRangeBtn">Apply</button>
                        </div>
                        <div class="export-btn-group">
                            <button class="btn btn-danger" id="exportPdfBtn"><i class="bi bi-file-earmark-pdf"></i> Export PDF</button>
                            <button class="btn btn-success" id="exportExcelBtn"><i class="bi bi-file-earmark-excel"></i> Export Excel</button>
                        </div>
                    </div>
                </div>

                <!-- Cases by School (one row per school, with gender distribution) —
                     only shown for the "All Districts" selection; a single district
                     is already just that one district's category/grade table below. -->
                <div class="table-container mb-5" id="schoolBreakdownSection" hidden>
                    <div class="card-header">
                        <div class="card-title">Cases by School</div>
                    </div>
                    <table id="schoolBreakdownTable">
                        <thead>
                            <tr>
                                <th>School</th>
                                <th>Total Cases</th>
                                <th>Male</th>
                                <th>Female</th>
                            </tr>
                        </thead>
                        <tbody id="schoolBreakdownBody">
                            <!-- Data will be inserted here -->
                        </tbody>
                    </table>
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

                <!-- Export Options Modal — report type + period picked here,
                     then handed to the existing PDF/Excel preview flow. -->
                <div id="exportOptionsModal" class="modal">
                    <div class="modal-content" style="max-width: 520px;">
                        <div class="modal-header">
                            <h2><i class="bi bi-file-earmark-arrow-down"></i> Export Report</h2>
                            <button class="modal-close" id="closeExportOptionsModal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label for="exportReportType">Report</label>
                                <select id="exportReportType">
                                    <option value="cases_by_school">Cases by School</option>
                                    <option value="dmmr">Division Monthly Monitoring Report of Learners' Personal-Social Concerns</option>
                                </select>
                            </div>

                            <!-- Cases by School — same period keywords as the on-screen
                                 filter (weekly/monthly/annually mean "current", no
                                 specific month/year to pick; custom is an explicit range). -->
                            <div class="form-group" id="exportCasesPeriodGroup">
                                <label>Period</label>
                                <div class="period-buttons" id="exportCasesPeriodButtons">
                                    <button type="button" class="period-btn active" data-cases-period="weekly">Weekly</button>
                                    <button type="button" class="period-btn" data-cases-period="monthly">Monthly</button>
                                    <button type="button" class="period-btn" data-cases-period="annually">Annually</button>
                                    <button type="button" class="period-btn" data-cases-period="custom">Custom</button>
                                </div>
                                <div class="report-filter-group custom-range-group" id="exportCasesRangeGroup" hidden style="margin-top:12px;">
                                    <input type="date" id="exportCasesRangeStart" class="form-control">
                                    <span class="custom-range-sep">to</span>
                                    <input type="date" id="exportCasesRangeEnd" class="form-control">
                                </div>
                            </div>

                            <!-- Division Monthly Monitoring Report — needs one specific
                                 month+year, since that's what the official form is dated by. -->
                            <div class="form-row" id="exportDmmrPeriodGroup" style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label for="exportMonthSelect">Month</label>
                                    <select id="exportMonthSelect"></select>
                                </div>
                                <div class="form-group">
                                    <label for="exportYearSelect">Year</label>
                                    <select id="exportYearSelect"></select>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="cancelExportOptionsBtn">Cancel</button>
                            <button type="button" class="btn btn-primary" id="generateExportBtn"><i class="bi bi-eye"></i> Preview</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    <!-- ExcelJS — the DMMR export's real cell colors/borders/wrap-text need
         actual style-writing on .xlsx, which the SheetJS build above (CE)
         dropped years ago; ExcelJS still writes full styling. -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js"></script>
    <script src="district-report-cases.js?v=<?php echo filemtime(__DIR__ . '/district-report-cases.js'); ?>"></script>
</body>
</html>
