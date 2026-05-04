// ============================================================
//  student-information.js  —  works with the redesigned HTML
// ============================================================

function getApiUrl() {
    return '/guidancemanagment/api';
}

function parseStoredJson(storage, key) {
    try {
        return JSON.parse(storage.getItem(key) || '{}');
    } catch (error) {
        return {};
    }
}

function getCurrentUserProfile() {
    const sources = [
        parseStoredJson(localStorage, 'currentUser'),
        parseStoredJson(sessionStorage, 'userInfo'),
        parseStoredJson(sessionStorage, 'user')
    ];

    const merged = sources.reduce((acc, src) => ({ ...acc, ...src }), {});
    const firstName = (merged.first_name || merged.firstName || merged.First_name || merged.FirstName || '').trim();
    const lastName = (merged.last_name || merged.lastName || merged.Last_name || merged.LastName || '').trim();
    const fullName = (merged.name || `${firstName} ${lastName}` || sessionStorage.getItem('userName') || '').trim();

    return {
        id: merged.id || merged.AccountID || merged.accountId || merged.student_id || merged.StudentId || '',
        firstName,
        lastName,
        fullName,
        role: merged.user_type || merged.role || merged.Type || 'Student'
    };
}

function renderTopbarUserInfo(fullName, role) {
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userAvatar = document.getElementById('userAvatar');

    if (!userNameEl || !fullName) {
        return;
    }

    userNameEl.textContent = fullName;

    if (userRoleEl) {
        const normalizedRole = String(role || 'Student');
        userRoleEl.textContent = normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1).replace('-', ' ');
    }

    if (userAvatar) {
        const initials = fullName
            .split(' ')
            .filter(Boolean)
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
        userAvatar.textContent = initials || 'ST';
    }
}

function prefillStudentNameFields(firstName, lastName) {
    const firstNameField = document.querySelector('input[name="FirstName"]');
    const lastNameField = document.querySelector('input[name="LastName"]');

    if (firstNameField && !firstNameField.value.trim() && firstName) {
        firstNameField.value = firstName;
    }

    if (lastNameField && !lastNameField.value.trim() && lastName) {
        lastNameField.value = lastName;
    }
}

function updateTopbarNameFromStudentRecord(student) {
    if (!student || typeof student !== 'object') {
        return;
    }

    const firstName = (student.FirstName || student.first_name || '').trim();
    const lastName = (student.LastName || student.last_name || '').trim();

    if (!firstName && !lastName) {
        return;
    }

    const profile = getCurrentUserProfile();
    const fullName = `${firstName} ${lastName}`.trim();
    renderTopbarUserInfo(fullName, profile.role);
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
    console.log('Initializing student information form');
    
    // Load grades immediately
    loadGrades();
    
    try {
        // Add a longer delay to ensure all DOM elements are truly ready
        setTimeout(() => {
            try {
                setupUserInfo();
                setupStepClickListeners();
                initDynamicSections();
                setupStudentNameSearch();
                setupAgeAutoCalculate();
                loadStudentData();
                updateStepIndicator();
                updateNavigationButtons();
                setupFamilyStatusDependencies();
            } catch (error) {
                console.error('Initialization error:', error);
            }
        }, 200);
    } catch (error) {
        console.error('Error in DOMContentLoaded handler:', error);
    }
});

// ─── LOAD GRADES ───────────────────────────────────────────────
function loadGrades() {
    const gradeSelect = document.getElementById('gradeSelect');
    if (!gradeSelect) return;
    const selectedValue = gradeSelect.value;
    
    fetch(`${getApiUrl()}/school-config.php?action=getGrades`)
        .then(r => r.json())
        .then(data => {
            if (data.success && Array.isArray(data.grades) && data.grades.length > 0) {
                while (gradeSelect.options.length > 1) {
                    gradeSelect.remove(1);
                }
                data.grades.forEach(grade => {
                    const option = document.createElement('option');
                    option.value = String(grade.id);
                    option.textContent = grade.grade_name;
                    gradeSelect.appendChild(option);
                });
                if (selectedValue) {
                    gradeSelect.value = selectedValue;
                }
            } else {
                addFallbackGrades(gradeSelect, selectedValue);
            }
        })
        .catch(err => {
            addFallbackGrades(gradeSelect, selectedValue);
        });
}

// ─── FALLBACK GRADES ───────────────────────────────────────────
function addFallbackGrades(gradeSelect, selectedValue = '') {
    const fallbackGrades = [
        { id: 1, grade_name: 'Grade 7' },
        { id: 2, grade_name: 'Grade 8' },
        { id: 3, grade_name: 'Grade 9' },
        { id: 4, grade_name: 'Grade 10' }
    ];
    
    while (gradeSelect.options.length > 1) {
        gradeSelect.remove(1);
    }
    
    fallbackGrades.forEach(grade => {
        const option = document.createElement('option');
        option.value = String(grade.id);
        option.textContent = grade.grade_name;
        gradeSelect.appendChild(option);
    });

    if (selectedValue) {
        gradeSelect.value = selectedValue;
    }
}

function calculateAgeFromBirthDate(birthDateValue) {
    if (!birthDateValue) {
        return '';
    }

    const birthDate = new Date(birthDateValue);
    if (Number.isNaN(birthDate.getTime())) {
        return '';
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age >= 0 ? String(age) : '';
}

function syncAgeFromDateOfBirth() {
    const dobField = document.querySelector('input[name="DateOfBirth"]');
    const ageField = document.querySelector('input[name="Age"]');

    if (!dobField || !ageField) {
        return;
    }

    ageField.value = calculateAgeFromBirthDate(dobField.value);
}

function setupAgeAutoCalculate() {
    const dobField = document.querySelector('input[name="DateOfBirth"]');
    if (!dobField) {
        return;
    }

    dobField.addEventListener('input', syncAgeFromDateOfBirth);
    dobField.addEventListener('change', syncAgeFromDateOfBirth);
    syncAgeFromDateOfBirth();
}

// ─── MANUAL SAVE BUTTON (no auto-save) ──────────────────────
function manualSaveChanges() {
    console.log('manualSaveChanges called!');
    
    const studentIdField = document.querySelector('input[name="StudentId"]');
    console.log('studentIdField:', studentIdField);
    console.log('studentIdField value:', studentIdField ? studentIdField.value : 'NOT FOUND');
    
    if (!studentIdField || !studentIdField.value.trim()) {
        console.log('StudentId validation failed');
        showNotification('Cannot save: StudentId is empty', 'error');
        return;
    }

    // Validate grade selection
    const gradeSelect = document.querySelector('select[name="grade_id"]');
    console.log('gradeSelect:', gradeSelect);
    console.log('gradeSelect value:', gradeSelect ? gradeSelect.value : 'NOT FOUND');
    
    if (!gradeSelect || !gradeSelect.value) {
        console.log('Grade validation failed');
        showNotification('Please select a grade before saving', 'warning');
        return;
    }

    const studentIdToSave = studentIdField.value.trim();
    console.log('About to save for StudentId:', studentIdToSave);
    
    showConfirmationDialog(
        'Save Changes',
        'Save your changes?',
        () => saveToDatabaseQuick(studentIdToSave)
    );
}

// ─── SAVE TO DATABASE (called by manual save button) ──────────
function saveToDatabaseQuick(studentId) {
    try {
        console.log('saveToDatabaseQuick called with studentId:', studentId);
        
        const form = document.getElementById('studentForm');
        if (!form) {
            console.error('studentForm not found');
            return;
        }

        const fd = new FormData(form);
        
        // Collect basic student data
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
            grade_id: fd.get('grade_id') !== '' ? parseInt(fd.get('grade_id'), 10) : null,
            
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
            guardian_MobileNumber: fd.get('guardian_MobileNumber') || '',
            
            // Education data
            education: collectEducationData(),
            
            // Organization data
            organization: collectOrganizationData(),
            
            // Sibling data
            sibling: collectSiblingData(),
            
            // Friend data
            friend: collectFriendData()
        };

        console.log('Collected form data:', studentData);
        console.log('Education items:', studentData.education.length);
        console.log('Organization items:', studentData.organization.length);
        console.log('Sibling items:', studentData.sibling.length);
        console.log('Friend items:', studentData.friend.length);

        // Check if there's actual data to save
        if (!studentId || studentId.trim() === '') {
            console.warn('No StudentId provided');
            showNotification('Please enter a Student ID', 'warning');
            return;
        }

        // Send to database
        const apiUrl = `${getApiUrl()}/save-student.php`;
        console.log('Sending POST to:', apiUrl);
        
        fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        })
        .then(r => {
            console.log('Response status:', r.status);
            return r.text();
        })
        .then(text => {
            console.log('Response text:', text);
            try {
                const data = JSON.parse(text);
                if (data.success) {
                    showNotification('✓ All information saved successfully!', 'success');
                } else {
                    showNotification(data.message || 'Failed to save information', 'error');
                }
            } catch (parseErr) {
                console.error('Response parsing error:', parseErr);
                console.error('Raw response:', text);
                showNotification('Server error: ' + text, 'error');
            }
        })
        .catch(err => {
            console.error('Fetch error:', err);
            showNotification('Error saving information: ' + err.message, 'error');
        });
    } catch (error) {
        console.error('Error in saveToDatabaseQuick:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// ─── HELPER: Collect education data from form ──────────────────
function collectEducationData() {
    console.log('collectEducationData called');
    const education = [];
    const eduContainer = document.getElementById('educationContainer');
    console.log('educationContainer:', eduContainer);
    
    if (!eduContainer) {
        console.log('educationContainer not found');
        return education;
    }
    
    const eduCards = eduContainer.querySelectorAll('.dyn-card');
    console.log('Found education cards:', eduCards.length);
    
    eduCards.forEach((card, i) => {
        const gradeLevel = card.querySelector(`input[name="education[${i}][GradeLevel]"]`)?.value || '';
        const schoolAttended = card.querySelector(`input[name="education[${i}][SchoolAttended]"]`)?.value || '';
        const inclusiveYes = card.querySelector(`input[name="education[${i}][InclusiveYes]"]`)?.value || '';
        const placeAndSchool = card.querySelector(`textarea[name="education[${i}][PlaceAndSchool]"]`)?.value || '';
        
        console.log(`Education card ${i}:`, { gradeLevel, schoolAttended, inclusiveYes, placeAndSchool });
        
        if (gradeLevel || schoolAttended || inclusiveYes || placeAndSchool) {
            education.push({ GradeLevel: gradeLevel, SchoolAttended: schoolAttended, InclusiveYes: inclusiveYes, PlaceAndSchool: placeAndSchool });
        }
    });
    console.log('Total education records collected:', education.length);
    return education;
}

// ─── HELPER: Collect organization data from form ──────────────────
function collectOrganizationData() {
    console.log('collectOrganizationData called');
    const organization = [];
    const orgContainer = document.getElementById('organizationContainer');
    console.log('organizationContainer:', orgContainer);
    
    if (!orgContainer) {
        console.log('organizationContainer not found');
        return organization;
    }
    
    const orgCards = orgContainer.querySelectorAll('.dyn-card');
    console.log('Found organization cards:', orgCards.length);
    
    orgCards.forEach((card, i) => {
        const orgName = card.querySelector(`input[name="organization[${i}][OrganizationName]"]`)?.value || '';
        const positionTitle = card.querySelector(`input[name="organization[${i}][PositionTitle]"]`)?.value || '';
        const inCampus = card.querySelector(`select[name="organization[${i}][inCampus]"]`)?.value || '';
        
        console.log(`Organization card ${i}:`, { orgName, positionTitle, inCampus });
        
        if (orgName || positionTitle || inCampus) {
            organization.push({ OrganizationName: orgName, PositionTitle: positionTitle, inCampus: inCampus });
        }
    });
    console.log('Total organization records collected:', organization.length);
    return organization;
}

// ─── HELPER: Collect sibling data from form ──────────────────
function collectSiblingData() {
    console.log('collectSiblingData called');
    const siblings = [];
    const sibContainer = document.getElementById('siblingsContainer');
    console.log('siblingsContainer:', sibContainer);
    
    if (!sibContainer) {
        console.log('siblingsContainer not found');
        return siblings;
    }
    
    const sibCards = sibContainer.querySelectorAll('.dyn-card');
    console.log('Found sibling cards:', sibCards.length);
    
    sibCards.forEach((card, i) => {
        const firstName = card.querySelector(`input[name="sibling[${i}][FirstName]"]`)?.value || '';
        const lastName = card.querySelector(`input[name="sibling[${i}][LastName]"]`)?.value || '';
        const middleName = card.querySelector(`input[name="sibling[${i}][MiddleName]"]`)?.value || '';
        const nickName = card.querySelector(`input[name="sibling[${i}][NickName]"]`)?.value || '';
        const age = card.querySelector(`input[name="sibling[${i}][Age]"]`)?.value || '';
        const birthOrder = card.querySelector(`input[name="sibling[${i}][BirthOrder]"]`)?.value || '';
        const schoolId = card.querySelector(`input[name="sibling[${i}][SchoolId]"]`)?.value || '';
        
        console.log(`Sibling card ${i}:`, { firstName, lastName, age, birthOrder });
        
        if (firstName || lastName || age) {
            siblings.push({ FirstName: firstName, LastName: lastName, MiddleName: middleName, NickName: nickName, Age: age, BirthOrder: birthOrder, SchoolId: schoolId });
        }
    });
    console.log('Total sibling records collected:', siblings.length);
    return siblings;
}

// ─── HELPER: Collect friend data from form ──────────────────
function collectFriendData() {
    console.log('collectFriendData called');
    const friends = [];
    const friendContainer = document.getElementById('friendsContainer');
    console.log('friendsContainer:', friendContainer);
    
    if (!friendContainer) {
        console.log('friendsContainer not found');
        return friends;
    }
    
    const friendCards = friendContainer.querySelectorAll('.dyn-card');
    console.log('Found friend cards:', friendCards.length);
    
    friendCards.forEach((card, i) => {
        const inSchool = card.querySelector(`select[name="friend[${i}][In_school]"]`)?.value || '';
        const firstName = card.querySelector(`input[name="friend[${i}][FirstName]"]`)?.value || '';
        const middleName = card.querySelector(`input[name="friend[${i}][MiddleName]"]`)?.value || '';
        const lastName = card.querySelector(`input[name="friend[${i}][LastName]"]`)?.value || '';
        
        console.log(`Friend card ${i}:`, { firstName, lastName, inSchool });
        
        if (firstName || lastName) {
            friends.push({ In_school: inSchool, FirstName: firstName, MiddleName: middleName, LastName: lastName });
        }
    });
    console.log('Total friend records collected:', friends.length);
    return friends;
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
    const currentUser = getCurrentUserProfile();

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

    prefillStudentNameFields(currentUser.firstName, currentUser.lastName);

    // Update topbar info
    setTimeout(() => {
        if (currentUser.fullName) {
            renderTopbarUserInfo(currentUser.fullName, currentUser.role);
            sessionStorage.setItem('userName', currentUser.fullName);
        }
    }, 100);
}

// ─── SETUP STUDENT NAME SEARCH AUTO-FILL ──────────────────────
let searchTimeout;
function setupStudentNameSearch() {
    console.log('=== setupStudentNameSearch STARTED ===');
    
    // Try to find name fields - could be separate First/Last or combined Student Name
    const firstNameField = document.querySelector('input[name="FirstName"]');
    const lastNameField = document.querySelector('input[name="LastName"]');
    const studentNameField = document.querySelector('input[name="StudentName"]') || 
                            document.querySelector('input[placeholder*="Student Name" i]') ||
                            document.querySelector('input[placeholder*="students name" i]');
    
    console.log('=== Field Detection ===');
    console.log('firstNameField:', firstNameField ? 'FOUND' : 'NOT FOUND');
    console.log('lastNameField:', lastNameField ? 'FOUND' : 'NOT FOUND');
    console.log('studentNameField:', studentNameField ? 'FOUND' : 'NOT FOUND');
    
    if (!firstNameField && !lastNameField && !studentNameField) {
        console.error('ERROR: No name fields found on the form!');
        return;
    }
    
    const handleStudentSearch = () => {
        console.log('=== handleStudentSearch TRIGGERED ===');
        clearTimeout(searchTimeout);
        
        let firstName = '';
        let lastName = '';
        
        if (studentNameField && studentNameField.value.trim()) {
            // If using combined Student Name field, split it
            const parts = studentNameField.value.trim().split(' ');
            firstName = parts[0] || '';
            lastName = parts.slice(1).join(' ') || '';
            console.log('Using combined StudentName field');
        } else {
            // Use separate fields
            firstName = firstNameField?.value?.trim() || '';
            lastName = lastNameField?.value?.trim() || '';
            console.log('Using separate FirstName/LastName fields');
        }
        
        console.log('Current input:', { firstName, lastName });
        
        // Need at least 2 characters to search
        if (firstName.length < 2 && lastName.length < 2) {
            console.log('Search skipped - not enough characters');
            return;
        }
        
        // Build search query
        const searchQuery = `${firstName} ${lastName}`.trim();
        
        // Get school from current logged-in user
        const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
        const school = currentUser.school_attended || 'Default School';
        
        console.log('Search parameters:', { searchQuery, school });
        
        // Debounce search - wait 500ms after user stops typing
        searchTimeout = setTimeout(() => {
            const url = `${getApiUrl()}/get-students.php?search=${encodeURIComponent(searchQuery)}&school=${encodeURIComponent(school)}&limit=5`;
            console.log('Fetching from URL:', url);
            
            fetch(url)
                .then(r => {
                    console.log('Response status:', r.status, r.statusText);
                    if (!r.ok) {
                        throw new Error(`HTTP ${r.status}`);
                    }
                    return r.json();
                })
                .then(data => {
                    console.log('=== API Response ===');
                    console.log('Full response:', data);
                    console.log('Success:', data.success);
                    console.log('Students:', data.students);
                    console.log('Student count:', data.students?.length || 0);
                    
                    if (data.success && Array.isArray(data.students) && data.students.length > 0) {
                        // Auto-fill with the first matching student
                        const student = data.students[0];
                        console.log('=== Auto-filling with ===', student);
                        
                        // Populate StudentId / LRN field
                        const lrnField = document.querySelector('input[name="LRN"]');
                        if (lrnField && student.id) {
                            lrnField.value = student.id;
                            console.log('✓ Set LRN to:', student.id);
                        }
                        
                        const studentIdField = document.querySelector('input[name="StudentId"]');
                        if (studentIdField && student.id) {
                            studentIdField.value = student.id;
                            console.log('✓ Set StudentId to:', student.id);
                        }
                        
                        // Auto-fill Age
                        if (student.Age) {
                            const ageField = document.querySelector('input[name="Age"]');
                            if (ageField) {
                                ageField.value = student.Age;
                                console.log('✓ Set Age to:', student.Age);
                            }
                        }
                        
                        // Auto-fill Sex/Gender
                        if (student.Sex) {
                            const sexField = document.querySelector('select[name="Sex"]');
                            if (sexField) {
                                sexField.value = student.Sex;
                                console.log('✓ Set Sex to:', student.Sex);
                            }
                        }
                        
                        // Auto-fill Date of Birth
                        if (student.DateOfBirth) {
                            const dobField = document.querySelector('input[name="DateOfBirth"]');
                            if (dobField) {
                                dobField.value = student.DateOfBirth;
                                console.log('✓ Set DateOfBirth to:', student.DateOfBirth);
                            }
                        }

                        syncAgeFromDateOfBirth();
                        
                        // Auto-fill Grade
                        if (student.grade_id) {
                            const gradeField = document.querySelector('select[name="grade_id"]');
                            if (gradeField) {
                                gradeField.value = student.grade_id;
                                console.log('✓ Set grade_id to:', student.grade_id);
                            }
                        }
                        
                        showNotification('✓ Student found and auto-filled!', 'success');
                    } else {
                        console.log('No students found matching:', searchQuery);
                    }
                })
                .catch(err => {
                    console.error('=== FETCH ERROR ===', err);
                });
        }, 500);
    };
    
    // Add event listeners for real-time search
    if (firstNameField) {
        console.log('✓ Adding input listener to FirstName field');
        firstNameField.addEventListener('input', handleStudentSearch);
    }
    if (lastNameField) {
        console.log('✓ Adding input listener to LastName field');
        lastNameField.addEventListener('input', handleStudentSearch);
    }
    if (studentNameField) {
        console.log('✓ Adding input listener to StudentName field');
        studentNameField.addEventListener('input', handleStudentSearch);
    }
    
    console.log('=== setupStudentNameSearch COMPLETED ===');
}

// ─── LOAD DATA (on page load) ──────────────────────────────────
function loadStudentData() {
    let studentId = null;

    // Get StudentId from current logged-in user (from session or auth)
    try {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (user.id) {
            studentId = user.id;
        }
    } catch (e) {
        console.error('Error parsing user:', e);
    }

    // Fallback: Try sessionStorage if not found
    if (!studentId) {
        studentId = sessionStorage.getItem('studentId');
    }

    if (!studentId) {
        console.log('No student ID found, form is ready for manual entry');
        return;
    }

    console.log('Loading student data for StudentId:', studentId);

    setTimeout(() => {
        // First try the merged API endpoint which gets data from both accounts and student_table
        fetch(`${getApiUrl()}/get-student-details.php?student_id=${encodeURIComponent(studentId)}`)
            .then(r => {
                if (!r.ok) {
                    throw new Error(`HTTP ${r.status}: ${r.statusText}`);
                }
                return r.json();
            })
            .then(data => {
                console.log('API Response from get-student-details:', data);
                
                if (data.success && data.student) {
                    console.log('Student data loaded from get-student-details');
                    console.log('Education records:', data.education);
                    console.log('Organization records:', data.organizations);
                    console.log('Sibling records:', data.siblings);
                    console.log('Friend records:', data.friends);
                    
                    // Pass the full response object
                    populateFormWithStudentDetails(data);
                    updateTopbarNameFromStudentRecord(data.student);
                    markStepsAsComplete();
                    enterUpdateMode();
                    showNotification('✓ Your previous information has been loaded.', 'success');
                } else {
                    console.log('No student data found, trying fallback API');
                    // Fallback to save-student.php if get-student-details fails
                    return fetch(`${getApiUrl()}/save-student.php?StudentId=${encodeURIComponent(studentId)}`);
                }
            })
            .then(r => {
                if (!r) return null;
                if (!r.ok) {
                    throw new Error(`HTTP ${r.status}: ${r.statusText}`);
                }
                return r.json();
            })
            .then(data => {
                if (data && data.success && data.data) {
                    console.log('Student data loaded from save-student.php');
                        populateFormWithData({
                            ...data.data,
                            family_status: data.family_status || {}
                        });
                    updateTopbarNameFromStudentRecord(data.data);
                    markStepsAsComplete();
                    enterUpdateMode();
                    showNotification('✓ Your previous information has been loaded.', 'success');
                }
            })
            .catch(err => {
                console.error('Error loading student data:', err.message);
                console.error('Full error:', err);
                // Still pre-fill the StudentId even if fetch fails
                const studentIdField = document.querySelector('input[name="StudentId"]');
                if (studentIdField && !studentIdField.value) {
                    studentIdField.value = studentId;
                }
            });
    }, 200);
}

// ─── POPULATE FORM FROM get-student-details.php ─────────────────
function populateFormWithStudentDetails(response) {
    console.log('populateFormWithStudentDetails called with response:', response);
    const student = response.student || {};
    const familyStatus = response.family_status || student.family_status || {};
    
    // ── Step 1: Basic student info (from merged account + student_table data) ──
    const basicMap = {
        'StudentId': 'input[name="StudentId"]',
        'id': 'input[name="StudentId"]',  // Fallback to account id
        'LRN': 'input[name="LRN"]',
        'first_name': 'input[name="FirstName"]',
        'FirstName': 'input[name="FirstName"]',
        'last_name': 'input[name="LastName"]',
        'LastName': 'input[name="LastName"]',
        'MiddleName': 'input[name="MiddleName"]',
        'NickName': 'input[name="NickName"]',
        'Sex': 'select[name="Sex"]',
        'Age': 'input[name="Age"]',
        'grade_id': 'select[name="grade_id"]',
        'DateOfBirth': 'input[name="DateOfBirth"]',
        'PlaceOfBirth': 'input[name="PlaceOfBirth"]',
        'ReligionFromBirth': 'input[name="ReligionFromBirth"]',
        'CurrentReligion': 'input[name="CurrentReligion"]',
        'CurrentAddress': 'input[name="CurrentAddress"]',
        'PermanentAddress': 'input[name="PermanentAddress"]',
        'CellphoneNumber': 'input[name="CellphoneNumber"]'
    };
    
    Object.entries(basicMap).forEach(([key, sel]) => {
        const el = document.querySelector(sel);
        if (el && student[key] && student[key] !== '' && student[key] !== null) {
            el.value = student[key];
        }
    });

    const sexField = document.querySelector('select[name="Sex"]');
    const sexValue = student.Sex ?? student.sex ?? student.gender ?? '';
    if (sexField && sexValue !== '') {
        sexField.value = String(sexValue);
    }

    const gradeField = document.querySelector('select[name="grade_id"]');
    const gradeValue = student.grade_id ?? student.Grade ?? student.grade_level ?? student.GradeId ?? student.grade ?? '';
    if (gradeField && gradeValue !== '') {
        gradeField.value = String(gradeValue);
    }

    syncAgeFromDateOfBirth();

    // ── Step 2: Education ──
    console.log('Processing education data:', response.education);
    if (Array.isArray(response.education) && response.education.length) {
        const container = document.getElementById('educationContainer');
        container.innerHTML = '';
        eduCount = 0;
        response.education.forEach(edu => {
            console.log('Adding education record:', edu);
            const i = eduCount++;
            container.appendChild(buildEducationCard(i, edu));
        });
        updateRemoveButtons('educationContainer');
    }

    // ── Step 3: Organizations ──
    console.log('Processing organization data:', response.organizations);
    if (Array.isArray(response.organizations) && response.organizations.length) {
        const container = document.getElementById('organizationContainer');
        container.innerHTML = '';
        orgCount = 0;
        response.organizations.forEach(org => {
            console.log('Adding organization record:', org);
            const i = orgCount++;
            container.appendChild(buildOrganizationCard(i, org));
        });
        updateRemoveButtons('organizationContainer');
    }

    // ── Step 4: Parents ──
    console.log('Processing parent data:', response.parents);
    if (Array.isArray(response.parents) && response.parents.length) {
        const parentMap = {
            'father': 0,
            'mother': 1
        };
        const parentFieldMap = {
            'HighestEducationalAttainment': 'HighestEducationAttained',
            'isDeceased': 'IsDeceased'
        };
        
        response.parents.forEach((parent, idx) => {
            const parentType = idx === 0 ? 'father' : 'mother';
            const fields = ['FirstName', 'MiddleName', 'LastName', 'NickName', 'BirthDate',
                           'PlaceOfBirth', 'Occupation', 'ContactNumber', 'Address',
                           'HighestEducationalAttainment', 'isDeceased'];
            
            fields.forEach(field => {
                const key = `${parentType}_${field}`;
                const el = document.querySelector(`[name="${key}"]`);
                const sourceKey = parentFieldMap[field] || field;
                if (el && parent[sourceKey]) {
                    el.value = parent[sourceKey];
                }
            });
        });
    }

    // ── Step 5: Family Status ──
    console.log('Processing family status data:', response.family_status);
    if (familyStatus && typeof familyStatus === 'object') {
        const familyFields = ['LivingTogether', 'MarriedYet', 'MarriedChurch',
            'TemporarilySepered', 'PermanentlySepered',
            'FatherWithPartner', 'MotherWithPartner'];
        
        familyFields.forEach(f => {
            const el = document.querySelector(`[name="${f}"]`);
            if (el && familyStatus[f] !== undefined && familyStatus[f] !== null && familyStatus[f] !== '') {
                el.value = familyStatus[f];
            }
        });
    }

    // ── Step 6: Siblings ──
    console.log('Processing sibling data:', response.siblings);
    if (Array.isArray(response.siblings) && response.siblings.length) {
        const container = document.getElementById('siblingsContainer');
        container.innerHTML = '';
        sibCount = 0;
        response.siblings.forEach(sib => {
            console.log('Adding sibling record:', sib);
            const i = sibCount++;
            container.appendChild(buildSiblingCard(i, sib));
        });
        updateRemoveButtons('siblingsContainer');
    }

    // ── Step 6: Guardian ──
    console.log('Processing guardian data:', response.guardians);
    if (Array.isArray(response.guardians) && response.guardians.length > 0) {
        const guardian = response.guardians[0];
        const guardianFields = ['FirstName', 'MiddleName', 'LastName', 'Relationship',
                                'Address', 'Landline', 'MobileNumber'];
        guardianFields.forEach(f => {
            const el = document.querySelector(`[name="guardian_${f}"]`);
            if (el && guardian[f]) el.value = guardian[f];
        });
    }

    // ── Step 6: Friends ──
    console.log('Processing friend data:', response.friends);
    if (Array.isArray(response.friends) && response.friends.length) {
        const container = document.getElementById('friendsContainer');
        container.innerHTML = '';
        friendCount = 0;
        response.friends.forEach(fr => {
            console.log('Adding friend record:', fr);
            const i = friendCount++;
            container.appendChild(buildFriendCard(i, fr));
        });
        updateRemoveButtons('friendsContainer');
    }

    // Re-apply family status dependencies after populating data
    setupFamilyStatusDependencies();
    console.log('Form populated with student details');
}

// ─── LOAD DATA (manual StudentId change) ──────────────────────
function loadStudentDataByInputId() {
    const field = document.querySelector('input[name="StudentId"]');
    if (!field || !field.value.trim()) return;

    fetch(`${getApiUrl()}/save-student.php?StudentId=${encodeURIComponent(field.value.trim())}`)
        .then(r => r.json())
        .then(data => {
            if (data.success && data.data) {
                    populateFormWithData({
                        ...data.data,
                        family_status: data.family_status || {}
                    });
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
    const sexValue = d.Sex ?? d.sex ?? d.gender ?? '';
    const gradeValue = d.grade_id ?? d.Grade ?? d.grade_level ?? d.GradeId ?? d.grade ?? '';
    const basicMap = {
        StudentId: 'input[name="StudentId"]',
        LRN:       'input[name="LRN"]',
        FirstName: 'input[name="FirstName"]',
        MiddleName:'input[name="MiddleName"]',
        LastName:  'input[name="LastName"]',
        NickName:  'input[name="NickName"]',
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
        if (el && (d[key] !== null && d[key] !== undefined && d[key] !== '')) {
            el.value = d[key];
        }
    });

    const sexField = document.querySelector('select[name="Sex"]');
    if (sexField && sexValue !== '') {
        sexField.value = String(sexValue);
    }

    const gradeField = document.querySelector('select[name="grade_id"]');
    if (gradeField && gradeValue !== '') {
        gradeField.value = String(gradeValue);
    }

    syncAgeFromDateOfBirth();

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
    const familySource = d.family_status || d;
    const familyFields = ['LivingTogether','MarriedYet','MarriedChurch',
        'TemporarilySepered','PermanentlySepered',
        'FatherWithPartner','MotherWithPartner'];
    familyFields.forEach(f => {
        const el = document.querySelector(`[name="${f}"]`);
        if (el && familySource[f] !== undefined && familySource[f] !== null && familySource[f] !== '') el.value = familySource[f];
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
                console.log('Update Information/Submit button clicked');
                const studentIdField = document.querySelector('input[name="StudentId"]');
                if (studentIdField && studentIdField.value) {
                    manualSaveChanges();
                } else {
                    console.error('StudentId field not found or empty');
                    showNotification('Error: StudentId is missing', 'error');
                }
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
                            populateFormWithData({
                                ...data.data,
                                family_status: data.family_status || {}
                            });
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
        background: rgba(0,0,0,0.6); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.2s ease;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: white; border-radius: 16px; padding: 32px;
        box-shadow: 0 25px 50px rgba(0,0,0,0.25);
        max-width: 420px; width: 90%; font-family: 'Plus Jakarta Sans', sans-serif;
        animation: scaleIn 0.2s ease;
    `;

    dialog.innerHTML = `
        <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #1f2937; font-weight: 700;">${title}</h2>
        <p style="margin: 0 0 28px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">${message}</p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="confirmCancel" style="
                padding: 10px 20px; border: 1px solid #d1d5db; background: white;
                border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;
                color: #374151; transition: all 0.3s ease;
            ">Cancel</button>
            <button id="confirmSave" style="
                padding: 10px 24px; background: #10b981; color: white;
                border: none; border-radius: 8px; cursor: pointer; font-size: 14px;
                font-weight: 600; transition: all 0.3s ease;
            ">Save</button>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Add hover effects
    const cancelBtn = dialog.querySelector('#confirmCancel');
    const saveBtn = dialog.querySelector('#confirmSave');

    cancelBtn.addEventListener('mouseover', () => {
        cancelBtn.style.background = '#f9fafb';
        cancelBtn.style.borderColor = '#9ca3af';
    });
    cancelBtn.addEventListener('mouseout', () => {
        cancelBtn.style.background = 'white';
        cancelBtn.style.borderColor = '#d1d5db';
    });

    saveBtn.addEventListener('mouseover', () => {
        saveBtn.style.background = '#059669';
        saveBtn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
    });
    saveBtn.addEventListener('mouseout', () => {
        saveBtn.style.background = '#10b981';
        saveBtn.style.boxShadow = 'none';
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
        <div class="field-grid education-grid">
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
            <div class="field-group education-plan-field">
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
        <div class="field-grid organization-grid">
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
        <div class="sibling-row">
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
            <div class="field-group">
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
        <div class="friend-row">
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