<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Case - Guidance Management System (Other School)</title>
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
                    <div class="page-hero-eyebrow"><i class="bi bi-file-earmark-text"></i> Documentation</div>
                    <h2 class="page-hero-title">Report Cases</h2>
                    <p class="page-hero-text">Document and review case reports for students from other schools in the system.</p>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
              

                <!-- Guidance Report Cases -->
                <div class="content-section">
                    <div class="report-header">
                        <h2>Guidance Report Cases</h2>
                        <div class="report-actions">
                            <button class="btn btn-primary" id="exportBtn">
                                <i class="bi bi-download"></i> Export Report
                            </button>
                            <button class="btn btn-secondary" id="filterBtn">
                                <i class="bi bi-funnel"></i> Filter
                            </button>
                        </div>
                    </div>

                    <div class="table-wrapper">
                        <table class="report-table">
                            <thead>
                                <tr>
                                    <th rowspan="2" class="category-col">CATEGORY OF CASES</th>
                                    <th colspan="3" class="grade-col" data-grade="7">GRADE 7</th>
                                    <th colspan="3" class="grade-col" data-grade="8">GRADE 8</th>
                                    <th colspan="3" class="grade-col" data-grade="9">GRADE 9</th>
                                    <th colspan="3" class="grade-col" data-grade="10">GRADE 10</th>
                                    <th colspan="3" class="grade-col" data-grade="11">GRADE 11</th>
                                    <th colspan="3" class="grade-col" data-grade="12">GRADE 12</th>
                                    <th colspan="3">TOTALS</th>
                                </tr>
                                <tr>
                                    <th class="grade-col" data-grade="7">MALE</th>
                                    <th class="grade-col" data-grade="7">FEMALE</th>
                                    <th class="grade-col" data-grade="7">TOTAL</th>
                                    <th class="grade-col" data-grade="8">MALE</th>
                                    <th class="grade-col" data-grade="8">FEMALE</th>
                                    <th class="grade-col" data-grade="8">TOTAL</th>
                                    <th class="grade-col" data-grade="9">MALE</th>
                                    <th class="grade-col" data-grade="9">FEMALE</th>
                                    <th class="grade-col" data-grade="9">TOTAL</th>
                                    <th class="grade-col" data-grade="10">MALE</th>
                                    <th class="grade-col" data-grade="10">FEMALE</th>
                                    <th class="grade-col" data-grade="10">TOTAL</th>
                                    <th class="grade-col" data-grade="11">MALE</th>
                                    <th class="grade-col" data-grade="11">FEMALE</th>
                                    <th class="grade-col" data-grade="11">TOTAL</th>
                                    <th class="grade-col" data-grade="12">MALE</th>
                                    <th class="grade-col" data-grade="12">FEMALE</th>
                                    <th class="grade-col" data-grade="12">TOTAL</th>
                                    <th>MALE</th>
                                    <th>FEMALE</th>
                                    <th>TOTAL</th>
                                </tr>
                            </thead>
                            <tbody id="reportTableBody">
                                <tr>
                                    <td class="category-col">Academic Issue</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                </tr>
                                <tr>
                                    <td class="category-col">Behavioral Issue</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                </tr>
                                <tr>
                                    <td class="category-col">Emotional/Mental Health</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                </tr>
                                <tr>
                                    <td class="category-col">Social Issue</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                </tr>
                                <tr>
                                    <td class="category-col">Family Issue</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                </tr>
                                <tr>
                                    <td class="category-col">Attendance Issue</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                    <td class="data-cell">0</td><td class="data-cell">0</td><td class="data-cell total">0</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/utils.js"></script>
    <script src="../../js/auth.js"></script>
    <script src="report-case.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', initReportCase);
    </script>
</body>
</html>
