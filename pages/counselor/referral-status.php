<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Referral Status - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
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
                    <div class="page-hero-eyebrow"><i class="bi bi-diagram-3"></i> Case Management</div>
                    <h2 class="page-hero-title">Referral Status</h2>
                    <p class="page-hero-text">Track the status of all student referrals assigned to you and monitor case progress.</p>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <div id="detailView" style="display: none;">
                    <div class="card mb-5">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                            <h2 class="card-title">Referral Details</h2>
                            <button class="btn btn-secondary" onclick="backToList()">Back to List</button>
                        </div>

                        <div class="form-row">
                            <div>
                                <p><strong>Referral ID:</strong> <span id="detRefId"></span></p>
                                <p><strong>Student:</strong> <span id="detStudentName"></span></p>
                                <p><strong>Grade/Section:</strong> <span id="detStudentGradeSection"></span></p>
                                <p><strong>Reason:</strong> <span id="detReason"></span></p>
                            </div>
                            <div>
                                <p><strong>Date Submitted:</strong> <span id="detDateSubmitted"></span></p>
                                <p><strong>Urgency:</strong> <span id="detUrgency"></span></p>
                                <p><strong>Status:</strong> <span id="detStatus"></span></p>
                                <p><strong>Current Stage:</strong> <span id="detStage"></span></p>
                            </div>
                        </div>

                        <hr>

                        <!-- Stage Progress -->
                        <h3 class="text-primary">Referral Progress (6 Stages)</h3>
                        <div id="detailStagesContainer"></div>

                        <hr>

                        <!-- Follow-up Form (Stage 3) -->
                        <div id="followUpFormSection" style="display: none;">
                            <h3 class="text-primary">Follow-up Form (Stage 3)</h3>
                            <form id="followUpForm">
                                <div class="form-group">
                                    <label for="followUpObservations">Student Observations</label>
                                    <textarea id="followUpObservations" name="followUpObservations" placeholder="Document your observations of the student..."></textarea>
                                </div>

                                <div class="form-group">
                                    <label for="followUpInterventions">Interventions Applied</label>
                                    <textarea id="followUpInterventions" name="followUpInterventions" placeholder="Describe interventions or support provided..."></textarea>
                                </div>

                                <div class="form-group">
                                    <label for="followUpRecommendations">Recommendations for Next Stage</label>
                                    <textarea id="followUpRecommendations" name="followUpRecommendations" placeholder="What should happen next?"></textarea>
                                </div>

                                <button type="submit" class="btn btn-success">Save Follow-up</button>
                            </form>
                        </div>

                        <hr>

                        <!-- Case Management Actions -->
                        <h3 class="text-primary">Case Management</h3>
                        <div id="caseActionsContainer"></div>
                    </div>
                </div>

                <div id="listView">
                    <!-- Filter -->
                    <div class="card" style="margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: auto auto auto auto 1fr; gap: 15px; align-items: end;">
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Stage</label>
                                <select id="stageFilter" style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
                                    <option value="">All Stages</option>
                                    <option value="3">Follow-up Needed (3)</option>
                                    <option value="4">In Counseling (4)</option>
                                    <option value="5">In Progress (5)</option>
                                </select>
                            </div>
                            <button class="btn btn-primary" onclick="applyStageFilter()">Filter</button>
                            <button class="btn btn-secondary" onclick="clearStageFilter()">Clear</button>
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
                                    <th>Submitted</th>
                                    <th>Urgency</th>
                                    <th>Stage</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="referralsTableBody">
                                <tr>
                                    <td colspan="9" class="text-center p-5 text-muted">No referrals found</td>
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
    <script src="referral-status.js"></script>
</body>
</html>
