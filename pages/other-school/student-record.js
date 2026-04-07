// Student Records Script (Combined Coordinator & Counselor)

let allStudents = [];
let currentStudent = null;

function loadStudentRecords() {
    initPage();
    
    // Get user info for school filtering
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo')) || {};
    const userSchool = userInfo.school_attended || userInfo.school || '';
    
    // Fetch students from database
    fetchStudents(userSchool)
        .then(() => {
            document.getElementById('searchStudent').addEventListener('keyup', filterStudents);
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

function displayStudentRecords(students) {
    const tbody = document.getElementById('studentRecordsBody');

    if (students.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="6" style="text-align: center; padding: 30px; color: #999;">No student records found</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = students.map(student => `
        <tr>
            <td><strong>${student.email || 'N/A'}</strong></td>
            <td>${student.first_name} ${student.last_name}</td>
            <td>N/A</td>
            <td>${student.email || 'N/A'}</td>
            <td>${student.referral_count > 0 ? '<span class="badge badge-warning">Has Cases</span>' : '<span class="badge badge-success">No Cases</span>'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewStudent(${student.id})">View Profile</button>
            </td>
        </tr>`
    ).join('');
}

function viewStudent(studentId) {
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo')) || {};
    const userSchool = userInfo.school_attended || userInfo.school || '';
    
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

function filterStudents() {
    const searchTerm = document.getElementById('searchStudent').value.toLowerCase();
    
    let filtered = allStudents;
    
    if (searchTerm) {
        filtered = allStudents.filter(s => 
            (s.first_name + ' ' + s.last_name).toLowerCase().includes(searchTerm) ||
            s.email.toLowerCase().includes(searchTerm)
        );
    }
    
    displayStudentRecords(filtered);
}

function setupSearch() {
    document.getElementById('searchStudent').addEventListener('keyup', filterStudents);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadStudentRecords);
