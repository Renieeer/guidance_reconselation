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

// Setup student name search with dropdown auto-suggestions (same UX as the
// counselor's Case Scenario student search) — restricted to the teacher's own school.
function setupStudentSearch() {
    const studentNameInput = document.getElementById('studentName');

    if (!studentNameInput) {
        console.error('ERROR: studentName input not found');
        return;
    }

    // Status line under the input
    let status = document.getElementById('studentSearchStatus');
    if (!status) {
        status = document.createElement('div');
        status.id = 'studentSearchStatus';
        status.style.cssText = 'margin-top:6px;font-size:12px;color:#666;min-height:18px;';
        studentNameInput.parentNode.insertBefore(status, studentNameInput.nextSibling);
    }

    // Suggestion dropdown
    let box = document.getElementById('studentSuggestionBox');
    if (!box) {
        box = document.createElement('div');
        box.id = 'studentSuggestionBox';
        box.style.cssText = 'position:relative';
        const inner = document.createElement('div');
        inner.id = 'studentSuggestionList';
        inner.style.cssText = 'position:absolute;left:0;right:0;z-index:50;background:#fff;border:1px solid #ddd;border-radius:4px;max-height:200px;overflow:auto;box-shadow:0 6px 16px rgba(0,0,0,0.08);';
        box.appendChild(inner);
        studentNameInput.parentNode.insertBefore(box, status);
    }

    let searchTimeout;
    let highlightedIndex = -1;
    window.referralStudentSuggestion = null;

    studentNameInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const searchTerm = this.value.trim();
        highlightedIndex = -1;
        status.textContent = '';
        window.referralStudentSuggestion = null;

        // Manual edits invalidate a previously selected student record
        const studentIdField = document.getElementById('studentId');
        if (studentIdField) studentIdField.value = '';

        if (searchTerm.length < 2) {
            hideStudentSuggestions();
            return;
        }

        searchTimeout = setTimeout(() => {
            searchStudentsForSuggestion(searchTerm, studentNameInput, status);
        }, 300);
    });

    studentNameInput.addEventListener('keydown', function(e) {
        const list = document.getElementById('studentSuggestionList');
        const items = list ? Array.from(list.querySelectorAll('.suggestion-item')) : [];

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
            updateSuggestionHighlight(items, highlightedIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIndex = Math.max(highlightedIndex - 1, 0);
            updateSuggestionHighlight(items, highlightedIndex);
        } else if (e.key === 'Enter') {
            if (highlightedIndex >= 0 && items[highlightedIndex]) {
                e.preventDefault();
                items[highlightedIndex].click();
            }
        } else if ((e.key === 'Tab' || e.key === 'ArrowRight') && window.referralStudentSuggestion) {
            e.preventDefault();
            const s = window.referralStudentSuggestion;
            this.value = s.fullName;
            populateStudentFromSearch(s);
            status.textContent = `Selected: ${s.fullName}`;
            status.style.color = 'green';
            hideStudentSuggestions();
        } else if (e.key === 'Escape') {
            hideStudentSuggestions();
        }
    });

    studentNameInput.addEventListener('blur', () => {
        setTimeout(() => hideStudentSuggestions(), 200);
    });
}

function updateSuggestionHighlight(items, idx) {
    items.forEach((item, i) => {
        item.style.background = i === idx ? '#f1f5ff' : '';
    });
}

function hideStudentSuggestions() {
    const list = document.getElementById('studentSuggestionList');
    if (list) list.innerHTML = '';
    window.referralStudentSuggestion = null;
}

// Search for students, restricted to the teacher's own school
function searchStudentsForSuggestion(searchTerm, inputField, statusEl) {
    const user = getCurrentUser();

    let teacherSchool = user?.school_attended;
    if (!teacherSchool) {
        teacherSchool = localStorage.getItem('teacherSchool');
    }

    if (!teacherSchool || teacherSchool === 'Default School') {
        statusEl.textContent = 'No school on file — cannot look up students.';
        statusEl.style.color = '#d9534f';
        hideStudentSuggestions();
        return;
    }

    statusEl.textContent = 'Searching school records...';
    statusEl.style.color = '#666';

    const apiUrl = `/guidancemanagment/api/get-students.php?school=${encodeURIComponent(teacherSchool)}&search=${encodeURIComponent(searchTerm)}&limit=8`;

    fetch(apiUrl)
        .then(r => r.json())
        .then(result => {
            if (!result.success) {
                statusEl.textContent = 'Unable to check student records.';
                statusEl.style.color = '#d66';
                hideStudentSuggestions();
                return;
            }

            const listEl = document.getElementById('studentSuggestionList');
            listEl.innerHTML = '';

            if (result.data && result.data.length > 0) {
                result.data.forEach(student => {
                    const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
                    const gradeLabel = student.grade_name || '';
                    const row = document.createElement('div');
                    row.className = 'suggestion-item';
                    row.style.cssText = 'padding:8px 10px;cursor:pointer;border-bottom:1px solid #f2f2f2;';
                    row.innerHTML = `<div style="font-weight:600">${escapeHtml(fullName)}</div><div style="font-size:12px;color:#666">${escapeHtml(gradeLabel)}</div>`;
                    row.addEventListener('mousedown', (ev) => {
                        ev.preventDefault();
                        inputField.value = fullName;
                        populateStudentFromSearch(Object.assign({}, student, { fullName }));
                        statusEl.textContent = `Selected: ${fullName}`;
                        statusEl.style.color = 'green';
                        hideStudentSuggestions();
                    });
                    listEl.appendChild(row);
                });

                // First result stays available for quick Tab acceptance
                const first = result.data[0];
                window.referralStudentSuggestion = Object.assign({}, first, {
                    fullName: `${first.first_name || ''} ${first.last_name || ''}`.trim()
                });
                statusEl.textContent = `Found ${result.data.length} match${result.data.length > 1 ? 'es' : ''}`;
                statusEl.style.color = 'green';
            } else {
                statusEl.textContent = 'No matching student found in school records.';
                statusEl.style.color = '#d9534f';
                window.referralStudentSuggestion = null;
                hideStudentSuggestions();
            }
        })
        .catch(error => {
            console.error('Error searching students:', error);
            statusEl.textContent = 'Error checking student records.';
            statusEl.style.color = '#d66';
            window.referralStudentSuggestion = null;
        });
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
}

// Populate form with selected student data
function populateStudentFromSearch(student) {

    const fullName = student.fullName || `${student.first_name || ''} ${student.last_name || ''}`.trim();

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
    if (gradeEl) {
        const gradeLabel = student.grade_name || gradeMap[String(student.grade_id)] || '';
        if (gradeLabel && Array.from(gradeEl.options).some(o => o.value === gradeLabel)) {
            gradeEl.value = gradeLabel;
        }
    }

    // Age (optional field on form)
    const ageEl = document.getElementById('age');
    if (ageEl && student.age) {
        ageEl.value = student.age;
    }

    // Gender
    const genderEl = document.getElementById('gender');
    const sexValue = student.sex || student.Sex;
    if (genderEl && sexValue) {
        const genderMap = { 'M': 'Male', 'F': 'Female', 'Male': 'Male', 'Female': 'Female' };
        genderEl.value = genderMap[sexValue] || sexValue;
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
        stage: 1, // Stage 1: Admission of Case
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

