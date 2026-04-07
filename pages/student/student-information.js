// ============================================================
//  student-information.js  —  works with the redesigned HTML
// ============================================================

function getApiUrl() {
    return '/guidancemanagment/api';
}

let currentStep   = 1;
const totalSteps  = 6;
let completedSteps = new Set();
let savedFormData  = {};
let isUpdateMode   = false;   // true once existing data is loaded
let autoSaveTimer  = null;    // Timer for debounced database save

// ─── counters for dynamic sections ───────────────────────────
let eduCount     = 0;
let orgCount     = 0;
let sibCount     = 0;
let friendCount  = 0;

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('DOMContentLoaded event fired');
        
        // Add a longer delay to ensure all DOM elements are truly ready
        setTimeout(() => {
            try {
                console.log('Starting setup...');
                setupUserInfo();
                console.log('setupUserInfo complete');
                
                setupStepClickListeners();
                console.log('setupStepClickListeners complete');
                
                initDynamicSections();
                console.log('initDynamicSections complete');
                
                loadStudentData();
                console.log('loadStudentData complete');
                
                updateStepIndicator();
                console.log('updateStepIndicator complete');
                
                updateNavigationButtons();
                console.log('updateNavigationButtons complete');

                setupFamilyStatusDependencies();
                console.log('setupFamilyStatusDependencies complete');

                setupFieldChangeLiseners();
                console.log('setupFieldChangeLiseners complete');
                
                console.log('All initialization complete');
            } catch (error) {
                console.error('Error during initialization:', error);
            }
        }, 200);
    } catch (error) {
        console.error('Error in DOMContentLoaded handler:', error);
    }
});

// ─── SETUP FIELD CHANGE LISTENERS FOR AUTO DATABASE SAVE ───────
function setupFieldChangeLiseners() {
    const form = document.getElementById('studentForm');
    if (!form) return;

    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('change', triggerDatabaseSave);
        input.addEventListener('input', triggerDatabaseSave);
    });

    console.log('Field change listeners attached to', inputs.length, 'form elements');
}

// ─── TRIGGER DATABASE SAVE (with confirmation) ────────────────
function triggerDatabaseSave() {
    // Get StudentId
    const studentIdField = document.querySelector('input[name="StudentId"]');
    if (!studentIdField || !studentIdField.value.trim()) {
        console.log('Cannot save: StudentId is empty');
        return;
    }

    // Clear existing timer
    if (autoSaveTimer) clearTimeout(autoSaveTimer);

    // Set new timer to show confirmation dialog after user stops typing (1 second)
    autoSaveTimer = setTimeout(() => {
        showConfirmationDialog(
            'Save Changes',
            'Do you want to save these changes to the database?',
            () => saveToDatabaseQuick(studentIdField.value.trim())
        );
    }, 1000);
}

// ─── QUICK SAVE TO DATABASE (partial) ──────────────────────────
function saveToDatabaseQuick(studentId) {
    try {
        const form = document.getElementById('studentForm');
        if (!form) return;

        const fd = new FormData(form);
        
        // Collect basic data
        const studentData = {
            StudentId: studentId,
            LRN: fd.get('LRN') || '',
            FirstName: fd.get('FirstName') || '',
            LastName: fd.get('LastName') || '',
            MiddleName: fd.get('MiddleName') || '',
            NickName: fd.get('NickName') || '',
            Sex: fd.get('Sex') || '',
            Age: fd.get('Age') || '',
            DateOfBirth: fd.get('DateOfBirth') || '',
            PlaceOfBirth: fd.get('PlaceOfBirth') || '',
            ReligionFromBirth: fd.get('ReligionFromBirth') || '',
            CurrentReligion: fd.get('CurrentReligion') || '',
            CurrentAddress: fd.get('CurrentAddress') || '',
            PermanentAddress: fd.get('PermanentAddress') || '',
            CellphoneNumber: fd.get('CellphoneNumber') || '',
            
            // Parents
            father_FirstName: fd.get('father_FirstName') || '',
            father_MiddleName: fd.get('father_MiddleName') || '',
            father_LastName: fd.get('father_LastName') || '',
            father_NickName: fd.get('father_NickName') || '',
            father_BirthDate: fd.get('father_BirthDate') || '',
            father_PlaceOfBirth: fd.get('father_PlaceOfBirth') || '',
            father_Occupation: fd.get('father_Occupation') || '',
            father_ContactNumber: fd.get('father_ContactNumber') || '',
            father_Address: fd.get('father_Address') || '',
            father_HighestEducationalAttainment: fd.get('father_HighestEducationalAttainment') || '',
            father_isDeceased: fd.get('father_isDeceased') || '',
            
            mother_FirstName: fd.get('mother_FirstName') || '',
            mother_MiddleName: fd.get('mother_MiddleName') || '',
            mother_LastName: fd.get('mother_LastName') || '',
            mother_NickName: fd.get('mother_NickName') || '',
            mother_BirthDate: fd.get('mother_BirthDate') || '',
            mother_PlaceOfBirth: fd.get('mother_PlaceOfBirth') || '',
            mother_Occupation: fd.get('mother_Occupation') || '',
            mother_ContactNumber: fd.get('mother_ContactNumber') || '',
            mother_Address: fd.get('mother_Address') || '',
            mother_HighestEducationalAttainment: fd.get('mother_HighestEducationalAttainment') || '',
            mother_isDeceased: fd.get('mother_isDeceased') || '',
            
            // Family status
            LivingTogether: fd.get('LivingTogether') || '',
            MarriedYet: fd.get('MarriedYet') || '',
            MarriedChurch: fd.get('MarriedChurch') || '',
            TemporarilySepered: fd.get('TemporarilySepered') || '',
            PermanentlySepered: fd.get('PermanentlySepered') || '',
            FatherWithPartner: fd.get('FatherWithPartner') || '',
            MotherWithPartner: fd.get('MotherWithPartner') || '',
            
            // Guardian
            guardian_FirstName: fd.get('guardian_FirstName') || '',
            guardian_MiddleName: fd.get('guardian_MiddleName') || '',
            guardian_LastName: fd.get('guardian_LastName') || '',
            guardian_Relationship: fd.get('guardian_Relationship') || '',
            guardian_Address: fd.get('guardian_Address') || '',
            guardian_Landline: fd.get('guardian_Landline') || '',
            guardian_MobileNumber: fd.get('guardian_MobileNumber') || ''
        };

        // Send to database
        fetch(`${getApiUrl()}/save-student.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                showNotification('✓ Changes saved successfully!', 'success');
            } else {
                showNotification(data.message || 'Failed to save changes', 'error');
            }
        })
        .catch(err => {
            console.error('Error saving to database:', err);
            showNotification('Error saving changes', 'error');
        });
    } catch (error) {
        console.error('Error in saveToDatabaseQuick:', error);
    }
}

// ─── Seed one entry in each dynamic container ─────────────────
function initDynamicSections() {
    try {
        if (typeof addEducation === 'function') addEducation();
        if (typeof addOrganization === 'function') addOrganization();
        if (typeof addSibling === 'function') addSibling();
        if (typeof addFriend === 'function') addFriend();
    } catch (error) {
        console.error('Error in initDynamicSections:', error);
    }
}

// ─── USER INFO (topbar) ────────────────────────────────────────
function setupUserInfo() {
    let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.name) {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        currentUser = { ...currentUser, ...user };
    }

    // Pre-fill hidden StudentId field with logged-in user's ID (for data linking)
    const studentIdField = document.querySelector('input[name="StudentId"]');
    if (studentIdField && currentUser.id) {
        studentIdField.value = currentUser.id;
        console.log('StudentId set to:', currentUser.id);
    }

    // Wire StudentId change event to load data (if visible)
    if (studentIdField) {
        studentIdField.addEventListener('change', loadStudentDataByInputId);
    }

    // Update topbar info
    setTimeout(() => {
        const userName    = currentUser.name || sessionStorage.getItem('userName');
        const userRole    = currentUser.role || 'User';
        const userNameEl  = document.getElementById('userName');
        const userRoleEl  = document.getElementById('userRole');
        const userAvatar  = document.getElementById('userAvatar');

        if (userName && userNameEl) {
            userNameEl.textContent = userName;
            if (userRoleEl) {
                userRoleEl.textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1).replace('-', ' ');
            }
            if (userAvatar) {
                userAvatar.textContent = userName.split(' ')
                    .map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
            }
        }
    }, 100);
}

// ─── LOAD DATA (on page load) ──────────────────────────────────
function loadStudentData() {
    let studentId = null;

    // Try to get StudentId from localStorage (currentUser)
    try {
        const cu = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (cu.id) studentId = cu.id;
    } catch (e) {
        console.error('Error parsing currentUser:', e);
    }

    // Try sessionStorage if not found
    if (!studentId) {
        try {
            const u = JSON.parse(sessionStorage.getItem('user') || '{}');
            if (u.id) studentId = u.id;
        } catch (e) {
            console.error('Error parsing user:', e);
        }
    }

    // Try direct session key
    if (!studentId) {
        studentId = sessionStorage.getItem('studentId');
    }

    if (!studentId) {
        console.log('No student ID found, form is ready for manual entry');
        return;
    }

    console.log('Loading student data for StudentId:', studentId);

    setTimeout(() => {
        fetch(`${getApiUrl()}/save-student.php?StudentId=${encodeURIComponent(studentId)}`)
            .then(r => r.json())
            .then(data => {
                if (data.success && data.data) {
                    console.log('Student data loaded successfully');
                    // Pre-fill StudentId in the form
                    const studentIdField = document.querySelector('input[name="StudentId"]');
                    if (studentIdField) {
                        studentIdField.value = studentId;
                    }
                    
                    populateFormWithData(data.data);
                    markStepsAsComplete();
                    enterUpdateMode();
                    showNotification('✓ Your previous information has been loaded.', 'success');
                } else {
                    console.log('No data found for StudentId:', studentId);
                }
            })
            .catch(err => {
                console.error('Error loading student data:', err);
                // Still pre-fill the StudentId even if fetch fails
                const studentIdField = document.querySelector('input[name="StudentId"]');
                if (studentIdField && !studentIdField.value) {
                    studentIdField.value = studentId;
                }
            });
    }, 200);
}

// ─── LOAD DATA (manual StudentId change) ──────────────────────
function loadStudentDataByInputId() {
    const field = document.querySelector('input[name="StudentId"]');
    if (!field || !field.value.trim()) return;

    fetch(`${getApiUrl()}/save-student.php?StudentId=${encodeURIComponent(field.value.trim())}`)
        .then(r => r.json())
        .then(data => {
            if (data.success && data.data) {
                populateFormWithData(data.data);
                markStepsAsComplete();
                enterUpdateMode();
                showNotification('✓ Student information loaded successfully!', 'success');
            }
        })
        .catch(err => console.error('Error loading student data:', err));
}

// ─── POPULATE FORM ─────────────────────────────────────────────
function populateFormWithData(d) {
    // ── Step 1: basic fields ──
    const basicMap = {
        StudentId: 'input[name="StudentId"]',
        LRN:       'input[name="LRN"]',
        FirstName: 'input[name="FirstName"]',
        MiddleName:'input[name="MiddleName"]',
        LastName:  'input[name="LastName"]',
        NickName:  'input[name="NickName"]',
        Sex:       'select[name="Sex"]',
        Age:       'input[name="Age"]',
        DateOfBirth:       'input[name="DateOfBirth"]',
        PlaceOfBirth:      'input[name="PlaceOfBirth"]',
        ReligionFromBirth: 'input[name="ReligionFromBirth"]',
        CurrentReligion:   'input[name="CurrentReligion"]',
        CurrentAddress:    'input[name="CurrentAddress"]',
        PermanentAddress:  'input[name="PermanentAddress"]',
        CellphoneNumber:   'input[name="CellphoneNumber"]'
    };
    Object.entries(basicMap).forEach(([key, sel]) => {
        const el = document.querySelector(sel);
        if (el && d[key]) el.value = d[key];
    });

    // ── Step 2: education ──
    if (Array.isArray(d.education) && d.education.length) {
        const container = document.getElementById('educationContainer');
        container.innerHTML = '';
        eduCount = 0;
        d.education.forEach(edu => {
            const i = eduCount++;
            container.appendChild(buildEducationCard(i, edu));
        });
        updateRemoveButtons('educationContainer');
    }

    // ── Step 3: organizations ──
    if (Array.isArray(d.organizations) && d.organizations.length) {
        const container = document.getElementById('organizationContainer');
        container.innerHTML = '';
        orgCount = 0;
        d.organizations.forEach(org => {
            const i = orgCount++;
            container.appendChild(buildOrganizationCard(i, org));
        });
        updateRemoveButtons('organizationContainer');
    }

    // ── Step 4: parents ──
    const parentFields = {
        father: ['FirstName','MiddleName','LastName','NickName','BirthDate',
                 'PlaceOfBirth','Occupation','ContactNumber','Address',
                 'HighestEducationalAttainment','isDeceased'],
        mother: ['FirstName','MiddleName','LastName','NickName','BirthDate',
                 'PlaceOfBirth','Occupation','ContactNumber','Address',
                 'HighestEducationalAttainment','isDeceased']
    };
    Object.entries(parentFields).forEach(([parent, fields]) => {
        fields.forEach(f => {
            const key = `${parent}_${f}`;
            const el  = document.querySelector(`[name="${key}"]`);
            if (el && d[key]) el.value = d[key];
        });
    });

    // ── Step 5: family status ──
    const familyFields = ['LivingTogether','MarriedYet','MarriedChurch',
        'TemporarilySepered','PermanentlySepered',
        'FatherWithPartner','MotherWithPartner'];
    familyFields.forEach(f => {
        const el = document.querySelector(`[name="${f}"]`);
        if (el && d[f]) el.value = d[f];
    });

    // ── Step 6: siblings ──
    if (Array.isArray(d.siblings) && d.siblings.length) {
        const container = document.getElementById('siblingsContainer');
        container.innerHTML = '';
        sibCount = 0;
        d.siblings.forEach(sib => {
            const i = sibCount++;
            container.appendChild(buildSiblingCard(i, sib));
        });
        updateRemoveButtons('siblingsContainer');
    }

    // ── Step 6: guardian ──
    const guardianFields = ['FirstName','MiddleName','LastName','Relationship',
                            'Address','Landline','MobileNumber'];
    guardianFields.forEach(f => {
        const el = document.querySelector(`[name="guardian_${f}"]`);
        if (el && d[`guardian_${f}`]) el.value = d[`guardian_${f}`];
    });

    // ── Step 6: friends ──
    if (Array.isArray(d.friends) && d.friends.length) {
        const container = document.getElementById('friendsContainer');
        container.innerHTML = '';
        friendCount = 0;
        d.friends.forEach(fr => {
            const i = friendCount++;
            container.appendChild(buildFriendCard(i, fr));
        });
        updateRemoveButtons('friendsContainer');
    }

    // Re-apply family status dependencies after populating data
    setupFamilyStatusDependencies();
}

// ─── UPDATE MODE UI ────────────────────────────────────────────
function enterUpdateMode() {
    isUpdateMode = true;

    // Show persistent "saved" banner in topbar area
    if (!document.querySelector('.saved-banner')) {
        const banner = document.createElement('div');
        banner.className = 'saved-banner';
        banner.innerHTML = '<i class="fas fa-circle-check"></i> Information already on Save — editing will update your record.';
        banner.style.cssText = `
            background: #dcfce7;
            color: #15803d;
            border-bottom: 1px solid #bbf7d0;
            padding: 10px 32px;
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        const topbar = document.querySelector('.topbar');
        if (topbar && topbar.parentNode) {
            topbar.parentNode.insertBefore(banner, topbar.nextSibling);
        }
    }

    // Change submit button text
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn && currentStep === totalSteps) {
        nextBtn.innerHTML = '<i class="fas fa-rotate"></i> Update Information';
    }
}

// ─── MARK STEPS COMPLETE ──────────────────────────────────────
function markStepsAsComplete() {
    for (let step = 1; step <= totalSteps; step++) {
        // NEW selector: .step-panel instead of .step-form
        const panel = document.querySelector(`.step-panel[data-step="${step}"]`);
        if (!panel) continue;
        const inputs = panel.querySelectorAll('input, select, textarea');
        let hasData = false;
        inputs.forEach(inp => { if (inp.value && inp.value.trim()) hasData = true; });
        if (hasData) completedSteps.add(step);
    }
    updateStepIndicator();
}

// ─── STEP CLICK LISTENERS ─────────────────────────────────────
function setupStepClickListeners() {
    const stepItems = document.querySelectorAll('.step-item');
    if (stepItems && stepItems.length > 0) {
        stepItems.forEach(item => {
            if (item) {
                item.style.cursor = 'pointer';
                item.addEventListener('click', () => {
                    const target = parseInt(item.getAttribute('data-step'));
                    navigateToStep(target);
                });
            }
        });
    }
}

function navigateToStep(target) {
    if (target === currentStep) return;
    saveCurrentStep();
    currentStep = Math.max(1, Math.min(totalSteps, target));
    updateStepIndicator();
    updateNavigationButtons();
    scrollToTop();
}

// ─── CHANGE STEP (Next / Prev buttons) ────────────────────────
function changeStep(direction) {
    console.log('changeStep called with direction:', direction);
    
    // Only validate when going FORWARD (direction === 1)
    // Only validate on the last step before submission
    if (direction === 1 && currentStep === totalSteps && !validateCurrentStep()) {
        console.log('Validation failed on final step, not submitting');
        return;
    }
    
    saveCurrentStep();
    const newStep = Math.max(1, Math.min(totalSteps, currentStep + direction));
    console.log('Moving from step', currentStep, 'to', newStep);
    currentStep = newStep;
    
    console.log('Updating step indicator');
    updateStepIndicator();
    
    console.log('Updating navigation buttons');
    updateNavigationButtons();
    
    // Delay scroll to allow animation to start
    console.log('Scheduling scroll to top');
    setTimeout(() => {
        console.log('Scrolling to top');
        scrollToTop();
    }, 50);
}

// ─── SAVE STEP STATE ──────────────────────────────────────────
function saveCurrentStep() {
    const panel = document.querySelector(`.step-panel[data-step="${currentStep}"]`);
    if (!panel) return;
    
    const form = document.getElementById('studentForm');
    if (!form) return;
    
    const fd = new FormData(form);
    let hasData = false;
    for (let [, v] of fd.entries()) { if (v && v.trim()) { hasData = true; break; } }
    if (hasData) {
        completedSteps.add(currentStep);
    }
}

// ─── STEP INDICATOR UPDATE ────────────────────────────────────
function updateStepIndicator() {
    try {
        console.log('updateStepIndicator: currentStep =', currentStep);
        
        // Hide all panels, show current
        const panels = document.querySelectorAll('.step-panel');
        if (panels && panels.length > 0) {
            panels.forEach(p => {
                if (p) {
                    try {
                        p.classList.remove('active');
                    } catch (e) {
                        console.error('Error removing active class:', e);
                    }
                }
            });
        }
        
        const active = document.querySelector(`.step-panel[data-step="${currentStep}"]`);
        if (active) {
            console.log('Adding active class to step', currentStep, 'panel');
            active.classList.add('active');
        } else {
            console.warn('Could not find step-panel for step', currentStep);
        }

        // Update step bubbles
        const stepItems = document.querySelectorAll('.step-item');
        if (stepItems && stepItems.length > 0) {
            stepItems.forEach((item, idx) => {
                try {
                    if (!item) return; // Skip if item is null
                    const n = idx + 1;
                    item.classList.remove('active', 'completed');
                    const bubble = item.querySelector('.step-bubble');

                    if (completedSteps.has(n) && n !== currentStep) {
                        item.classList.add('completed');
                        if (bubble) bubble.innerHTML = '<i class="fas fa-check"></i>';
                    } else if (n === currentStep) {
                        item.classList.add('active');
                        if (bubble) bubble.textContent = n;
                    } else {
                        if (bubble) bubble.textContent = n;
                    }
                } catch (e) {
                    console.error('Error updating step item:', e);
                }
            });
        }

        // Progress bar & label
        const fill  = document.getElementById('progressFill');
        const label = document.getElementById('stepLabel');
        if (fill) {
            try {
                fill.style.width = `${(currentStep / totalSteps) * 100}%`;
            } catch (e) {
                console.error('Error setting progress bar width:', e);
            }
        }
        if (label) {
            try {
                label.textContent = `Step ${currentStep} of ${totalSteps}` +
                    (completedSteps.size ? ` · ${completedSteps.size} completed` : '');
            } catch (e) {
                console.error('Error updating step label:', e);
            }
        }
    } catch (error) {
        console.error('Error in updateStepIndicator:', error);
    }
}

// ─── NAV BUTTONS ──────────────────────────────────────────────
function updateNavigationButtons() {
    try {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (!prevBtn) {
            console.error('Previous button not found');
            return;
        }
        if (!nextBtn) {
            console.error('Next button not found');
            return;
        }

        // Handle Previous button
        prevBtn.disabled = currentStep === 1;
        prevBtn.onclick = function(e) { 
            e.preventDefault();
            e.stopPropagation();
            changeStep(-1);
            return false;
        };

        // Handle Next button
        if (currentStep === totalSteps) {
            const label = isUpdateMode ? 'Update Information' : 'Submit Form';
            const icon  = isUpdateMode ? 'fa-rotate' : 'fa-save';
            nextBtn.innerHTML = `<i class="fas ${icon}"></i> ${label}`;
            nextBtn.className = 'btn-nav btn-submit';
            nextBtn.onclick = function(e) { 
                e.preventDefault();
                e.stopPropagation();
                saveCurrentStep(); 
                submitForm(e); 
                return false;
            };
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
            nextBtn.className = 'btn-nav btn-next';
            nextBtn.onclick = function(e) { 
                e.preventDefault();
                e.stopPropagation();
                changeStep(1);
                return false;
            };
        }
    } catch (error) {
        console.error('Error in updateNavigationButtons:', error);
    }
}

// ─── VALIDATE ─────────────────────────────────────────────────
function validateCurrentStep() {
    const panel = document.querySelector(`.step-panel[data-step="${currentStep}"]`);
    if (!panel) {
        console.error('Could not find step panel for step', currentStep);
        return true; // Allow proceeding if panel not found
    }
    let valid = true;
    const requiredFields = panel.querySelectorAll('[required]');
    requiredFields.forEach(f => {
        if (!f.value || !f.value.trim()) { 
            f.classList.add('error'); 
            valid = false; 
        } else { 
            f.classList.remove('error');
        }
    });
    if (!valid) showNotification('Please fill in all required fields.', 'error');
    return valid;
}

// ─── SUBMIT ───────────────────────────────────────────────────
function submitForm(e) {
    if (e) e.preventDefault();
    if (!validateCurrentStep()) return;

    const form = document.getElementById('studentForm');
    const fd   = new FormData(form);

    // ── Basic student data ──
    const studentData = {
        StudentId:        fd.get('StudentId')        || '',
        LRN:              fd.get('LRN')              || '',
        FirstName:        fd.get('FirstName')        || '',
        LastName:         fd.get('LastName')         || '',
        MiddleName:       fd.get('MiddleName')       || '',
        NickName:         fd.get('NickName')         || '',
        Sex:              fd.get('Sex')              || '',
        Age:              fd.get('Age')              || '',
        DateOfBirth:      fd.get('DateOfBirth')      || '',
        PlaceOfBirth:     fd.get('PlaceOfBirth')     || '',
        ReligionFromBirth:fd.get('ReligionFromBirth')|| '',
        CurrentReligion:  fd.get('CurrentReligion')  || '',
        CurrentAddress:   fd.get('CurrentAddress')   || '',
        PermanentAddress: fd.get('PermanentAddress') || '',
        CellphoneNumber:  fd.get('CellphoneNumber')  || '',

        // Parents
        father_FirstName:'', father_MiddleName:'', father_LastName:'',
        father_NickName:'', father_BirthDate:'', father_PlaceOfBirth:'',
        father_Occupation:'', father_ContactNumber:'', father_Address:'',
        father_HighestEducationalAttainment:'', father_isDeceased:'',
        mother_FirstName:'', mother_MiddleName:'', mother_LastName:'',
        mother_NickName:'', mother_BirthDate:'', mother_PlaceOfBirth:'',
        mother_Occupation:'', mother_ContactNumber:'', mother_Address:'',
        mother_HighestEducationalAttainment:'', mother_isDeceased:'',

        // Family status
        LivingTogether:'', MarriedYet:'', MarriedChurch:'',
        TemporarilySepered:'', PermanentlySepered:'',
        FatherWithPartner:'', MotherWithPartner:'',

        // Guardian
        guardian_FirstName:'', guardian_MiddleName:'', guardian_LastName:'',
        guardian_Relationship:'', guardian_Address:'',
        guardian_Landline:'', guardian_MobileNumber:''
    };

    // Fill in all scalar fields from FormData
    for (let [key, val] of fd.entries()) {
        if (key in studentData) studentData[key] = val;
    }

    // ── Dynamic arrays ──
    studentData.education     = collectArray(fd, 'education',     ['GradeLevel','SchoolAttended','InclusiveYes','PlaceAndSchool']);
    studentData.organizations = collectArray(fd, 'organization',  ['OrganizationName','PositionTitle','inCampus']);
    studentData.siblings      = collectArray(fd, 'sibling',       ['FirstName','MiddleName','LastName','NickName','Age','BirthOrder','SchoolId']);
    studentData.friends       = collectArray(fd, 'friend',        ['In_school','FirstName','MiddleName','LastName']);

    // Required field check
    const required = ['StudentId','LRN','FirstName','LastName','Sex','Age','DateOfBirth'];
    const missing  = required.filter(k => !studentData[k].trim());
    if (missing.length) {
        showNotification(`Required fields missing: ${missing.join(', ')}`, 'error');
        return;
    }

    fetch(`${getApiUrl()}/save-student.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
    })
    .then(r => r.text().then(text => {
        try { return { status: r.status, data: JSON.parse(text) }; }
        catch { return { status: r.status, data: { success: false, message: text } }; }
    }))
    .then(result => {
        if (!result.data.success) {
            showNotification(result.data.message || 'Error saving information.', 'error');
            return;
        }
        const msg = result.data.action === 'update'
            ? '✓ Student information updated successfully!'
            : '✓ Student information saved successfully!';
        showNotification(msg, 'success');
        enterUpdateMode();
        
        // Get StudentId from the form and reload data
        const studentIdField = document.querySelector('input[name="StudentId"]');
        if (studentIdField && studentIdField.value) {
            setTimeout(() => {
                // Reload and populate form with all saved data
                fetch(`${getApiUrl()}/save-student.php?StudentId=${encodeURIComponent(studentIdField.value)}`)
                    .then(r => r.json())
                    .then(data => {
                        if (data.success && data.data) {
                            populateFormWithData(data.data);
                            markStepsAsComplete();
                            // Go to Step 1
                            currentStep = 1;
                            updateStepIndicator();
                            updateNavigationButtons();
                            scrollToTop();
                            showNotification('✓ All your information is loaded. You are back on Step 1.', 'success');
                        }
                    })
                    .catch(err => console.error('Error reloading student data:', err));
            }, 500);
        }
    })
    .catch(err => showNotification('Error: ' + err.message, 'error'));
}

// ─── HELPER: collect indexed FormData arrays ──────────────────
function collectArray(fd, prefix, fields) {
    const result = [];
    let i = 0;
    while (true) {
        const obj = {};
        let found = false;
        fields.forEach(f => {
            const val = fd.get(`${prefix}[${i}][${f}]`);
            if (val !== null) { obj[f] = val; found = true; }
        });
        if (!found) break;
        result.push(obj);
        i++;
    }
    return result;
}

// ─── SCROLL ───────────────────────────────────────────────────
function scrollToTop() {
    const w = document.querySelector('.wizard');
    if (w) w.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── NOTIFICATION ─────────────────────────────────────────────
function showNotification(message, type = 'info') {
    const colors = { success: '#22c55e', error: '#ef4444', info: '#3b82f6' };
    const el = document.createElement('div');
    el.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        padding: 14px 20px; border-radius: 10px;
        background: ${colors[type] || colors.info};
        color: white; font-size: 13px; font-weight: 600;
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        display: flex; align-items: center; gap: 8px;
        animation: ntfIn 0.3s ease;
        font-family: 'Plus Jakarta Sans', sans-serif;
        max-width: 360px;
    `;
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
    el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    document.body.appendChild(el);
    setTimeout(() => { el.style.animation = 'ntfOut 0.3s ease forwards'; setTimeout(() => el.remove(), 300); }, 3500);
}

// ─── CONFIRMATION DIALOG ──────────────────────────────────────
function showConfirmationDialog(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.2s ease;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: white; border-radius: 12px; padding: 28px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        max-width: 400px; width: 90%; font-family: 'Plus Jakarta Sans', sans-serif;
        animation: scaleIn 0.2s ease;
    `;

    dialog.innerHTML = `
        <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #1f2937; font-weight: 700;">${title}</h2>
        <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">${message}</p>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="confirmCancel" style="
                padding: 8px 16px; border: 1px solid #d1d5db; background: #f3f4f6;
                border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;
                color: #374151; transition: all 0.2s ease;
            ">Cancel</button>
            <button id="confirmSave" style="
                padding: 8px 16px; background: #3b82f6; color: white;
                border: none; border-radius: 6px; cursor: pointer; font-size: 14px;
                font-weight: 600; transition: all 0.2s ease;
            ">Save Changes</button>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Add hover effects
    const cancelBtn = dialog.querySelector('#confirmCancel');
    const saveBtn = dialog.querySelector('#confirmSave');

    cancelBtn.addEventListener('mouseover', () => {
        cancelBtn.style.background = '#e5e7eb';
    });
    cancelBtn.addEventListener('mouseout', () => {
        cancelBtn.style.background = '#f3f4f6';
    });

    saveBtn.addEventListener('mouseover', () => {
        saveBtn.style.background = '#2563eb';
    });
    saveBtn.addEventListener('mouseout', () => {
        saveBtn.style.background = '#3b82f6';
    });

    cancelBtn.addEventListener('click', () => {
        overlay.style.animation = 'fadeOut 0.2s ease forwards';
        setTimeout(() => overlay.remove(), 200);
    });

    saveBtn.addEventListener('click', () => {
        overlay.style.animation = 'fadeOut 0.2s ease forwards';
        setTimeout(() => {
            overlay.remove();
            onConfirm();
        }, 200);
    });
}

// Notification & Dialog keyframes injected once
const ntfStyle = document.createElement('style');
ntfStyle.textContent = `
    @keyframes ntfIn  { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
    @keyframes ntfOut { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(40px); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    input.error, select.error { border-color: #ef4444 !important; background-color: #fef2f2 !important; }
`;
document.head.appendChild(ntfStyle);

// ─── DYNAMIC SECTION BUILDERS ─────────────────────────────────

// ── Education ──
function buildEducationCard(i, data = {}) {
    const div = document.createElement('div');
    div.className = 'dyn-card';
    div.innerHTML = `
        <div class="dyn-card-header">
            <span class="dyn-card-title">School Record #${i + 1}</span>
            <button type="button" class="btn-remove" onclick="this.closest('.dyn-card').remove(); updateRemoveButtons('educationContainer')">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
        <div class="field-grid">
            <div class="field-group">
                <label>Grade Level</label>
                <input type="text" name="education[${i}][GradeLevel]" placeholder="e.g., Grade 7" value="${data.GradeLevel || ''}">
            </div>
            <div class="field-group">
                <label>School Attended</label>
                <input type="text" name="education[${i}][SchoolAttended]" value="${data.SchoolAttended || ''}">
            </div>
            <div class="field-group">
                <label>Inclusive Years</label>
                <input type="text" name="education[${i}][InclusiveYes]" placeholder="e.g., 2020–2024" value="${data.InclusiveYes || ''}">
            </div>
            <div class="field-group">
                <label>Plan After High School</label>
                <textarea name="education[${i}][PlaceAndSchool]">${data.PlaceAndSchool || ''}</textarea>
            </div>
        </div>`;
    return div;
}

function addEducation() {
    const i   = eduCount++;
    const card = buildEducationCard(i);
    document.getElementById('educationContainer').appendChild(card);
    updateRemoveButtons('educationContainer');
}

// ── Organization ──
function buildOrganizationCard(i, data = {}) {
    const div = document.createElement('div');
    div.className = 'dyn-card';
    div.innerHTML = `
        <div class="dyn-card-header">
            <span class="dyn-card-title">Organization #${i + 1}</span>
            <button type="button" class="btn-remove" onclick="this.closest('.dyn-card').remove(); updateRemoveButtons('organizationContainer')">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
        <div class="field-grid">
            <div class="field-group">
                <label>Organization Name</label>
                <input type="text" name="organization[${i}][OrganizationName]" value="${data.OrganizationName || ''}">
            </div>
            <div class="field-group">
                <label>Position / Title</label>
                <input type="text" name="organization[${i}][PositionTitle]" value="${data.PositionTitle || ''}">
            </div>
            <div class="field-group">
                <label>In Campus?</label>
                <select name="organization[${i}][inCampus]">
                    <option value="">Select</option>
                    <option value="Yes" ${data.inCampus === 'Yes' ? 'selected' : ''}>Yes</option>
                    <option value="No"  ${data.inCampus === 'No'  ? 'selected' : ''}>No</option>
                </select>
            </div>
        </div>`;
    return div;
}

function addOrganization() {
    const i   = orgCount++;
    const card = buildOrganizationCard(i);
    document.getElementById('organizationContainer').appendChild(card);
    updateRemoveButtons('organizationContainer');
}

// ── Sibling ──
function buildSiblingCard(i, data = {}) {
    const div = document.createElement('div');
    div.className = 'dyn-card';
    div.innerHTML = `
        <div class="dyn-card-header">
            <span class="dyn-card-title">Sibling #${i + 1}</span>
            <button type="button" class="btn-remove" onclick="this.closest('.dyn-card').remove(); updateRemoveButtons('siblingsContainer')">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
        <div class="field-grid">
            <div class="field-group">
                <label>First Name</label>
                <input type="text" name="sibling[${i}][FirstName]" value="${data.FirstName || ''}">
            </div>
            <div class="field-group">
                <label>Middle Name</label>
                <input type="text" name="sibling[${i}][MiddleName]" value="${data.MiddleName || ''}">
            </div>
            <div class="field-group">
                <label>Last Name</label>
                <input type="text" name="sibling[${i}][LastName]" value="${data.LastName || ''}">
            </div>
            <div class="field-group">
                <label>Nickname</label>
                <input type="text" name="sibling[${i}][NickName]" value="${data.NickName || ''}">
            </div>
            <div class="field-group">
                <label>Age</label>
                <input type="number" name="sibling[${i}][Age]" value="${data.Age || ''}">
            </div>
            <div class="field-group">
                <label>Birth Order</label>
                <input type="text" name="sibling[${i}][BirthOrder]" placeholder="e.g., 1st, 2nd" value="${data.BirthOrder || ''}">
            </div>
            <div class="field-group span-2">
                <label>School ID</label>
                <input type="text" name="sibling[${i}][SchoolId]" value="${data.SchoolId || ''}">
            </div>
        </div>`;
    return div;
}

function addSibling() {
    const i    = sibCount++;
    const card  = buildSiblingCard(i);
    document.getElementById('siblingsContainer').appendChild(card);
    updateRemoveButtons('siblingsContainer');
}

// ── Friend ──
function buildFriendCard(i, data = {}) {
    const div = document.createElement('div');
    div.className = 'dyn-card';
    div.innerHTML = `
        <div class="dyn-card-header">
            <span class="dyn-card-title">Friend #${i + 1}</span>
            <button type="button" class="btn-remove" onclick="this.closest('.dyn-card').remove(); updateRemoveButtons('friendsContainer')">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
        <div class="field-grid">
            <div class="field-group">
                <label>In School?</label>
                <select name="friend[${i}][In_school]">
                    <option value="">Select</option>
                    <option value="Yes" ${data.In_school === 'Yes' ? 'selected' : ''}>Yes</option>
                    <option value="No"  ${data.In_school === 'No'  ? 'selected' : ''}>No</option>
                </select>
            </div>
            <div class="field-group">
                <label>First Name</label>
                <input type="text" name="friend[${i}][FirstName]" value="${data.FirstName || ''}">
            </div>
            <div class="field-group">
                <label>Middle Name</label>
                <input type="text" name="friend[${i}][MiddleName]" value="${data.MiddleName || ''}">
            </div>
            <div class="field-group">
                <label>Last Name</label>
                <input type="text" name="friend[${i}][LastName]" value="${data.LastName || ''}">
            </div>
        </div>`;
    return div;
}

function addFriend() {
    const i    = friendCount++;
    const card  = buildFriendCard(i);
    document.getElementById('friendsContainer').appendChild(card);
    updateRemoveButtons('friendsContainer');
}

// ─── REMOVE BUTTONS VISIBILITY ────────────────────────────────
function updateRemoveButtons(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const cards   = container.querySelectorAll('.dyn-card');
    const btns    = container.querySelectorAll('.btn-remove');
    btns.forEach(btn => { btn.style.display = cards.length > 1 ? 'inline-flex' : 'none'; });
}

// ─── FAMILY STATUS FIELD DEPENDENCIES ──────────────────────────
function setupFamilyStatusDependencies() {
    const livingTogetherEl = document.querySelector('[name="LivingTogether"]');
    const tempSeparatedEl = document.querySelector('[name="TemporarilySepered"]');
    const permSeparatedEl = document.querySelector('[name="PermanentlySepered"]');
    const fatherPartnerEl = document.querySelector('[name="FatherWithPartner"]');
    const motherPartnerEl = document.querySelector('[name="MotherWithPartner"]');

    if (!livingTogetherEl || !tempSeparatedEl || !permSeparatedEl) return;

    // Function to disable conflicting options
    const updateFamilyStatus = () => {
        // Living Together, Temporarily Separated, Permanently Separated - mutually exclusive
        if (livingTogetherEl.value === 'Yes') {
            tempSeparatedEl.disabled = true;
            permSeparatedEl.disabled = true;
            tempSeparatedEl.value = '';
            permSeparatedEl.value = '';
        } else if (tempSeparatedEl.value === 'Yes') {
            livingTogetherEl.disabled = true;
            permSeparatedEl.disabled = true;
            livingTogetherEl.value = '';
            permSeparatedEl.value = '';
        } else if (permSeparatedEl.value === 'Yes') {
            livingTogetherEl.disabled = true;
            tempSeparatedEl.disabled = true;
            livingTogetherEl.value = '';
            tempSeparatedEl.value = '';
        } else {
            livingTogetherEl.disabled = false;
            tempSeparatedEl.disabled = false;
            permSeparatedEl.disabled = false;
        }
    };

    // Attach event listeners
    livingTogetherEl.addEventListener('change', updateFamilyStatus);
    tempSeparatedEl.addEventListener('change', updateFamilyStatus);
    permSeparatedEl.addEventListener('change', updateFamilyStatus);

    // Initial state update
    updateFamilyStatus();
}

// ─── LOGOUT ───────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', e => {
            e.preventDefault();
            sessionStorage.clear();
            window.location.href = '../../index.php';
        });
    }

    // Clear error on input
    document.querySelectorAll('[required]').forEach(f => {
        f.addEventListener('input', () => { if (f.value.trim()) f.classList.remove('error'); });
    });

    // Setup family status dependencies
    setupFamilyStatusDependencies();
});