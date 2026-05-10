<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Records - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="../../css/student-information.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-counselor.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Page Hero -->
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-file-person"></i> Information</div>
                    <h2 class="page-hero-title">Student Records</h2>
                    <p class="page-hero-text">View detailed student information, personal data, and guidance history.</p>
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
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
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
                            <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                                <th style="padding: 15px; font-weight: 600; text-align: left;">Student Name</th>
                                <th style="padding: 15px; font-weight: 600; text-align: left;">Email</th>
                                <th style="padding: 15px; font-weight: 600; text-align: left;">Grade</th>
                                <th style="padding: 15px; font-weight: 600; text-align: left;">Age</th>
                                <th style="padding: 15px; font-weight: 600; text-align: left;">Section</th>
                                <th style="padding: 15px; font-weight: 600; text-align: center;">Status</th>
                                <th style="padding: 15px; font-weight: 600; text-align: center;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="recordsTableBody">
                            <tr>
                                <td colspan="7" class="text-center p-5 text-muted">No student records found</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Student Detail Modal -->
    <div id="studentDetailModal" class="modal modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Student Information</h2>
                <div id="debugInfo" style="position: absolute; left: 32px; top: 58px; font-size: 12px; color: #ddd;">LOADING...</div>
                <button class="modal-close" onclick="closeStudentDetailModal()">&times;</button>
            </div>
            <div class="modal-body">
                
                <!-- Personal Information Section -->
                <div style="margin-bottom: 32px;">
                    <div class="section-header">
                        <div class="section-icon"><i class="fas fa-user"></i></div>
                        <div class="section-title">Personal Information</div>
                    </div>
                    <div class="field-grid">
                        <div class="field-group">
                            <label>First Name</label>
                            <input type="text" id="formFirstName" readonly>
                        </div>
                        <div class="field-group">
                            <label>Last Name</label>
                            <input type="text" id="formLastName" readonly>
                        </div>
                        <div class="field-group">
                            <label>Student ID</label>
                            <input type="text" id="formStudentId" readonly>
                        </div>
                        <div class="field-group">
                            <label>Email</label>
                            <input type="email" id="formEmail" readonly>
                        </div>
                        <div class="field-group">
                            <label>Date of Birth</label>
                            <input type="date" id="formDateOfBirth" readonly>
                        </div>
                        <div class="field-group">
                            <label>Gender</label>
                            <input type="text" id="formGender" readonly>
                        </div>
                    </div>
                </div>

                <!-- Academic Information Section -->
                <div style="margin-bottom: 32px;">
                    <div class="section-header">
                        <div class="section-icon"><i class="fas fa-graduation-cap"></i></div>
                        <div class="section-title">Academic Information</div>
                    </div>
                    <div class="field-grid">
                        <div class="field-group">
                            <label>School</label>
                            <input type="text" id="formSchool" readonly>
                        </div>
                        <div class="field-group">
                            <label>Grade</label>
                            <input type="text" id="formGradeLevel" readonly>
                        </div>
                        <div class="field-group span-2">
                            <label>Section</label>
                            <input type="text" id="formSection" readonly>
                        </div>
                    </div>
                </div>

                <!-- Family Information Section -->
                <div style="margin-bottom: 32px;">
                    <div class="section-header">
                        <div class="section-icon"><i class="fas fa-users"></i></div>
                        <div class="section-title">Family Information</div>
                    </div>
                    <div class="field-grid">
                        <div class="field-group">
                            <label>Father's Name</label>
                            <input type="text" id="formFatherName" readonly>
                        </div>
                        <div class="field-group">
                            <label>Mother's Name</label>
                            <input type="text" id="formMotherName" readonly>
                        </div>
                        <div class="field-group">
                            <label>Guardian Name</label>
                            <input type="text" id="formGuardianName" readonly>
                        </div>
                        <div class="field-group">
                            <label>Number of Siblings</label>
                            <input type="text" id="formSiblings" readonly>
                        </div>
                        <div class="field-group span-2">
                            <label>Family Status</label>
                            <input type="text" id="formFamilyStatus" readonly>
                        </div>
                        <div class="field-group span-2">
                            <label>Monthly Family Income</label>
                            <input type="text" id="formFamilyIncome" readonly>
                        </div>
                    </div>
                </div>

                <!-- Health & Issues Section -->
                <div style="margin-bottom: 32px;">
                    <div class="section-header">
                        <div class="section-icon"><i class="fas fa-heartbeat"></i></div>
                        <div class="section-title">Health & Issues</div>
                    </div>
                    <div class="field-grid">
                        <div class="field-group span-2">
                            <label>Health Condition</label>
                            <textarea id="formHealthCondition" readonly style="min-height: 90px; resize: none;"></textarea>
                        </div>
                        <div class="field-group span-2">
                            <label>Behavioral Issues</label>
                            <textarea id="formBehavioralIssues" readonly style="min-height: 90px; resize: none;"></textarea>
                        </div>
                        <div class="field-group span-2">
                            <label>Academic Struggles</label>
                            <textarea id="formAcademicStruggles" readonly style="min-height: 90px; resize: none;"></textarea>
                        </div>
                        <div class="field-group span-2">
                            <label>Social Issues</label>
                            <textarea id="formSocialIssues" readonly style="min-height: 90px; resize: none;"></textarea>
                        </div>
                    </div>
                </div>

                <!-- Education Section -->
                <div style="margin-bottom: 32px;">
                    <div class="section-header">
                        <div class="section-icon"><i class="fas fa-graduation-cap"></i></div>
                        <div class="section-title">Educational Background</div>
                    </div>
                    <div id="educationHistoryContainer" style="padding: 12px; background: var(--gray-50); border-radius: 6px;">
                        <p style="color: var(--text-muted); font-size: 14px; text-align: center; margin: 0;">No education records</p>
                    </div>
                </div>

                <!-- Organizations Section -->
                <div style="margin-bottom: 32px;">
                    <div class="section-header">
                        <div class="section-icon"><i class="fas fa-building"></i></div>
                        <div class="section-title">Organization Background</div>
                    </div>
                    <div id="organizationHistoryContainer" style="padding: 12px; background: var(--gray-50); border-radius: 6px;">
                        <p style="color: var(--text-muted); font-size: 14px; text-align: center; margin: 0;">No organization records</p>
                    </div>
                </div>

                <!-- Siblings Section -->
                <div style="margin-bottom: 32px;">
                    <div class="section-header">
                        <div class="section-icon"><i class="fas fa-users"></i></div>
                        <div class="section-title">Siblings</div>
                    </div>
                    <div id="siblingsHistoryContainer" style="padding: 12px; background: var(--gray-50); border-radius: 6px;">
                        <p style="color: var(--text-muted); font-size: 14px; text-align: center; margin: 0;">No sibling records</p>
                    </div>
                </div>

                <!-- Friends Section -->
                <div style="margin-bottom: 32px;">
                    <div class="section-header">
                        <div class="section-icon"><i class="fas fa-user-friends"></i></div>
                        <div class="section-title">Friends</div>
                    </div>
                    <div id="friendsHistoryContainer" style="padding: 12px; background: var(--gray-50); border-radius: 6px;">
                        <p style="color: var(--text-muted); font-size: 14px; text-align: center; margin: 0;">No friend records</p>
                    </div>
                </div>

                <!-- Referral History Section -->
                <div style="margin-bottom: 32px;">
                    <div class="section-header">
                        <div class="section-icon"><i class="fas fa-file-alt"></i></div>
                        <div class="section-title">Referral History</div>
                    </div>
                    <div id="referralHistoryContainer" style="padding: 12px; background: var(--gray-50); border-radius: 6px;">
                        <p style="color: var(--text-muted); font-size: 14px; text-align: center; margin: 0;">No referral history</p>
                    </div>
                </div>

                <!-- Counseling Notes Section -->
                <div style="margin-bottom: 0;">
                    <div class="section-header">
                        <div class="section-icon"><i class="fas fa-sticky-note"></i></div>
                        <div class="section-title">Counselor Notes</div>
                    </div>
                    <div class="field-grid">
                        <div class="field-group span-2">
                            <textarea id="counselingNotes" placeholder="Add or view counseling notes..." style="min-height: 120px; resize: none;"></textarea>
                        </div>
                    </div>
                </div>

            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeStudentDetailModal()">Close</button>
                <button class="btn btn-success" onclick="saveCounselingNotes()">Save Notes</button>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="student-record.js"></script>
</body>
</html>
