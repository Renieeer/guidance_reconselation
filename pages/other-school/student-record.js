// Student Records Script (Combined Coordinator & Counselor)

let allStudents = [];
let currentStudent = null;
let filteredStudents = [];

function loadStudentRecords() {
    initPage();
    
    // Get user info for school filtering using robust multi-source logic
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
    
    // Fetch students from database
    fetchStudents(userSchool)
        .then(() => {
            // Add event listeners for filters
            document.getElementById('searchStudent').addEventListener('keyup', applyFilters);
            document.getElementById('gradeFilter').addEventListener('change', applyFilters);
            document.getElementById('statusFilter').addEventListener('change', applyFilters);
            displayStudentRecords(allStudents);
        })
        .catch(error => {
            console.error('Error loading students:', error);
            alert('Error loading student records. Please try again.');
        });
}

function fetchStudents(school) {
    const apiUrl = `/guidancemanagment/api/get-students.php?school=${encodeURIComponent(school)}`;
    
    return fetch(apiUrl)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                allStudents = result.data || [];
            } else {
                throw new Error(result.message || 'Failed to fetch students');
            }
        });
}

function applyFilters() {
    const searchTerm = document.getElementById('searchStudent').value.toLowerCase();
    const gradeFilter = document.getElementById('gradeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    filteredStudents = allStudents.filter(student => {
        // Search filter
        const matchesSearch = !searchTerm || 
            student.first_name.toLowerCase().includes(searchTerm) ||
            student.last_name.toLowerCase().includes(searchTerm) ||
            student.email.toLowerCase().includes(searchTerm);
        
        // Grade filter
        const studentGrade = student.grade_level ? String(student.grade_level) : '';
        const matchesGrade = !gradeFilter || studentGrade === gradeFilter;
        
        // Status filter
        let studentStatus = 'Active';
        if (student.referral_count > 0) {
            studentStatus = 'Has Cases';
        } else {
            studentStatus = 'No Cases';
        }
        const matchesStatus = !statusFilter || studentStatus === statusFilter;
        
        return matchesSearch && matchesGrade && matchesStatus;
    });

    displayStudentRecords(filteredStudents);
}

function clearFilters() {
    document.getElementById('searchStudent').value = '';
    document.getElementById('gradeFilter').value = '';
    document.getElementById('statusFilter').value = '';
    filteredStudents = allStudents;
    displayStudentRecords(allStudents);
}

function displayStudentRecords(students) {
    const tbody = document.getElementById('studentRecordsBody');

    if (students.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="4" style="text-align: center; padding: 30px; color: #999;">No student records found</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = students.map(student => {
        const status = student.referral_count > 0 ? 'Has Cases' : 'No Cases';
        const section = student.section || 'N/A';
        
        return `
            <tr>
                <td><strong>${student.first_name} ${student.last_name}</strong></td>
                <td>${student.email || 'N/A'}</td>
                <td>${section}</td>
                <td>
                    <span class="badge ${status === 'Has Cases' ? 'badge-warning' : 'badge-success'}">
                        ${status}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

function viewStudent(studentId) {
    // Get user school using robust multi-source logic
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
    
    // Fetch student details
    fetch(`/guidancemanagment/api/get-student-details.php?student_id=${studentId}&school=${encodeURIComponent(userSchool)}`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                currentStudent = result.student;
                displayStudentProfile(result);
            } else {
                alert(result.message || 'Error loading student details');
            }
        })
        .catch(error => {
            console.error('Error fetching student details:', error);
            alert('Error loading student details');
        });
}

function displayStudentProfile(data) {
    const student = data.student;
    const referrals = data.referrals || [];
    
    let profileHtml = `
        <div style="padding: 20px; background: white;">
            <h2>${student.first_name} ${student.last_name}</h2>
            <p><strong>Email:</strong> ${student.email}</p>
            <p><strong>School:</strong> ${student.school_attended}</p>
            <hr>
            <h3>Referral History</h3>
    `;
    
    if (referrals.length === 0) {
        profileHtml += '<p style="color: #999;">No referral history</p>';
    } else {
        profileHtml += '<ul>';
        referrals.forEach(ref => {
            profileHtml += `
                <li style="margin-bottom: 10px; padding: 10px; background: #f5f5f5;">
                    <strong>${ref.referral_reason}</strong><br>
                    <small>Code: ${ref.referral_code} | Stage: ${ref.stage}/6</small><br>
                    <small>Submitted: ${new Date(ref.date_submitted).toLocaleDateString()}</small>
                </li>
            `;
        });
        profileHtml += '</ul>';
    }
    
    profileHtml += '</div>';
    
    // Display in an alert or modal if you have one
    alert('Detailed view for: ' + student.first_name + ' ' + student.last_name + '\n\nReferrals: ' + referrals.length);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadStudentRecords);

