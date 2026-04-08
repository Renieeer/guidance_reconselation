<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Information - Step by Step</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="../../css/student-information.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>

<div class="main-wrapper">
    <!-- Sidebar -->
    <?php include '../../includes/sidebar-student.php'; ?>
    
    <!-- Main Content -->
    <div class="main-content">
        <!-- Topbar -->
        <div class="topbar">
            <div class="topbar-left">
                <h1>My Information</h1>
            </div>
            <div class="topbar-right">
                <div class="user-info">
                    <div class="user-avatar" id="userAvatar">ST</div>
                    <div>
                        <div style="font-weight: 600;" id="userName">Student</div>
                        <small style="color: #64748b;" id="userRole">Student</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Page Content -->
        <div class="page-content">
            <div class="wizard">
            
            <!-- STEP TRACK -->
            <div class="step-track">
                <div class="step-item active" data-step="1">
                    <div class="step-bubble">1</div>
                    <div class="step-label">Student</div>
                </div>
                <div class="step-item" data-step="2">
                    <div class="step-bubble">2</div>
                    <div class="step-label">Education</div>
                </div>
                <div class="step-item" data-step="3">
                    <div class="step-bubble">3</div>
                    <div class="step-label">Organizations</div>
                </div>
                <div class="step-item" data-step="4">
                    <div class="step-bubble">4</div>
                    <div class="step-label">Parents</div>
                </div>
                <div class="step-item" data-step="5">
                    <div class="step-bubble">5</div>
                    <div class="step-label">Family</div>
                </div>
                <div class="step-item" data-step="6">
                    <div class="step-bubble">6</div>
                    <div class="step-label">Siblings</div>
                </div>
            </div>

            <!-- FORM -->
            <form id="studentForm">
                <div class="form-body">

                    <!-- STEP 1: STUDENT INFORMATION -->
                    <div class="step-panel active" data-step="1">
                        <div class="section">
                            <div class="section-header">
                                <div class="section-icon"><i class="fas fa-user"></i></div>
                                <div class="section-title">Student Information</div>
                            </div>
                            <div class="field-grid">
                                <!-- Student ID (hidden - auto-filled from login) -->
                                <input type="hidden" name="StudentId">
                                
                                <div class="field-group">
                                    <label>LRN <span class="req">*</span></label>
                                    <input type="text" name="LRN" placeholder="12-digit LRN" required>
                                </div>
                                <div class="field-group">
                                    <label>First Name <span class="req">*</span></label>
                                    <input type="text" name="FirstName" placeholder="Given name" required>
                                </div>
                                <div class="field-group">
                                    <label>Middle Name</label>
                                    <input type="text" name="MiddleName" placeholder="Optional">
                                </div>
                                <div class="field-group">
                                    <label>Last Name <span class="req">*</span></label>
                                    <input type="text" name="LastName" placeholder="Family name" required>
                                </div>
                                <div class="field-group">
                                    <label>Nickname</label>
                                    <input type="text" name="NickName" placeholder="Optional">
                                </div>
                                <div class="field-group">
                                    <label>Sex <span class="req">*</span></label>
                                    <select name="Sex" required>
                                        <option value="">Select sex</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div class="field-group">
                                    <label>Age <span class="req">*</span></label>
                                    <input type="number" name="Age" placeholder="Years" required>
                                </div>
                                <div class="field-group">
                                    <label>Grade <span class="req">*</span></label>
                                    <select name="grade_id" id="gradeSelect" required>
                                        <option value="">Select grade</option>
                                        <option value="1">Grade 7</option>
                                        <option value="2">Grade 8</option>
                                        <option value="3">Grade 9</option>
                                        <option value="4">Grade 10</option>
                                    </select>
                                </div>
                                <div class="field-group">
                                    <label>Date of Birth <span class="req">*</span></label>
                                    <input type="date" name="DateOfBirth" required>
                                </div>
                                <div class="field-group">
                                    <label>Place of Birth</label>
                                    <input type="text" name="PlaceOfBirth" placeholder="City / Municipality">
                                </div>
                                <div class="field-group">
                                    <label>Religion from Birth</label>
                                    <input type="text" name="ReligionFromBirth" placeholder="e.g., Roman Catholic">
                                </div>
                                <div class="field-group">
                                    <label>Current Religion</label>
                                    <input type="text" name="CurrentReligion" placeholder="If different">
                                </div>
                                <div class="field-group span-2">
                                    <label>Current Address</label>
                                    <input type="text" name="CurrentAddress" placeholder="House/Unit No., Street, Barangay, City">
                                </div>
                                <div class="field-group span-2">
                                    <label>Permanent Address</label>
                                    <input type="text" name="PermanentAddress" placeholder="Same as current if applicable">
                                </div>
                                <div class="field-group">
                                    <label>Cellphone Number</label>
                                    <input type="text" name="CellphoneNumber" placeholder="+63 9XX XXX XXXX">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- STEP 2: EDUCATION -->
                    <div class="step-panel" data-step="2">
                        <div class="section">
                            <div class="section-header">
                                <div class="section-icon"><i class="fas fa-graduation-cap"></i></div>
                                <div class="section-title">Educational Background</div>
                            </div>
                            <div id="educationContainer"></div>
                            <button type="button" class="btn-add" onclick="addEducation()">
                                <i class="fas fa-plus"></i> Add School Record
                            </button>
                        </div>
                    </div>

                    <!-- STEP 3: ORGANIZATIONS -->
                    <div class="step-panel" data-step="3">
                        <div class="section">
                            <div class="section-header">
                                <div class="section-icon"><i class="fas fa-building"></i></div>
                                <div class="section-title">Organization Background</div>
                            </div>
                            <div id="organizationContainer"></div>
                            <button type="button" class="btn-add" onclick="addOrganization()">
                                <i class="fas fa-plus"></i> Add Organization
                            </button>
                        </div>
                    </div>

                    <!-- STEP 4: PARENTS -->
                    <div class="step-panel" data-step="4">
                        <div class="section">
                            <div class="section-header">
                                <div class="section-icon"><i class="fas fa-users"></i></div>
                                <div class="section-title">Parents Background</div>
                            </div>
                            <div class="parents-grid">
                                <div class="parent-card">
                                    <div class="parent-card-header">
                                        <i class="fas fa-person"></i> Father's Information
                                    </div>
                                    <div class="parent-card-body">
                                        <div class="field-group">
                                            <label>First Name</label>
                                            <input type="text" name="father_FirstName" placeholder="Given name">
                                        </div>
                                        <div class="field-group">
                                            <label>Middle Name</label>
                                            <input type="text" name="father_MiddleName">
                                        </div>
                                        <div class="field-group">
                                            <label>Last Name</label>
                                            <input type="text" name="father_LastName">
                                        </div>
                                        <div class="field-group">
                                            <label>Nickname</label>
                                            <input type="text" name="father_NickName">
                                        </div>
                                        <div class="field-group">
                                            <label>Birth Date</label>
                                            <input type="date" name="father_BirthDate">
                                        </div>
                                        <div class="field-group">
                                            <label>Place of Birth</label>
                                            <input type="text" name="father_PlaceOfBirth">
                                        </div>
                                        <div class="field-group">
                                            <label>Occupation</label>
                                            <input type="text" name="father_Occupation">
                                        </div>
                                        <div class="field-group">
                                            <label>Contact Number</label>
                                            <input type="text" name="father_ContactNumber">
                                        </div>
                                        <div class="field-group">
                                            <label>Address</label>
                                            <input type="text" name="father_Address">
                                        </div>
                                        <div class="field-group">
                                            <label>Highest Educational Attainment</label>
                                            <input type="text" name="father_HighestEducationalAttainment">
                                        </div>
                                        <div class="field-group">
                                            <label>Deceased?</label>
                                            <select name="father_isDeceased">
                                                <option value="No">No</option>
                                                <option value="Yes">Yes</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="parent-card">
                                    <div class="parent-card-header">
                                        <i class="fas fa-person-dress"></i> Mother's Information
                                    </div>
                                    <div class="parent-card-body">
                                        <div class="field-group">
                                            <label>First Name</label>
                                            <input type="text" name="mother_FirstName">
                                        </div>
                                        <div class="field-group">
                                            <label>Middle Name</label>
                                            <input type="text" name="mother_MiddleName">
                                        </div>
                                        <div class="field-group">
                                            <label>Last Name</label>
                                            <input type="text" name="mother_LastName">
                                        </div>
                                        <div class="field-group">
                                            <label>Nickname</label>
                                            <input type="text" name="mother_NickName">
                                        </div>
                                        <div class="field-group">
                                            <label>Birth Date</label>
                                            <input type="date" name="mother_BirthDate">
                                        </div>
                                        <div class="field-group">
                                            <label>Place of Birth</label>
                                            <input type="text" name="mother_PlaceOfBirth">
                                        </div>
                                        <div class="field-group">
                                            <label>Occupation</label>
                                            <input type="text" name="mother_Occupation">
                                        </div>
                                        <div class="field-group">
                                            <label>Contact Number</label>
                                            <input type="text" name="mother_ContactNumber">
                                        </div>
                                        <div class="field-group">
                                            <label>Address</label>
                                            <input type="text" name="mother_Address">
                                        </div>
                                        <div class="field-group">
                                            <label>Highest Educational Attainment</label>
                                            <input type="text" name="mother_HighestEducationalAttainment">
                                        </div>
                                        <div class="field-group">
                                            <label>Deceased?</label>
                                            <select name="mother_isDeceased">
                                                <option value="No">No</option>
                                                <option value="Yes">Yes</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- STEP 5: FAMILY STATUS -->
                    <div class="step-panel" data-step="5">
                        <div class="section">
                            <div class="section-header">
                                <div class="section-icon"><i class="fas fa-house-chimney"></i></div>
                                <div class="section-title">Family Status</div>
                            </div>
                            <div class="field-grid">
                                <div class="field-group">
                                    <label>Parents Living Together?</label>
                                    <select name="LivingTogether">
                                        <option value="">Select</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                                <div class="field-group">
                                    <label>Married?</label>
                                    <select name="MarriedYet">
                                        <option value="">Select</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                                <div class="field-group">
                                    <label>Married in Church?</label>
                                    <select name="MarriedChurch">
                                        <option value="">Select</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                                <div class="field-group">
                                    <label>Temporarily Separated?</label>
                                    <select name="TemporarilySepered">
                                        <option value="">Select</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                                <div class="field-group">
                                    <label>Permanently Separated?</label>
                                    <select name="PermanentlySepered">
                                        <option value="">Select</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                                <div class="field-group">
                                    <label>Father with Partner?</label>
                                    <select name="FatherWithPartner">
                                        <option value="">Select</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                                <div class="field-group">
                                    <label>Mother with Partner?</label>
                                    <select name="MotherWithPartner">
                                        <option value="">Select</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- STEP 6: SIBLINGS & OTHERS -->
                    <div class="step-panel" data-step="6">
                        <!-- Siblings -->
                        <div class="section">
                            <div class="section-header">
                                <div class="section-icon"><i class="fas fa-children"></i></div>
                                <div class="section-title">Siblings Information</div>
                            </div>
                            <div id="siblingsContainer"></div>
                            <button type="button" class="btn-add" onclick="addSibling()">
                                <i class="fas fa-plus"></i> Add Sibling
                            </button>
                        </div>

                        <!-- Guardian -->
                        <div class="section">
                            <div class="section-header">
                                <div class="section-icon"><i class="fas fa-shield-halved"></i></div>
                                <div class="section-title">Guardian Information <span style="font-size:12px;font-weight:400;color:var(--text-muted)">(if applicable)</span></div>
                            </div>
                            <div class="field-grid">
                                <div class="field-group">
                                    <label>First Name</label>
                                    <input type="text" name="guardian_FirstName">
                                </div>
                                <div class="field-group">
                                    <label>Middle Name</label>
                                    <input type="text" name="guardian_MiddleName">
                                </div>
                                <div class="field-group">
                                    <label>Last Name</label>
                                    <input type="text" name="guardian_LastName">
                                </div>
                                <div class="field-group">
                                    <label>Relationship</label>
                                    <input type="text" name="guardian_Relationship" placeholder="e.g., Aunt, Grandparent">
                                </div>
                                <div class="field-group span-2">
                                    <label>Address</label>
                                    <input type="text" name="guardian_Address">
                                </div>
                                <div class="field-group">
                                    <label>Landline</label>
                                    <input type="text" name="guardian_Landline">
                                </div>
                                <div class="field-group">
                                    <label>Mobile Number</label>
                                    <input type="text" name="guardian_MobileNumber">
                                </div>
                            </div>
                        </div>

                        <!-- Friends -->
                        <div class="section">
                            <div class="section-header">
                                <div class="section-icon"><i class="fas fa-user-group"></i></div>
                                <div class="section-title">Friends Information</div>
                            </div>
                            <div id="friendsContainer"></div>
                            <button type="button" class="btn-add" onclick="addFriend()">
                                <i class="fas fa-plus"></i> Add Friend
                            </button>
                        </div>
                    </div>

                </div><!-- /form-body -->

                <!-- NAVIGATION -->
                <div class="form-nav">
                    <button type="button" class="btn-nav btn-prev" id="prevBtn" disabled>
                        <i class="fas fa-arrow-left"></i> Previous
                    </button>
                    <div class="nav-progress">
                        <span id="stepLabel" style="margin-bottom:4px;">Step 1 of 6</span>
                        <div class="progress-bar-wrap">
                            <div class="progress-bar-fill" id="progressFill" style="width:16.66%"></div>
                        </div>
                    </div>
                    <button type="button" id="saveChangesBtn" class="btn-nav btn-save" onclick="manualSaveChanges()" style="background-color: #4caf50; color: white; margin: 0 10px; display: none;">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                    <button type="button" class="btn-nav btn-next" id="nextBtn">
                        Next <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </form>
        </div>
        </div>
    </div>
</div>

    <script src="../../js/auth.js"></script>
    <script src="student-information.js"></script>
</body>
</html>
