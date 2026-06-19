// Teacher Referral Form Script

let autoPopulateTimeout;

function initReferralForm() {
    initPage();
    setTodayDate('referralDate');
    populateTeacherSchool();
    setupStudentSearch();  // Autocomplete suggestions as you type
    loadExistingReferralData();
    document.getElementById('referralForm').addEventListener('submit', submitReferralForm);
}

// Load existing referral data from database (if editing or viewing previous submission)
function loadExistingReferralData() {
    const urlParams = new URLSearchParams(window.location.search);
    const referralId = urlParams.get('referral_id') || urlParams.get('id');
    const studentId = urlParams.get('student_id');
    
    if (!referralId && !studentId) {
        return; // No existing referral to load
    }
    
    let apiUrl = '/guidancemanagment/api/referral.php?role=teacher';
    if (referralId) {
        apiUrl += `&id=${encodeURIComponent(referralId)}`;
    } else if (studentId) {
        apiUrl += `&student_id=${encodeURIComponent(studentId)}&limit=1`;
    }
    
    fetch(apiUrl)
        .then(r => r.json())
        .then(result => {
            if (result.success && result.data) {
                const referralData = Array.isArray(result.data) ? result.data[0] : result.data;
                if (referralData) {
                    populateReferralForm(referralData);
                }
            }
        })
        .catch(error => console.error('Error loading existing referral:', error));
}

// Populate form fields with existing referral data
function populateReferralForm(referral) {
    const fieldMap = {
        student_name: 'studentName',
        student_id: 'studentId',
        student_school: 'studentSchool',
        grade: 'grade',
        section: 'section',
        age: 'age',
        gender: 'gender',
        date_submitted: 'referralDate',
        referral_reason: 'referralReason',
        description: 'description',
        intervention_attempts: 'interventionAttempts',
        observed_behaviors: 'observedBehaviors',
        parent_guardian: 'parentGuardian',
        parent_contact: 'parentContact',
        parent_email: 'parentEmail',
        family_background: 'familyBackground',
        urgency: 'urgency'
    };
    
    Object.entries(fieldMap).forEach(([apiField, formFieldId]) => {
        if (referral[apiField]) {
            const element = document.getElementById(formFieldId);
            if (element) {
                let value = referral[apiField];
                // Format date if it's a date field and value is a full timestamp
                if (formFieldId === 'referralDate' && value.includes(' ')) {
                    value = value.split(' ')[0]; // Get just the date part (YYYY-MM-DD)
                }
                element.value = value;
            }
        }
    });
}

// Setup student name search with inline auto-completion
function setupStudentSearch() {
    const user = getCurrentUser();
    
    const studentNameInput = document.getElementById('studentName');
    
    if (!studentNameInput) {
        console.error('ERROR: studentName input not found');
        return;
    }
    
    let searchTimeout;
    let currentSuggestion = null;
    
    studentNameInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const searchTerm = this.value.trim();
        
        if (searchTerm.length < 2) {
            return;
        }
        
        searchTimeout = setTimeout(() => {
            searchStudentsForSuggestion(searchTerm, studentNameInput);
        }, 300);
    });
    
    // Handle Tab/Right Arrow to accept suggestion
    studentNameInput.addEventListener('keydown', function(e) {
        if ((e.key === 'Tab' || e.key === 'ArrowRight') && currentSuggestion) {
            e.preventDefault();
            this.value = currentSuggestion.fullName;
            populateStudentFromSearch(currentSuggestion);
            currentSuggestion = null;
        }
    });
}

// Search for students and suggest inline
function searchStudentsForSuggestion(searchTerm, inputField) {
    const user = getCurrentUser();
    
    let teacherSchool = user?.school_attended;
    if (!teacherSchool) {
        teacherSchool = localStorage.getItem('teacherSchool');
    }
    
    if (!teacherSchool || teacherSchool === 'Default School') {
        return;
    }
    
    const apiUrl = `/guidancemanagment/api/get-students.php?school=${encodeURIComponent(teacherSchool)}&search=${encodeURIComponent(searchTerm)}&limit=1`;
    
    fetch(apiUrl)
        .then(r => r.json())
        .then(result => {
            if (result.success && result.data && result.data.length > 0) {
                const student = result.data[0];
                const fullName = `${student.first_name} ${student.last_name}`;
                
                // Show inline suggestion - grey out the suggested part
                const currentInput = inputField.value;
                const suggestion = fullName.substring(currentInput.length);
                
                if (suggestion.length > 0) {
                    // Set value to full name, position cursor at end of what user typed
                    inputField.value = fullName;
                    
                    // Select the suggested part (show as grey/highlighted)
                    inputField.setSelectionRange(currentInput.length, fullName.length);
                    
                    // Store suggestion for Tab acceptance
                    searchStudentsForSuggestion.currentSuggestion = student;
                    searchStudentsForSuggestion.currentSuggestion.fullName = fullName;
                    
                    // Also store in setup function scope
                    window.currentStudentSuggestion = student;
                    window.currentStudentSuggestion.fullName = fullName;
                }
            }
        })
        .catch(error => {
            console.error('Error searching students:', error);
        });
}

// Populate form with selected student data
function populateStudentFromSearch(student) {
    
    const fullName = `${student.first_name} ${student.last_name}`;
    
    // Set name and ACCOUNT ID (not LRN)
    document.getElementById('studentName').value = fullName;
    
    const studentIdField = document.getElementById('studentId');
    if (studentIdField) {
        studentIdField.value = student.id;  // This is accounts.id
        studentIdField.readOnly = true;  // Prevent manual editing
    }
    
    // Grade
    const gradeMap = {
        '1': 'Grade 7',
        '2': 'Grade 8',
        '3': 'Grade 9',
        '4': 'Grade 10',
        '5': 'Grade 11',
        '6': 'Grade 12'
    };
    
    const gradeEl = document.getElementById('grade');
    if (gradeEl && student.grade_id && gradeMap[String(student.grade_id)]) {
        gradeEl.value = gradeMap[String(student.grade_id)];
    }

    // Age (optional field on form)
    const ageEl = document.getElementById('age');
    if (ageEl && student.Age) {
        ageEl.value = student.Age;
    }

    // Gender
    const genderEl = document.getElementById('gender');
    if (genderEl && student.Sex) {
        const genderMap = { 'M': 'Male', 'F': 'Female', 'Male': 'Male', 'Female': 'Female' };
        genderEl.value = genderMap[student.Sex] || student.Sex;
    }
}

// Populate teacher's school information
function populateTeacherSchool() {
    const user = getCurrentUser();
    
    // Get teacher's school from user object (from login)
    const teacherSchool = user?.school_attended;
    
    if (!teacherSchool) {
        console.warn('⚠️ WARNING: user.school_attended is not set in user object');
    }
    
    // Store in localStorage for later use
    if (teacherSchool) {
        localStorage.setItem('teacherSchool', teacherSchool);
    }
    
    // Populate the school field in the form
    const schoolField = document.getElementById('studentSchool');
    if (schoolField) {
        schoolField.value = teacherSchool || 'Default School';
    }

    const teacherNameField = document.getElementById('teacherName');
    if (teacherNameField) {
        teacherNameField.value = user?.name || user?.first_name || user?.email || 'Teacher';
    }

    const teacherDesignationField = document.getElementById('teacherDesignation');
    if (teacherDesignationField) {
        teacherDesignationField.value = user?.type || user?.role || 'Teacher';
    }

    const teacherContactField = document.getElementById('teacherContact');
    if (teacherContactField) {
        teacherContactField.value = user?.contact || user?.phone || user?.contact_number || '';
    }
}

function submitReferralForm(e) {
    e.preventDefault();

    const user = getCurrentUser();
    const teacherSchool = user.school_attended || localStorage.getItem('teacherSchool') || 'Default School';
    const formData = new FormData(document.getElementById('referralForm'));
    
    // Get the student name and optional student ID from form
    const studentName = formData.get('studentName');
    const studentId = formData.get('studentId');
    
    // Validate student name is filled (manual entry allowed)
    if (!studentName || studentName.trim() === '') {
        console.error('❌ ERROR: Student name is empty!');
        showErrorMessage('Please enter the student name before submitting.');
        return;
    }
    
    submitWithStudentId(studentId || null, studentName, teacherSchool, formData, user);
}

function submitWithStudentId(studentId, studentName, teacherSchool, formData, user) {
    
    // Create referral object with school information
    const referral = {
        student_name: studentName,
        student_id: studentId,
        grade: formData.get('grade'),
        section: formData.get('section'),
        age: formData.get('age'),
        gender: formData.get('gender'),
        referral_reason: formData.get('referralReason'),
        description: formData.get('description'),
        intervention_attempts: formData.get('interventionAttempts'),
        observed_behaviors: formData.get('observedBehaviors'),
        parent_guardian: formData.get('parentGuardian'),
        parent_contact: formData.get('parentContact'),
        parent_email: formData.get('parentEmail'),
        family_background: formData.get('familyBackground'),
        urgency: formData.get('urgency'),
        teacher_id: user.id || null,
        teacher_name: user.name || user.email,
        school_attended: teacherSchool,
        student_school: formData.get('studentSchool') || teacherSchool,
        stage: 1, // Stage 1: Submitted
        status: 'pending'
    };

    // Save to database
    const apiUrl = '/guidancemanagment/api/referral.php';
    
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(referral)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        if (result.success) {
            
            // Show success message
            showSuccessMessage('Referral submitted successfully! Student has been notified.');
            setTimeout(() => {
                // Redirect to the teacher referral status page to see the submitted referral
                window.location.href = 'referral-status.php';
            }, 1500);
        } else {
            showErrorMessage(result.message || 'Failed to submit referral');
        }
    })
    .catch(error => {
        console.error('Error submitting referral:', error);
        showErrorMessage('Error submitting referral. Please try again.');
    });
}

function createReferralNotification(referral) {
   
}

function showSuccessMessage(message) {
    // Create a temporary success message
    const success = document.createElement('div');
    success.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-weight: 500;
    `;
    success.textContent = message;
    document.body.appendChild(success);
    
    setTimeout(() => success.remove(), 3000);
}

function showErrorMessage(message) {
    // Create a temporary error message
    const error = document.createElement('div');
    error.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-weight: 500;
    `;
    error.textContent = message;
    document.body.appendChild(error);
    
    setTimeout(() => error.remove(), 3000);
}


// Initialize on page load
document.addEventListener('DOMContentLoaded', initReferralForm);

