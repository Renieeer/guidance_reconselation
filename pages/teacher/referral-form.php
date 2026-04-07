<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Submit Referral - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-teacher.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Topbar -->
            <div class="topbar">
                <div class="topbar-left">
                    <h1>Submit Student Referral Form</h1>
                </div>
                <div class="topbar-right">
                    <div class="user-info">
                        <div class="user-avatar" id="userAvatar">TJ</div>
                        <div>
                            <div class="fw-bold" id="userName">Teacher</div>
                            <small class="text-muted" id="userRole">Teacher</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <div class="card">
                    <form id="referralForm">
                        <!-- Student Information Section -->
                        <h3 class="text-primary mt-0 mb-4">Student Information</h3>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="studentName">Student Name *</label>
                                <input type="text" id="studentName" name="studentName" required>
                            </div>
                            <div class="form-group">
                                <label for="studentId">Student ID / LRN *</label>
                                <input type="text" id="studentId" name="studentId" required>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="studentSchool">School *</label>
                                <input type="text" id="studentSchool" name="studentSchool" readonly placeholder="Your school will appear here">
                                <small style="color: #999; font-size: 12px;">Students must be from your school</small>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="grade">Grade Level *</label>
                                <select id="grade" name="grade" required>
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
                                <label for="section">Section *</label>
                                <input type="text" id="section" name="section" placeholder="e.g., A, B, C" required>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="age">Age *</label>
                                <input type="number" id="age" name="age" min="1" max="30" required>
                            </div>
                            <div class="form-group">
                                <label for="gender">Gender *</label>
                                <select id="gender" name="gender" required>
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <!-- Referral Information -->
                        <h3 class="text-primary mt-5 mb-4">Referral Details</h3>

                        <div class="form-group">
                            <label for="referralReason">Reason for Referral *</label>
                            <select id="referralReason" name="referralReason" required>
                                <option value="">Select Reason</option>
                                <option value="Allergic Reaction">Allergic Reaction</option>
                                <option value="Traumatic Injury">Traumatic Injury</option>
                                <option value="Breathing difficulty">Breathing difficulty</option>
                                <option value="Fracture">Fracture</option>
                                <option value="Heade Injury">Heade Injury</option>
                                <option value="Seizure">Seizure</option>
                                <option value="Laceration / Uncontrolled Bleeding">Laceration / Uncontrolled Bleeding</option>
                                <option value="Dental Problem">Dental Problem</option>
                                <option value="Psychiatric Emergency">Psychiatric Emergency</option>
                                <option value="Change in mental Status / loos consciousness">Change in mental Status / loos consciousness</option>
                                <option value="substance Abuse">substance Abuse</option>
                                <option value="teenage Pregnancy ">teenage Pregnancy </option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="description">Detailed Description of Concern *</label>
                            <textarea id="description" name="description" placeholder="Please provide specific examples and observations..." required></textarea>
                        </div>

                        <div class="form-group">
                            <label for="interventionAttempts">Previous Interventions Attempted</label>
                            <textarea id="interventionAttempts" name="interventionAttempts" placeholder="Describe any steps you have already taken to address this concern"></textarea>
                        </div>

                        <div class="form-group">
                            <label for="observedBehaviors">Observed Behaviors/Symptoms</label>
                            <textarea id="observedBehaviors" name="observedBehaviors" placeholder="List specific behaviors or symptoms you have observed"></textarea>
                        </div>

                        <!-- Family/Home Information -->
                        <h3 class="text-primary mt-5 mb-4">Family Information</h3>

                        <div class="form-group">
                            <label for="parentGuardian">Parent/Guardian Name *</label>
                            <input type="text" id="parentGuardian" name="parentGuardian" required>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="parentContact">Contact Number *</label>
                                <input type="tel" id="parentContact" name="parentContact" required>
                            </div>
                            <div class="form-group">
                                <label for="parentEmail">Email Address</label>
                                <input type="email" id="parentEmail" name="parentEmail">
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="familyBackground">Family Background Notes</label>
                            <textarea id="familyBackground" name="familyBackground" placeholder="Any relevant family or home situation information"></textarea>
                        </div>

                        <!-- Additional Information -->
                        <h3 class="text-primary mt-5 mb-4">Additional Information</h3>

                        <div class="form-group">
                            <label for="referralDate">Date of Referral *</label>
                            <input type="date" id="referralDate" name="referralDate" required>
                        </div>

                        <div class="form-group">
                            <label for="urgency">Urgency Level *</label>
                            <select id="urgency" name="urgency" required>
                                <option value="">Select Urgency</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Crisis">Crisis/Immediate</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="attachments">Additional Notes/Comments</label>
                            <textarea id="attachments" name="attachments" placeholder="Any other relevant information"></textarea>
                        </div>

                        <!-- Form Actions -->
                        <div class="form-actions">
                            <button type="submit" class="btn btn-success">Submit Referral</button>
                            <button type="reset" class="btn btn-secondary">Clear Form</button>
                            <a href="dashboard.php" class="btn btn-secondary">Cancel</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="referral-form.js"></script>
</body>
</html>
