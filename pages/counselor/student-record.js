// Student Record Script

let allStudents = [];
let currentStudent = null;
let refreshInterval = null;
let tableRefreshInterval = null;

function loadStudentRecords() {
    initPage();
    
    // Resolve current user's school robustly from storage
    const getUserSchool = () => {
        try {
            const raw = sessionStorage.getItem('userInfo') || sessionStorage.getItem('user') || localStorage.getItem('currentUser') || localStorage.getItem('teacherSchool');
            if (!raw) {
                console.warn('No user data found in storage');
                return '';
            }
            let parsed = null;
            try { parsed = JSON.parse(raw); } catch (e) { parsed = raw; }
            if (parsed && typeof parsed === 'object') {
                const school = parsed.school_attended || parsed.school || '';
                console.log('User data found:', { school_attended: parsed.school_attended, school: parsed.school, resolved: school });
                return school;
            }
            console.warn('User data is not an object');
            return '';
        } catch (e) {
            console.error('Error getting user school:', e);
            return '';
        }
    };

    const userSchool = getUserSchool();
    console.log('Loading student records for school:', userSchool || '(EMPTY - THIS IS THE PROBLEM)');
    
    if (!userSchool || userSchool === 'Unknown') {
        console.error('ERROR: School is not set or is "Unknown". Please update counselor account with proper school name.');
        const tbody = document.getElementById('recordsTableBody');
        tbody.innerHTML = `<tr>
            <td colspan="7" style="text-align: center; padding: 30px; color: red;">
                <strong>Error:</strong> Your account is not assigned to a school. Please contact admin.
            </td>
        </tr>`;
        return;
    }
    
    // Fetch students from database
    fetchStudents(userSchool)
        .then(() => {
            console.log('Students loaded:', allStudents.length);
            // Setup event listeners
            document.getElementById('searchStudent').addEventListener('keyup', filterStudents);
            document.getElementById('gradeFilter').addEventListener('change', filterStudents);
            document.getElementById('statusFilter').addEventListener('change', filterStudents);
            
            displayStudents(allStudents);
        })
        .catch(error => {
            console.error('Error loading students:', error);
            alert('Error loading student records. Please try again.');
        });
}

function fetchStudents(school) {
    const apiUrl = `/guidancemanagment/api/get-students.php?school=${encodeURIComponent(school)}`;
    console.log('Fetching students from:', apiUrl);
    
    return fetch(apiUrl)
        .then(response => response.json())
        .then(result => {
            console.log('API Response:', result);
            if (result.success) {
                allStudents = result.data || [];
                console.log(`Successfully loaded ${allStudents.length} students for school: ${school}`);
            } else {
                console.error('API Error:', result.message);
                throw new Error(result.message || 'Failed to fetch students');
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            throw error;
        });
}

function displayStudents(students) {
    const tbody = document.getElementById('recordsTableBody');

    if (students.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="7" style="text-align: center; padding: 30px; color: #999;">No student records found</td>
        </tr>`;
        return;
    }

    const getGradeLabel = (student) => {
        const gradeValue = String(student.grade_level || student.grade_id || student.Grade || '').trim();

        if (!gradeValue) {
            return 'N/A';
        }

        const normalizedGrade = gradeValue.replace(/^grade\s*/i, '');
        if (/^\d+$/.test(normalizedGrade)) {
            return `Grade ${normalizedGrade}`;
        }

        return gradeValue;
    };

    tbody.innerHTML = students.map((student, index) => {
        const gradeName = getGradeLabel(student);
        const studentId = student.id || student.StudentId || '';
        const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
        
        return `<tr style="border-bottom: 1px solid #e5e7eb; transition: background-color 0.2s ease; ${index % 2 === 0 ? 'background-color: #f9fafb;' : ''}">
            <td style="padding: 14px 15px;"><strong style="color: #1f2937;">${studentName || 'N/A'}</strong></td>
            <td style="padding: 14px 15px; color: #6b7280; font-size: 14px;">${student.email || 'N/A'}</td>
            <td style="padding: 14px 15px; color: #6b7280;">${gradeName || 'N/A'}</td>
            <td style="padding: 14px 15px; color: #6b7280;">${student.age || student.Age || 'N/A'}</td>
            <td style="padding: 14px 15px; color: #6b7280;">${student.section || student.Section || 'N/A'}</td>
            <td style="padding: 14px 15px; text-align: center;">
                ${student.referral_count > 0 ? '<span class="badge" style="background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">active</span>' : '<span class="badge" style="background: #9ca3af; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">inactive</span>'}
            </td>
            <td style="padding: 14px 15px; text-align: center;">
                <button class="btn btn-sm btn-primary" onclick="viewStudentRecord(${JSON.stringify(studentId)})" style="background: #3b82f6; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: background-color 0.2s;">View</button>
            </td>
        </tr>`;
    }).join('');
}

function viewStudentRecord(studentId) {
    // Get user school robustly from multiple storage locations
    const getUserSchool = () => {
        try {
            const raw = sessionStorage.getItem('userInfo') || sessionStorage.getItem('user') || localStorage.getItem('currentUser') || localStorage.getItem('teacherSchool');
            if (!raw) return '';
            let parsed = null;
            try { parsed = JSON.parse(raw); } catch (e) { parsed = raw; }
            if (parsed && typeof parsed === 'object') {
                return parsed.school_attended || parsed.school || '';
            }
            return '';
        } catch (e) {
            return '';
        }
    };
    
    const userSchool = getUserSchool();
    
    // Clear any existing refresh interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Function to fetch and display student details
    const loadStudentDetails = () => {
        const url = `/guidancemanagment/api/get-student-details.php?student_id=${studentId}&school=${encodeURIComponent(userSchool)}`;
        console.log('Fetching from URL:', url);
        
        fetch(url)
            .then(response => response.json())
            .then(result => {
                console.log('API Response:', result);
                if (result && result.success && result.student) {
                    currentStudent = result.student;
                    document.getElementById('debugInfo').innerHTML = `Name: ${result.student.first_name || 'N/A'}`;
                    console.log('Calling displayStudentDetail with:', result);
                    displayStudentDetail(result);
                } else {
                    const errMsg = result && result.message ? result.message : 'Unknown error';
                    document.getElementById('debugInfo').innerHTML = `ERROR: ${errMsg}`;
                    console.error('Error loading student details:', errMsg);
                    alert('Error: ' + errMsg);
                }
            })
            .catch(error => {
                console.error('Error fetching student details:', error);
                document.getElementById('debugInfo').innerHTML = `FETCH ERROR: ${error.message}`;
                alert('Error fetching student details: ' + error);
            });
    };
    
    // Initial load
    loadStudentDetails();
    
    // Refresh every 3 seconds while modal is open
    refreshInterval = setInterval(loadStudentDetails, 3000);
    
    openModal('studentDetailModal');
}

function displayStudentDetail(data) {
    console.log('displayStudentDetail called with:', data);
    
    const student = data.student || {};
    const referrals = data.referrals || [];
    const families = data.family_status || {};
    const education = data.education || [];
    const organizations = data.organizations || [];
    const siblings = data.siblings || [];
    const friends = data.friends || [];
    
    console.log('Student object:', student);
    
    // Debug: Show what we're receiving
    const debugMsg = `DEBUG - Student: ${JSON.stringify(student).substring(0, 200)}`;
    console.log(debugMsg);
    
    const showValue = (val) => {
        if (val === null || val === undefined || val === '') {
            return 'Not provided';
        }
        return String(val);
    };
    
    // Helper to safely set field values
    const setField = (fieldId, value) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = showValue(value);
            const debugVal = showValue(value).substring(0, 30);
            console.log(`Set ${fieldId} to: ${debugVal}`);
        } else {
            console.warn(`Field ${fieldId} not found!`);
        }
    };
    
    // Personal Information
    setField('formFirstName', student.first_name || student.FirstName);
    setField('formLastName', student.last_name || student.LastName);
    setField('formStudentId', student.id || student.StudentId);
    setField('formEmail', student.email);
    setField('formDateOfBirth', student.DateOfBirth || student.date_of_birth);
    setField('formGender', student.Sex || student.gender);
    
    // Academic Information
    setField('formSchool', student.school_attended);
    
    // Convert grade_id to grade name
    const gradeMap = {
        '1': 'Grade 7',
        '2': 'Grade 8',
        '3': 'Grade 9',
        '4': 'Grade 10'
    };
    console.log('Student object grade fields:');
    console.log('  grade_id:', student.grade_id);
    console.log('  grade_level:', student.grade_level);
    console.log('  GradeId:', student.GradeId);
    
    const gradeId = String(student.grade_id || student.grade_level || student.GradeId || '');
    console.log('Final gradeId:', gradeId);
    const gradeName = gradeMap[gradeId] || student.grade_level || gradeId || '';
    console.log('Final gradeName:', gradeName);
    setField('formGradeLevel', gradeName);
    
    setField('formSection', student.section);
    
    // Family Information
    setField('formFatherName', student.father_name);
    setField('formMotherName', student.mother_name);
    setField('formGuardianName', student.guardian_name);
    setField('formSiblings', student.number_of_siblings || 0);
    
    // Family Status
    let familyStatusText = '';
    if (families && Object.keys(families).length > 0) {
        const status = [];
        if (families.LivingTogether === 'Yes') status.push('Living Together');
        if (families.MarriedYet === 'Yes') status.push('Married');
        if (families.MarriedChurch === 'Yes') status.push('Married in Church');
        if (families.TemporarilySepered === 'Yes') status.push('Temporarily Separated');
        if (families.PermanentlySepered === 'Yes') status.push('Permanently Separated');
        if (families.FatherWithPartner === 'Yes') status.push('Father with Partner');
        if (families.MotherWithPartner === 'Yes') status.push('Mother with Partner');
        familyStatusText = status.length > 0 ? status.join(', ') : 'Not provided';
    } else {
        familyStatusText = 'Not provided';
    }
    setField('formFamilyStatus', familyStatusText);
    setField('formFamilyIncome', student.monthly_family_income);
    
    // Health & Issues
    setField('formHealthCondition', student.health_condition);
    setField('formBehavioralIssues', student.behavioral_issues);
    setField('formAcademicStruggles', student.academic_struggles);
    setField('formSocialIssues', student.social_issues);
    
    // Counseling Notes
    setField('counselingNotes', student.counseling_notes);
    
    // Display education history
    const educationContainer = document.getElementById('educationHistoryContainer');
    if (education.length === 0) {
        educationContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 14px; text-align: center; margin: 0;">No education records</p>';
    } else {
        educationContainer.innerHTML = `<div style="display: grid; gap: 12px;">
            ${education.map(edu => `
                <div style="padding: 14px; background: white; border-left: 4px solid var(--primary); border-radius: 6px;">
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${edu.SchoolAttended || 'School'}</div>
                    <div style="font-size: 13px; color: var(--text-muted);">Grade: ${edu.GradeLevel || 'N/A'}</div>
                    <div style="font-size: 13px; color: var(--text-muted);">Years: ${edu.InclusiveYes || 'N/A'}</div>
                    ${edu.PlaceAndSchool ? `<div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Plans: ${edu.PlaceAndSchool}</div>` : ''}
                </div>
            `).join('')}
        </div>`;
    }
    
    // Display organizations
    const organizationContainer = document.getElementById('organizationHistoryContainer');
    if (organizations.length === 0) {
        organizationContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 14px; text-align: center; margin: 0;">No organization records</p>';
    } else {
        organizationContainer.innerHTML = `<div style="display: grid; gap: 12px;">
            ${organizations.map(org => `
                <div style="padding: 14px; background: white; border-left: 4px solid var(--primary); border-radius: 6px;">
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${org.OrganizationName || 'Organization'}</div>
                    <div style="font-size: 13px; color: var(--text-muted);">Position: ${org.PositionTitle || 'N/A'}</div>
                    <div style="font-size: 13px; color: var(--text-muted);">In Campus: ${org.inCampus === 'Yes' ? '✓ Yes' : org.inCampus === 'No' ? '✗ No' : 'N/A'}</div>
                </div>
            `).join('')}
        </div>`;
    }
    
    // Display siblings
    const siblingsContainer = document.getElementById('siblingsHistoryContainer');
    if (siblings.length === 0) {
        siblingsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 14px; text-align: center; margin: 0;">No sibling records</p>';
    } else {
        siblingsContainer.innerHTML = `<div style="display: grid; gap: 12px;">
            ${siblings.map(sib => `
                <div style="padding: 14px; background: white; border-left: 4px solid var(--primary); border-radius: 6px;">
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${sib.FirstName || ''} ${sib.LastName || ''}</div>
                    <div style="font-size: 13px; color: var(--text-muted);">Age: ${sib.Age || 'N/A'} | Birth Order: ${sib.BirthOrder || 'N/A'}</div>
                    ${sib.SchoolId ? `<div style="font-size: 13px; color: var(--text-muted);">School ID: ${sib.SchoolId}</div>` : ''}
                </div>
            `).join('')}
        </div>`;
    }
    
    // Display friends
    const friendsContainer = document.getElementById('friendsHistoryContainer');
    if (friends.length === 0) {
        friendsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 14px; text-align: center; margin: 0;">No friend records</p>';
    } else {
        friendsContainer.innerHTML = `<div style="display: grid; gap: 12px;">
            ${friends.map(friend => `
                <div style="padding: 14px; background: white; border-left: 4px solid var(--primary); border-radius: 6px;">
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${friend.FirstName || ''} ${friend.MiddleName || ''} ${friend.LastName || ''}</div>
                    <div style="font-size: 13px; color: var(--text-muted);">In School: ${friend.In_school === 'Yes' ? '✓ Yes' : friend.In_school === 'No' ? '✗ No' : 'N/A'}</div>
                </div>
            `).join('')}
        </div>`;
    }
    
    // Display referral history
    const referralHistoryContainer = document.getElementById('referralHistoryContainer');
    if (referrals.length === 0) {
        referralHistoryContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 14px; text-align: center; margin: 0;">No referral history</p>';
    } else {
        referralHistoryContainer.innerHTML = `<div style="display: grid; gap: 12px;">
            ${referrals.map(ref => `
                <div style="padding: 14px; background: var(--gray-50); border-left: 4px solid var(--primary); border-radius: 6px;">
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 8px;">
                        <div>
                            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${ref.referral_reason || 'Referral'}</div>
                            <div style="font-size: 12px; color: var(--text-muted);">Code: ${ref.referral_code || 'N/A'}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 12px; color: var(--text-muted);"><strong>Stage:</strong> ${ref.stage || '0'}</div>
                            <div style="font-size: 12px; color: var(--text-muted);"><strong>Status:</strong> ${ref.status || 'Pending'}</div>
                        </div>
                    </div>
                    <div style="font-size: 12px; color: var(--text-muted);">Submitted: ${formatDate(ref.date_submitted)}</div>
                </div>
            `).join('')}
        </div>`;
    }
}

function filterStudents() {
    const searchTerm = document.getElementById('searchStudent').value.toLowerCase();
    const gradeFilter = document.getElementById('gradeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    let filtered = allStudents;

    const normalizeGrade = (student) => {
        const rawGrade = String(student.grade_level || student.grade_id || student.Grade || '').trim();

        if (!rawGrade) {
            return '';
        }

        const stripped = rawGrade.replace(/^grade\s*/i, '');
        return /^\d+$/.test(stripped) ? `Grade ${stripped}` : rawGrade;
    };

    if (searchTerm) {
        filtered = filtered.filter(s => 
            `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase().includes(searchTerm) ||
            String(s.email || '').toLowerCase().includes(searchTerm) ||
            String(s.StudentId || s.id || '').toLowerCase().includes(searchTerm)
        );
    }

    if (gradeFilter) {
        filtered = filtered.filter(s => normalizeGrade(s) === gradeFilter);
    }

    if (statusFilter === 'active') {
        filtered = filtered.filter(s => s.referral_count > 0);
    } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(s => s.referral_count === 0);
    }

    displayStudents(filtered);
}

function searchRecords() {
    filterStudents();
}

function clearSearch() {
    document.getElementById('searchStudent').value = '';
    document.getElementById('gradeFilter').value = '';
    document.getElementById('statusFilter').value = '';
    displayStudents(allStudents);
}

function closeStudentDetailModal() {
    // Stop the refresh interval when modal closes
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    closeModal('studentDetailModal');
}

function saveCounselingNotes() {
    alert('Note saving feature coming soon');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadStudentRecords);
