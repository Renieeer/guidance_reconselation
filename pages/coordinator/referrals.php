<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Referrals Management - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-coordinator.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Topbar -->
            <div class="topbar">
                <div class="topbar-left">
                    <h1>Referrals Management</h1>
                </div>
                <div class="topbar-right">
                    <div class="user-info">
                        <div class="user-avatar" id="userAvatar">CJ</div>
                        <div>
                            <div class="fw-bold" id="userName">Coordinator</div>
                            <small class="text-muted" id="userRole">Coordinator</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <div id="referralDetailView" style="display: none;">
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h2 class="card-title">Referral Details</h2>
                            <button class="btn btn-secondary btn-sm" onclick="backToList()">Back to List</button>
                        </div>

                        <div class="form-row">
                            <div>
                                <p><strong>Referral ID:</strong> <span id="detailRefId"></span></p>
                                <p><strong>Student Name:</strong> <span id="detailStudentName"></span></p>
                                <p><strong>Student ID:</strong> <span id="detailStudentId"></span></p>
                                <p><strong>Grade:</strong> <span id="detailGrade"></span></p>
                                <p><strong>Age:</strong> <span id="detailAge"></span></p>
                                <p><strong>Gender:</strong> <span id="detailGender"></span></p>
                            </div>
                            <div>
                                <p><strong>Submitted By:</strong> <span id="detailSubmittedBy"></span></p>
                                <p><strong>Date Submitted:</strong> <span id="detailDateSubmitted"></span></p>
                                <p><strong>Urgency:</strong> <span id="detailUrgency"></span></p>
                                <p><strong>Status:</strong> <span id="detailStatus"></span></p>
                                <p><strong>Current Stage:</strong> <span id="detailStage"></span></p>
                            </div>
                        </div>

                        <hr style="margin: 20px 0;">

                        <!-- Stage Progress -->
                        <h3 class="text-primary">Referral Progress</h3>
                        <div id="stageProgressContainer"></div>

                        <hr style="margin: 20px 0;">

                        <!-- Referral Reason & Description -->
                        <h3 class="text-primary">Referral Information</h3>
                        <p><strong>Reason for Referral:</strong> <span id="detailReason"></span></p>
                        <p><strong>Description:</strong></p>
                        <p id="detailDescription" class="bg-light p-3 rounded border-left border-secondary"></p>

                        <div class="mt-3">
                            <p><strong>Intervention Attempts:</strong></p>
                            <p id="detailIntervention" class="bg-light p-3 rounded"></p>
                        </div>

                        <div class="mt-3">
                            <p><strong>Observed Behaviors:</strong></p>
                            <p id="detailBehaviors" class="bg-light p-3 rounded"></p>
                        </div>

                        <hr style="margin: 20px 0;">

                        <!-- Family Information -->
                        <h3 class="text-primary">Family/Contact Information</h3>
                        <div class="form-row">
                            <div>
                                <p><strong>Parent/Guardian:</strong> <span id="detailParent"></span></p>
                                <p><strong>Contact Number:</strong> <span id="detailContactNum"></span></p>
                            </div>
                            <div>
                                <p><strong>Email:</strong> <span id="detailContactEmail"></span></p>
                                <p><strong>Family Background:</strong></p>
                                <p id="detailFamilyBg" class="bg-light p-3 rounded"></p>
                            </div>
                        </div>

                        <hr style="margin: 20px 0;">

                        <!-- Coordinator Actions -->
                        <h3 class="text-primary">Coordinator Actions</h3>
                        <div id="coordinatorActionsContainer"></div>
                    </div>
                </div>

                <div id="referralListView">
                    <!-- Filters -->
                    <div class="card" style="margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: auto auto auto auto 1fr; gap: 15px; align-items: end;">
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Status</label>
                                <select id="statusFilter" style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
                                    <option value="">All</option>
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Urgency</label>
                                <select id="urgencyFilter" style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
                                    <option value="">All</option>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Crisis">Crisis</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Stage</label>
                                <select id="stageFilter" style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
                                    <option value="">All</option>
                                    <option value="1">Stage 1</option>
                                    <option value="2">Stage 2</option>
                                    <option value="3">Stage 3</option>
                                    <option value="4">Stage 4</option>
                                    <option value="5">Stage 5</option>
                                    <option value="6">Stage 6</option>
                                </select>
                            </div>
                            <button class="btn btn-primary" onclick="applyFilters()">Filter</button>
                            <button class="btn btn-secondary" onclick="clearFilters()">Clear</button>
                        </div>
                    </div>

                    <!-- Referrals Table -->
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Referral ID</th>
                                    <th>Student Name</th>
                                    <th>Grade</th>
                                    <th>Reason</th>
                                    <th>Submitted By</th>
                                    <th>Date</th>
                                    <th>Urgency</th>
                                    <th>Stage</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="referralsTableBody">
                                <tr>
                                    <td colspan="10" class="text-center p-5 text-muted">No referrals found</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Update Stage Modal -->
    <div id="updateStageModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Update Referral Stage</h2>
                <button class="modal-close" onclick="closeModal('updateStageModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="newStage">Select New Stage</label>
                    <select id="newStage">
                        <option value="1">Stage 1: Submitted</option>
                        <option value="2">Stage 2: Under Review</option>
                        <option value="3">Stage 3: Follow-up Required</option>
                        <option value="4">Stage 4: In Counseling</option>
                        <option value="5">Stage 5: In Progress</option>
                        <option value="6">Stage 6: Closed</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="stageNotes">Notes</label>
                    <textarea id="stageNotes" placeholder="Add notes about this stage update..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="saveStageUpdate()">Update Stage</button>
                <button class="btn btn-secondary" onclick="closeModal('updateStageModal')">Cancel</button>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="referrals.js"></script>
</body>
</html>
