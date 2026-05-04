<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Records - Guidance Management System (Other School)</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-other-school.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Topbar -->
            <div class="topbar">
                <div class="topbar-left">
                    <h1>Student Records</h1>
                </div>
                <div class="topbar-right">
                    <div class="user-info">
                        <div class="user-avatar" id="userAvatar">CC</div>
                        <div>
                            <div class="fw-bold" id="userName">Staff</div>
                            <small class="text-muted" id="userRole">Coordinator & Counselor</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Search and Filter -->
                <div class="content-section">
                    <div style="display: flex; gap: 20px; align-items: flex-end;">
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Search Student</label>
                            <input type="text" id="searchStudent" class="form-control" placeholder="Name or ID">
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Grade</label>
                            <select id="gradeFilter" class="form-control">
                                <option value="">All Grades</option>
                                <option value="7">Grade 7</option>
                                <option value="8">Grade 8</option>
                                <option value="9">Grade 9</option>
                                <option value="10">Grade 10</option>
                                <option value="11">Grade 11</option>
                                <option value="12">Grade 12</option>
                            </select>
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Status</label>
                            <select id="statusFilter" class="form-control">
                                <option value="">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="No Cases">No Cases</option>
                                <option value="Has Cases">Has Cases</option>
                            </select>
                        </div>
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <button class="btn btn-primary" onclick="applyFilters()">Search</button>
                            <button class="btn btn-secondary" onclick="clearFilters()">Clear</button>
                        </div>
                    </div>
                </div>

                <!-- Student Records Table -->
                <div class="content-section">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>STUDENT NAME</th>
                                <th>EMAIL</th>
                                <th>SECTION</th>
                                <th>STATUS</th>
                            </tr>
                        </thead>
                        <tbody id="studentRecordsBody">
                            <tr>
                                <td colspan="4" style="text-align: center; padding: 30px; color: #999;">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/utils.js"></script>
    <script src="../../js/auth.js"></script>
    <script src="student-record.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', loadStudentRecords);
    </script>
</body>
</html>
