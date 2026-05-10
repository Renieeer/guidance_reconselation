<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>School Reports - Guidance Management System</title>
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
                    <div class="page-hero-eyebrow"><i class="bi bi-file-earmark-bar-graph"></i> Analytics</div>
                    <h2 class="page-hero-title">School Reports</h2>
                    <p class="page-hero-text">View comprehensive reports on school performance, guidance metrics, and student outcomes.</p>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Filter Tools -->
                <div class="card mb-3">
                    <div style="display: grid; grid-template-columns: 1fr 1fr auto auto; gap: 15px; align-items: end;">
                        <div>
                            <label class="d-block mb-1 fw-500">Select District</label>
                            <select id="districtSelect" class="form-control">
                                <option value="">All Districts</option>
                                <option value="district1">District 1</option>
                                <option value="district2">District 2</option>
                                <option value="district3">District 3</option>
                                <option value="district4">District 4</option>
                                <option value="district5">District 5</option>
                                <option value="district6">District 6</option>
                                <option value="district7">District 7</option>
                                <option value="district8">District 8</option>
                                <option value="district9">District 9</option>
                                <option value="district10">District 10</option>
                                <option value="district11">District 11</option>
                            </select>
                        </div>
                        <div>
                            <label class="d-block mb-1 fw-500">Report Period</label>
                            <select id="periodSelect" class="form-control">
                                <option value="current">Current Month</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="annual">Annual</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" onclick="generateReport()">Generate</button>
                        <button class="btn btn-secondary" onclick="exportReport()">Export PDF</button>
                    </div>
                </div>

                <!-- Reports Table -->
                <div class="table-container">
                    <h2 class="mb-4">Available Reports</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Report Name</th>
                                <th>District</th>
                                <th>Period</th>
                                <th>Generated Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="reportsTableBody">
                            <tr>
                                <td colspan="6" class="text-center p-5 text-muted">
                                    <p>Generate a report to view results</p>
                                    <button class="btn btn-primary mt-2" onclick="generateReport()">Generate Report</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Sample Reports for Display -->
                <div class="mt-5">
                    <h2 class="mb-4">Pre-generated District Reports (Sample)</h2>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>District</th>
                                    <th>Schools</th>
                                    <th>Students Referred</th>
                                    <th>Cases Resolved</th>
                                    <th>Success Rate</th>
                                    <th>Last Updated</th>
                                </tr>
                            </thead>
                            <tbody id="sampleReportsBody">
                                <tr>
                                    <td colspan="6" class="text-center p-5 text-muted">Loading sample reports...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="school-reports.js"></script>
</body>
</html>
