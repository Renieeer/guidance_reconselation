// Student Record Script

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

function displayStudents(students) {
    const tbody = document.getElementById('recordsTableBody');

    if (students.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="9" style="text-align: center; padding: 30px; color: #999;">No student records found</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = students.map(student => `
        <tr>
            <td><strong>${student.first_name || ''} ${student.last_name || ''}</strong></td>
            <td>${student.email || 'N/A'}</td>
            <td>N/A</td>
            <td>N/A</td>
            <td>N/A</td>
            <td>${student.referral_count || 0}</td>
            <td>${student.last_referral_date ? formatDate(student.last_referral_date) : 'Never'}</td>
            <td>${student.referral_count > 0 ? '<span class="badge" style="background: #ff9800;">Active</span>' : '<span class="badge" style="background: #4caf50;">No Case</span>'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewStudentRecord(${student.id})">View</button>
            </td>
        </tr>
    `).join('');
}

function viewStudentRecord(studentId) {
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo')) || {};
    const userSchool = userInfo.school_attended || userInfo.school || '';
    
    // Fetch student details
    fetch(`/guidancemanagment/api/get-student-details.php?student_id=${studentId}&school=${encodeURIComponent(userSchool)}`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                currentStudent = result.student;
                displayStudentDetail(result);
                openModal('studentDetailModal');
            } else {
                alert(result.message || 'Error loading student details');
            }
        })
        .catch(error => {
            console.error('Error fetching student details:', error);
            alert('Error loading student details');
        });
}

function displayStudentDetail(data) {
    const student = data.student;
    const referrals = data.referrals || [];
    
    // Display student info
    document.getElementById('modalStudentName').textContent = `${student.first_name} ${student.last_name}`;
    document.getElementById('modalStudentId').textContent = student.email;
    document.getElementById('modalStudentGrade').textContent = 'N/A';
    document.getElementById('modalStudentAge').textContent = 'N/A';
    document.getElementById('modalStudentGender').textContent = 'N/A';
    
    // Display referral history
    const referralList = document.getElementById('modalReferralList');
    if (referrals.length === 0) {
        referralList.innerHTML = '<li style="color: #999;">No referral history</li>';
    } else {
        referralList.innerHTML = referrals.map(ref => `
            <li style="margin-bottom: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                <strong>${ref.referral_reason}</strong><br>
                <small>Code: ${ref.referral_code}</small><br>
                <small>Stage: ${ref.stage}/6 | Status: ${ref.status}</small><br>
                <small>Submitted: ${formatDate(ref.date_submitted)}</small>
            </li>
        `).join('');
    }
}

function filterStudents() {
    const searchTerm = document.getElementById('searchStudent').value.toLowerCase();
    const gradeFilter = document.getElementById('gradeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    let filtered = allStudents;

    if (searchTerm) {
        filtered = filtered.filter(s => 
            (s.first_name + ' ' + s.last_name).toLowerCase().includes(searchTerm) ||
            s.email.toLowerCase().includes(searchTerm)
        );
    }

    if (statusFilter === 'Active') {
        filtered = filtered.filter(s => s.referral_count > 0);
    } else if (statusFilter === 'Closed') {
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

function saveCounselingNotes() {
    alert('Note saving feature coming soon');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadStudentRecords);
