<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Records - Guidance Management System</title>
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
                    <h1>Student Records</h1>
                </div>
                <div class="topbar-right">
                    <div class="user-info">
                        <div class="user-avatar" id="userAvatar">CM</div>
                        <div>
                            <div class="fw-bold" id="userName">Counselor</div>
                            <small class="text-muted" id="userRole">Counselor</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Search & Filter -->
                <div class="card" style="margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr auto auto; gap: 15px; align-items: end;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Search Student</label>
                            <input type="text" id="searchStudent" placeholder="Name or ID" style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; width: 100%;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Grade</label>
                            <select id="gradeFilter" style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; width: 100%;">
                                <option value="">All Grades</option>
                                <option value="Grade 7">Grade 7</option>
                                <option value="Grade 8">Grade 8</option>
                                <option value="Grade 9">Grade 9</option>
                                <option value="Grade 10">Grade 10</option>
                                <option value="Grade 11">Grade 11</option>
                                <option value="Grade 12">Grade 12</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Status</label>
                            <select id="statusFilter" style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; width: 100%;">
                                <option value="">All</option>
                                <option value="Active">Active</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" onclick="searchRecords()">Search</button>
                        <button class="btn btn-secondary" onclick="clearSearch()">Clear</button>
                    </div>
                </div>

                <!-- Records Table -->
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Email</th>
                                <th>Grade</th>
                                <th>Age</th>
                                <th>Section</th>
                                <th>Referral Count</th>
                                <th>Last Referral</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="recordsTableBody">
                            <tr>
                                <td colspan="9" class="text-center p-5 text-muted">No student records found</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Student Detail Modal -->
    <div id="studentDetailModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Student Record</h2>
                <button class="modal-close" onclick="closeModal('studentDetailModal')">&times;</button>
            </div>
            <div class="modal-body">
                <h3 class="text-primary">Personal Information</h3>
                <p><strong>Name:</strong> <span id="modalStudentName"></span></p>
                <p><strong>Student ID:</strong> <span id="modalStudentId"></span></p>
                <p><strong>Grade/Section:</strong> <span id="modalStudentGrade"></span></p>
                <p><strong>Age:</strong> <span id="modalStudentAge"></span></p>
                <p><strong>Gender:</strong> <span id="modalStudentGender"></span></p>

                <hr>
                <h3 class="text-primary">Referral History</h3>
                <ul id="modalReferralList" class="list-unstyled text-sm">
                    <li>No referral history</li>
                </ul>

                <hr>
                <h3 class="text-primary">Counseling Notes</h3>
                <textarea id="counselingNotes" class="form-control" style="min-height: 100px;" placeholder="Add counseling notes..."></textarea>
            </div>
            <div class="modal-footer">
                <button class="btn btn-success" onclick="saveCounselingNotes()">Save Notes</button>
                <button class="btn btn-secondary" onclick="closeModal('studentDetailModal')">Close</button>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="student-record.js"></script>
</body>
</html>
