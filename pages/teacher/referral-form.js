// Teacher Referral Form Script

let autoPopulateTimeout;

function initReferralForm() {
    initPage();
    setTodayDate('referralDate');
    populateTeacherSchool();
    setupStudentSearch();  // Changed from setupAutoPopulate()
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
    
    console.log('Loading referral data:', { referralId, studentId });
    
    let apiUrl = '/guidancemanagment/api/referral.php?role=teacher';
    if (referralId) {
        apiUrl += `&id=${encodeURIComponent(referralId)}`;
    } else if (studentId) {
        apiUrl += `&student_id=${encodeURIComponent(studentId)}&limit=1`;
    }
    
    fetch(apiUrl)
        .then(r => r.json())
        .then(result => {
            console.log('Referral load result:', result);
            if (result.success && result.data) {
                const referralData = Array.isArray(result.data) ? result.data[0] : result.data;
                if (referralData) {
                    populateReferralForm(referralData);
                    console.log('Referral form populated from database');
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
                console.log(`Set ${formFieldId} to:`, value);
            }
        }
    });
}

// Setup student name search with dropdown results
function setupStudentSearch() {
    const user = getCurrentUser();
    console.log('=== SETUP STUDENT SEARCH ===');
    console.log('Current user on setup:', user);
    console.log('User school_attended:', user?.school_attended);
    
    const studentNameInput = document.getElementById('studentName');
    
    if (!studentNameInput) {
        console.error('ERROR: studentName input not found');
        return;
    }
    
    // Create search results container
    const searchResultsContainer = document.createElement('div');
    searchResultsContainer.id = 'studentSearchResults';
    searchResultsContainer.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-top: none;
        max-height: 300px;
        overflow-y: auto;
        display: none;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    
    // Make parent relative for positioning
    studentNameInput.parentElement.style.position = 'relative';
    studentNameInput.parentElement.appendChild(searchResultsContainer);
    
    // Search on input
    let searchTimeout;
    studentNameInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const searchTerm = this.value.trim();
        
        if (searchTerm.length < 2) {
            searchResultsContainer.style.display = 'none';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            searchStudents(searchTerm, searchResultsContainer);
        }, 300);
    });
    
    // Close on blur
    studentNameInput.addEventListener('blur', function() {
        setTimeout(() => {
            searchResultsContainer.style.display = 'none';
        }, 200);
    });
}

// Search for students and display results
function searchStudents(searchTerm, resultsContainer) {
    const user = getCurrentUser();
    console.log('=== SEARCHING STUDENTS ===');
    console.log('Current user:', user);
    
    // Get teacher's school from user object (primary) or localStorage (fallback)
    let teacherSchool = user?.school_attended;
    
    if (!teacherSchool) {
        teacherSchool = localStorage.getItem('teacherSchool');
    }
    
    console.log('Teacher school:', teacherSchool);
    
    if (!teacherSchool || teacherSchool === 'Default School') {
        console.error('❌ ERROR: Teacher school not found. User school_attended:', user?.school_attended);
        resultsContainer.innerHTML = '<div style="padding: 10px; color: #f00;">Error: Teacher school not configured. Please contact administrator.</div>';
        resultsContainer.style.display = 'block';
        return;
    }
    
    const apiUrl = `/guidancemanagment/api/get-students.php?school=${encodeURIComponent(teacherSchool)}&search=${encodeURIComponent(searchTerm)}&limit=5`;
    
    console.log('🔍 Searching for students:', searchTerm, 'at school:', teacherSchool);
    console.log('API URL:', apiUrl);
    
    fetch(apiUrl)
        .then(r => r.json())
        .then(result => {
            console.log('API Response:', result);
            if (result.success && result.data && result.data.length > 0) {
                console.log('✓ Found', result.data.length, 'students');
                displaySearchResults(result.data, resultsContainer);
            } else {
                console.warn('⚠️ No students found matching:', searchTerm);
                resultsContainer.innerHTML = '<div style="padding: 10px; color: #999;">No students found matching "' + searchTerm + '"</div>';
                resultsContainer.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error searching students:', error);
            resultsContainer.innerHTML = '<div style="padding: 10px; color: #f00;">Error searching students</div>';
            resultsContainer.style.display = 'block';
        });
}

// Display search results as clickable list
function displaySearchResults(students, resultsContainer) {
    resultsContainer.innerHTML = '';
    
    students.forEach(student => {
        const resultItem = document.createElement('div');
        const fullName = `${student.first_name} ${student.last_name}`;
        resultItem.style.cssText = `
            padding: 10px 15px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: background 0.2s;
        `;
        resultItem.innerHTML = `
            <div style="font-weight: 500;">${fullName}</div>
            <div style="font-size: 0.85em; color: #666;">ID: ${student.id} | Grade: ${student.grade_id ? 'G' + student.grade_id : 'N/A'}</div>
        `;
        
        resultItem.addEventListener('mouseover', () => {
            resultItem.style.background = '#f0f0f0';
        });
        
        resultItem.addEventListener('mouseout', () => {
            resultItem.style.background = 'white';
        });
        
        resultItem.addEventListener('click', () => {
            console.log('✓ Student selected:', fullName, 'ID:', student.id);
            populateStudentFromSearch(student);
            resultsContainer.style.display = 'none';
        });
        
        resultsContainer.appendChild(resultItem);
    });
    
    resultsContainer.style.display = 'block';
}

// Populate form with selected student data
function populateStudentFromSearch(student) {
    console.log('=== POPULATING FROM SEARCH RESULT ===');
    console.log('Student selected:', student);
    
    const fullName = `${student.first_name} ${student.last_name}`;
    
    // Set name and ACCOUNT ID (not LRN)
    document.getElementById('studentName').value = fullName;
    
    const studentIdField = document.getElementById('studentId');
    studentIdField.value = student.id;  // This is accounts.id
    studentIdField.readOnly = true;  // Prevent manual editing
    
    console.log('✓ Student ID set to:', student.id);
    console.log('✓ Student Name set to:', fullName);
    console.log('✓ Student ID field is now read-only');
    
    // Grade
    const gradeMap = {
        '1': 'Grade 7',
        '2': 'Grade 8',
        '3': 'Grade 9',
        '4': 'Grade 10',
        '5': 'Grade 11',
        '6': 'Grade 12'
    };
    
    if (student.grade_id && gradeMap[String(student.grade_id)]) {
        document.getElementById('grade').value = gradeMap[String(student.grade_id)];
    }
    
    // Age
    if (student.Age) {
        document.getElementById('age').value = student.Age;
    }
    
    // Gender
    if (student.Sex) {
        const genderMap = {
            'M': 'Male',
            'F': 'Female',
            'Male': 'Male',
            'Female': 'Female'
        };
        document.getElementById('gender').value = genderMap[student.Sex] || student.Sex;
    }
}

// Populate teacher's school information
function populateTeacherSchool() {
    const user = getCurrentUser();
    
    console.log('=== INITIALIZING TEACHER SCHOOL ===');
    console.log('User object:', user);
    console.log('user.school_attended:', user?.school_attended);
    
    // Get teacher's school from user object (from login)
    const teacherSchool = user?.school_attended;
    
    if (!teacherSchool) {
        console.warn('⚠️ WARNING: user.school_attended is not set in user object');
    }
    
    // Store in localStorage for later use
    if (teacherSchool) {
        localStorage.setItem('teacherSchool', teacherSchool);
        console.log('✓ Stored teacher school in localStorage:', teacherSchool);
    }
    
    // Populate the school field in the form
    const schoolField = document.getElementById('studentSchool');
    if (schoolField) {
        schoolField.value = teacherSchool || 'Default School';
        schoolField.readOnly = true;  // Make read-only
        console.log('✓ Set student school field to:', schoolField.value);
    }
}

function submitReferralForm(e) {
    e.preventDefault();

    const user = getCurrentUser();
    const teacherSchool = user.school_attended || localStorage.getItem('teacherSchool') || 'Default School';
    const formData = new FormData(document.getElementById('referralForm'));
    
    // Get the student name and ID from form
    const studentName = formData.get('studentName');
    const studentId = formData.get('studentId');
    
    console.log('=== SUBMITTING REFERRAL ===');
    console.log('Student name:', studentName);
    console.log('Student ID (from accounts):', studentId);
    
    // Validate student ID is filled
    if (!studentId || studentId.trim() === '') {
        console.error('❌ ERROR: Student ID is empty!');
        showErrorMessage('Please search for and select a student from the dropdown before submitting.');
        return;
    }
    
    // Validate student name is filled
    if (!studentName || studentName.trim() === '') {
        console.error('❌ ERROR: Student name is empty!');
        showErrorMessage('Please search for and select a student from the dropdown before submitting.');
        return;
    }
    
    console.log('✓ Validation passed - both name and ID are set');
    
    submitWithStudentId(studentId, studentName, teacherSchool, formData, user);
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

    console.log('=== TEACHER SUBMITTING REFERRAL ===');
    console.log('Referral data being submitted:', referral);
    console.log('- student_id:', referral.student_id);
    console.log('- student_name:', referral.student_name);
    console.log('- school_attended:', referral.school_attended);
    
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
            console.log('=== REFERRAL SAVED ===');
            console.log('Full result:', result);
            console.log('Referral ID:', result.referral_id);
            console.log('What was stored in database:', result.debug_data);
            
            // Show success message
            showSuccessMessage('Referral submitted successfully! Student has been notified.');
            setTimeout(() => {
                // Redirect to referral status page to see the submitted referral
                window.location.href = '../student/referral-status.php';
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
