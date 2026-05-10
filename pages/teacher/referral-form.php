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
        <?php include '../../includes/sidebar-teacher.php'; ?>
        <!-- Main Content -->
        <div class="main-content">
            <!-- Page Hero -->
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-file-earmark-text"></i> Documentation</div>
                    <h2 class="page-hero-title">Create Referral</h2>
                    <p class="page-hero-text">Submit a new student referral to the school guidance office for counselor attention.</p>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <div class="referral-container">
                    <div class="guidelines-section">
                        <h3 class="guidelines-title">Guidelines in Referring Students to GCO</h3>
                        
                        <div class="guidelines-part">
                            <h4 class="guidelines-subtitle">A. CHECK THE LEARNER'S BEHAVIORS THAT INDICATE THE NEED FOR HELP:</h4>
                            <div class="guidelines-checklist">
                                <label class="guideline-item">
                                    <input type="checkbox" name="behavior_difficult_to_get_along" value="true">
                                    <span>Frequently difficult to get along with; counseling would likely manifest the following behaviors.</span>
                                </label>
                                <label class="guideline-item">
                                    <input type="checkbox" name="behavior_talks_aloud" value="true">
                                    <span>Talks aloud and distracts other in class</span>
                                </label>
                                <label class="guideline-item">
                                    <input type="checkbox" name="behavior_absent_tardy" value="true">
                                    <span>Frequently absent or tardy</span>
                                </label>
                                <label class="guideline-item">
                                    <input type="checkbox" name="behavior_performs_poorly" value="true">
                                    <span>Performs very poorly in both academic and non-academic activities</span>
                                </label>
                                <label class="guideline-item">
                                    <input type="checkbox" name="behavior_lack_motivation" value="true">
                                    <span>Shows lack of interest and motivation in his or her studies</span>
                                </label>
                                <label class="guideline-item">
                                    <input type="checkbox" name="behavior_isolates" value="true">
                                    <span>Isolates himself or herself from the group</span>
                                </label>
                                <label class="guideline-item">
                                    <input type="checkbox" name="behavior_emotionally_upset" value="true">
                                    <span>Appears to be emotionally upset - anxious, depressed, irritable, angry, etc.</span>
                                </label>
                                <label class="guideline-item">
                                    <input type="checkbox" name="behavior_fails_submit_work" value="true">
                                    <span>Fails to submit work on time</span>
                                </label>
                                <label class="guideline-item">
                                    <input type="checkbox" name="behavior_poor_handwriting" value="true">
                                    <span>Manifests poor handwriting or illegible penmanship</span>
                                </label>
                                <label class="guideline-item">
                                    <input type="checkbox" name="behavior_dramatic_weight" value="true">
                                    <span>Shows signs of dramatic weight loss or gain, etc.</span>
                                </label>
                                <label class="guideline-item">
                                    <input type="checkbox" name="behavior_talks_suicide" value="true">
                                    <span><strong>Talks about SUICIDE</strong></span>
                                </label>
                            </div>
                        </div>

                        <div class="guidelines-part">
                            <h4 class="guidelines-subtitle">B. TALK TO THE LEARNER ABOUT THE NEED TO SEEK PROFESSIONAL HELP:</h4>
                            <div class="guidelines-checklist">
                                <label class="guideline-item">
                                    <input type="checkbox" name="talk_inform_learner" value="true">
                                    <span>Inform the learner and/or parent regarding the behaviors and that you believe counseling would likely manifest the following behaviors.</span>
                                </label>
                                <label class="guideline-item">
                                    <input type="checkbox" name="talk_suggest" value="true">
                                    <span>Suggest to the learner (and parents) that they consider services provided by the GCO for free.</span>
                                </label>
                                <label class="guideline-item">
                                    <input type="checkbox" name="talk_listen" value="true">
                                    <span>Listen to the person's situation.</span>
                                </label>
                                <label class="guideline-item">
                                    <input type="checkbox" name="talk_prepare_learner" value="true">
                                    <span>Prepare a learner has the right to refuse a referral without incurring consequences.</span>
                                </label>
                                <label class="guideline-item">
                                    <input type="checkbox" name="talk_responsibility" value="true">
                                    <span>However, if the behavior endangers his or her well-being, it is your responsibility to provide such help to do the learner without necessarily getting his or her consent.</span>
                                </label>
                                <label class="guideline-item">
                                    <input type="checkbox" name="talk_inform_parents" value="true">
                                    <span>You should inform the parents in a calm, objective, confidential manner.</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <form id="referralForm" class="referral-form">
                    <div class="form-title">COUNSELING REFERRAL FORM</div>

                    <div class="form-row-three">
                        <div class="form-field">
                            <label>Name of Student:</label>
                            <input type="text" id="studentName" name="studentName" required>
                            <input type="hidden" id="studentId" name="studentId">
                            <input type="hidden" id="studentSchool" name="studentSchool">
                        </div>

                        <div class="form-field">
                            <label>Grade & Level:</label>
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

                        <div class="form-field">
                            <label>Gender:</label>
                            <select id="gender" name="gender" required>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <!-- Date of Referral (Auto-populated from database) -->
                    <input type="hidden" id="referralDate" name="referralDate">

                    <div class="form-field">
                        <label>Reason/s for Referral:</label>
                        <textarea id="referralReason" name="referralReason" required></textarea>
                    </div>

                    <div class="form-field">
                        <label>Initial Actions Taken:</label>
                        <textarea id="interventionAttempts" name="interventionAttempts"></textarea>
                    </div>

                    <div class="form-field">
                        <label>Did the student agree to be referred to GCO:</label>
                        <div class="form-radio-inline">
                            <label class="radio-inline"><input type="radio" name="agreement" value="YES" required> YES</label>
                            <label class="radio-inline"><input type="radio" name="agreement" value="NO"> NO</label>
                        </div>
                    </div>

                    <div class="form-row-two">
                        <div class="form-field">
                            <label>Parent/Guardian's Name:</label>
                            <input type="text" id="parentGuardian" name="parentGuardian">
                        </div>

                        <div class="form-field">
                            <label>Parent/Guardian's Contact Number:</label>
                            <input type="tel" id="parentContact" name="parentContact">
                        </div>
                    </div>

                    <div class="form-row-three">
                        <div class="form-field">
                            <label>Referred by:</label>
                            <input type="text" id="teacherName" name="teacherName" readonly>
                        </div>

                        <div class="form-field">
                            <label>Designation:</label>
                            <input type="text" id="teacherDesignation" name="teacherDesignation" readonly>
                        </div>

                        <div class="form-field">
                            <label>Contact Number:</label>
                            <input type="tel" id="teacherContact" name="teacherContact" readonly>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-success">Submit Referral</button>
                        <button type="reset" class="btn btn-secondary">Clear Form</button>
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
