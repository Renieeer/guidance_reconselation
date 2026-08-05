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
        <?php include '../../includes/sidebar-other-school.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Page Hero -->
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-diagram-3"></i> Case Management</div>
                    <h2 class="page-hero-title">Referral Status</h2>
                    <p class="page-hero-text">Track the status of all student referrals assigned to you and monitor case progress.</p>
                </div>
                <button type="button" class="btn btn-primary" id="openReferralFormBtn">
                    <i class="bi bi-plus-circle"></i> Create Referral
                </button>
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

                        <!-- Referral Reason & Description -->
                        <h3 class="text-primary">Referral Information</h3>
                        <p><strong>Reason for Referral:</strong> <span id="detReferralReason"></span></p>
                        <p><strong>Description:</strong></p>
                        <p id="detDescription" class="bg-light p-3 rounded"></p>

                        <div class="mt-3">
                            <p><strong>Intervention Attempts:</strong></p>
                            <p id="detIntervention" class="bg-light p-3 rounded"></p>
                        </div>

                        <div class="mt-3">
                            <p><strong>Observed Behaviors:</strong></p>
                            <p id="detBehaviors" class="bg-light p-3 rounded"></p>
                        </div>

                        <hr>

                        <!-- Family Information -->
                        <h3 class="text-primary">Family/Contact Information</h3>
                        <div class="form-row">
                            <div>
                                <p><strong>Parent/Guardian:</strong> <span id="detParent"></span></p>
                                <p><strong>Contact Number:</strong> <span id="detContactNum"></span></p>
                            </div>
                            <div>
                                <p><strong>Email:</strong> <span id="detContactEmail"></span></p>
                                <p><strong>Family Background:</strong></p>
                                <p id="detFamilyBg" class="bg-light p-3 rounded"></p>
                            </div>
                        </div>

                        <hr>

                        <!-- Initial Screening (Stage 2) -->
                        <div id="screeningFormSection" style="display: none;">
                            <h3 class="text-primary">Initial Screening (Stage 2)</h3>
                            <p class="text-muted" style="margin-top:-6px;">Document the interview, observations, and risk level assessment for this student.</p>

                            <div id="screeningHistoryList" style="margin-bottom: 16px;"></div>

                            <form id="screeningForm">
                                <div class="form-group">
                                    <label for="screeningInterview">Interview Notes</label>
                                    <textarea id="screeningInterview" name="screeningInterview" placeholder="What was discussed during the interview..."></textarea>
                                </div>

                                <div class="form-group">
                                    <label for="screeningObservations">Observations</label>
                                    <textarea id="screeningObservations" name="screeningObservations" placeholder="Document your observations of the student..."></textarea>
                                </div>

                                <div class="form-group">
                                    <label for="screeningRiskLevel">Risk Level</label>
                                    <select id="screeningRiskLevel" name="screeningRiskLevel">
                                        <option value="">Select level</option>
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>

                                <button type="submit" class="btn btn-success">Save Screening Notes</button>
                            </form>
                        </div>

                        <!-- Parent Consent (Stage 3) -->
                        <div id="consentSection" style="display: none;">
                            <h3 class="text-primary">Parent Consent (Stage 3)</h3>
                            <p class="text-muted" style="margin-top:-6px;">Upload the signed parent consent form for assessment and interventions.</p>

                            <div id="consentFileList" style="margin-bottom: 16px;"></div>

                            <form id="consentUploadForm">
                                <div class="form-group">
                                    <label for="consentFile">Consent Form (PDF, JPG, or PNG — max 5 MB)</label>
                                    <input type="file" id="consentFile" name="consentFile" accept=".pdf,.jpg,.jpeg,.png" required>
                                </div>

                                <button type="submit" class="btn btn-success">Upload Consent Form</button>
                            </form>
                        </div>

                        <!-- Case Closing Acknowledgement (Stage 6) -->
                        <div id="acknowledgementFormSection" style="display: none;">
                            <h3 class="text-primary">Case Closing Acknowledgement (Stage 6)</h3>
                            <p class="text-muted" style="margin-top:-6px;">Complete this once counseling has ended — it's shown to the referring teacher as a read-only receipt.</p>

                            <form id="acknowledgementForm">
                                <div class="form-group">
                                    <label for="ackAttendedBy">Session attended by</label>
                                    <input type="text" id="ackAttendedBy" name="ackAttendedBy" placeholder="Counselor name">
                                </div>

                                <div class="form-group">
                                    <label>Status of the case at hand</label>
                                    <div id="ackChecklist" class="referral-checklist"></div>
                                </div>

                                <div class="form-group">
                                    <label for="ackFollowUpCount">Number of follow-ups made by the Counselor</label>
                                    <input type="text" id="ackFollowUpCount" name="ackFollowUpCount" placeholder="e.g. 3">
                                </div>

                                <div class="form-group">
                                    <label for="ackReferredTo">Referred to (if applicable)</label>
                                    <input type="text" id="ackReferredTo" name="ackReferredTo" placeholder="e.g. External specialist / agency name">
                                </div>

                                <button type="submit" class="btn btn-success">Save Acknowledgement</button>
                            </form>
                        </div>

                        <!-- Stages 1, 4, 5 have no dedicated documentation form yet -->
                        <div id="noStageDocSection" style="display: none;">
                            <p class="text-muted">No additional documentation is required at this stage.</p>
                        </div>

                        <hr>

                        <!-- Case Management Actions -->
                        <h3 class="text-primary">Case Management</h3>
                        <div id="caseActionsContainer"></div>
                    </div>
                </div>

                <div id="listView">
                    <!-- Create Referral (walk-in) -->
                    <div class="card mb-5" id="referralFormWrapper" style="display: none;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h2 class="card-title">Create Referral (Walk-in)</h2>
                            <button type="button" class="btn btn-ghost btn-sm" id="cancelReferralFormBtn" title="Close">
                                <i class="bi bi-x-lg"></i> Cancel
                            </button>
                        </div>
                        <p class="text-muted" style="margin-top:-6px;">For a student who comes to the guidance office directly, without a teacher-submitted referral.</p>

                        <form id="newReferralForm">
                            <div class="form-group" style="position: relative;">
                                <label for="newRefStudentName">Student Name *</label>
                                <input type="text" id="newRefStudentName" required autocomplete="off">
                                <input type="hidden" id="newRefStudentId">
                                <div id="newRefSearchStatus" style="margin-top:6px;font-size:12px;color:#666;min-height:18px;"></div>
                                <div style="position:relative;">
                                    <div id="newRefSuggestionList" style="position:absolute;left:0;right:0;z-index:50;background:#fff;border:1px solid #ddd;border-radius:4px;max-height:200px;overflow:auto;box-shadow:0 6px 16px rgba(0,0,0,0.08);"></div>
                                </div>
                            </div>

                            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:15px;">
                                <div class="form-group">
                                    <label for="newRefGrade">Grade *</label>
                                    <select id="newRefGrade" required>
                                        <option value="">Select Grade</option>
                                        <option value="Grade 7">Grade 7</option>
                                        <option value="Grade 8">Grade 8</option>
                                        <option value="Grade 9">Grade 9</option>
                                        <option value="Grade 10">Grade 10</option>
                                        <option value="Grade 11">Grade 11</option>
                                        <option value="Grade 12">Grade 12</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="newRefGender">Gender</label>
                                    <select id="newRefGender">
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="newRefAge">Age</label>
                                    <input type="number" id="newRefAge" min="1" max="30">
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="newRefSection">Section</label>
                                <input type="text" id="newRefSection" placeholder="e.g. Sampaguita">
                            </div>

                            <div class="form-group">
                                <label for="newRefReason">Reason for Referral *</label>
                                <textarea id="newRefReason" required rows="3"></textarea>
                            </div>

                            <div class="form-group">
                                <label for="newRefDescription">Description</label>
                                <textarea id="newRefDescription" rows="3"></textarea>
                            </div>

                            <div class="form-group">
                                <label for="newRefIntervention">Initial Actions Taken</label>
                                <textarea id="newRefIntervention" rows="2"></textarea>
                            </div>

                            <div class="form-group">
                                <label for="newRefBehaviors">Observed Behaviors</label>
                                <textarea id="newRefBehaviors" rows="2"></textarea>
                            </div>

                            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
                                <div class="form-group">
                                    <label for="newRefParentName">Parent/Guardian Name</label>
                                    <input type="text" id="newRefParentName">
                                </div>
                                <div class="form-group">
                                    <label for="newRefParentContact">Parent/Guardian Contact</label>
                                    <input type="tel" id="newRefParentContact">
                                </div>
                            </div>

                            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
                                <div class="form-group">
                                    <label for="newRefParentEmail">Parent/Guardian Email</label>
                                    <input type="email" id="newRefParentEmail">
                                </div>
                                <div class="form-group">
                                    <label for="newRefUrgency">Urgency</label>
                                    <select id="newRefUrgency">
                                        <option value="normal" selected>Normal</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="newRefFamilyBg">Family Background</label>
                                <textarea id="newRefFamilyBg" rows="2"></textarea>
                            </div>

                            <div class="form-actions">
                                <button type="submit" class="btn btn-success">Submit Referral</button>
                                <button type="reset" class="btn btn-secondary">Clear</button>
                            </div>
                        </form>
                    </div>

                    <!-- Filter -->
                    <div class="card" style="margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr auto auto auto auto; gap: 15px; align-items: end;">
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Search</label>
                                <input type="text" id="searchBox" placeholder="Search student name or referral ID..." style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Stage</label>
                                <select id="stageFilter" style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
                                    <option value="">All Stages</option>
                                    <option value="3">Parent Consent (3)</option>
                                    <option value="4">Assessment Proper (4)</option>
                                    <option value="5">Parent Conference (5)</option>
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
    <script src="referrals.js"></script>
</body>
</html>
