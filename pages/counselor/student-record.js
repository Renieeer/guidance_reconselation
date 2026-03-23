// Student Record Script

let allReferrals = [];
let currentStudent = null;

function loadStudentRecords() {
    initPage();
    allReferrals = getData('referrals') || [];
    
    document.getElementById('searchStudent').addEventListener('keyup', searchRecords);
    document.getElementById('gradeFilter').addEventListener('change', searchRecords);
    document.getElementById('statusFilter').addEventListener('change', searchRecords);
    
    displayRecords(allReferrals);
}

function displayRecords(referrals) {
    // Get unique students from referrals
    const students = {};
    
    referrals.forEach(ref => {
        if (!students[ref.studentId]) {
            students[ref.studentId] = {
                studentName: ref.studentName,
                studentId: ref.studentId,
                grade: ref.grade,
                age: ref.age,
                section: ref.section,
                gender: ref.gender,
                parentGuardian: ref.parentGuardian,
                parentContact: ref.parentContact,
                referrals: [],
                lastContact: ref.dateSubmitted
            };
        }
        students[ref.studentId].referrals.push(ref);
        if (new Date(ref.dateSubmitted) > new Date(students[ref.studentId].lastContact)) {
            students[ref.studentId].lastContact = ref.dateSubmitted;
        }
    });

    const tbody = document.getElementById('recordsTableBody');
    const studentArray = Object.values(students);

    if (studentArray.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="9" style="text-align: center; padding: 30px; color: #999;">No student records found</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = studentArray.map(student => `
        <tr>
            <td><strong>${student.studentName}</strong></td>
            <td>${student.studentId}</td>
            <td>${student.grade}</td>
            <td>${student.age}</td>
            <td>${student.section}</td>
            <td><span class="badge badge-pending">${student.referrals.length}</span></td>
            <td>${formatDate(student.lastContact)}</td>
            <td>${createBadge(student.referrals.some(r => r.stage === 6) ? 'completed' : 'in-progress')}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewStudentRecord('${student.studentId}')">View</button>
            </td>
        </tr>
    `).join('');
}

function viewStudentRecord(studentId) {
    const student = allReferrals.find(r => r.studentId === studentId);
    
    if (!student) return;

    currentStudent = student;

    document.getElementById('modalStudentName').textContent = student.studentName;
    document.getElementById('modalStudentId').textContent = student.studentId;
    document.getElementById('modalStudentGrade').textContent = student.grade + ' - ' + student.section;
    document.getElementById('modalStudentAge').textContent = student.age;
    document.getElementById('modalStudentGender').textContent = student.gender;

    // Load referral history
    const studentReferrals = allReferrals.filter(r => r.studentId === studentId);
    const referralList = document.getElementById('modalReferralList');
    
    referralList.innerHTML = studentReferrals.map(ref => 
        `<li><strong>${ref.id}</strong> - ${ref.referralReason} (${formatDate(ref.dateSubmitted)})</li>`
    ).join('');

    if (studentReferrals.length === 0) {
        referralList.innerHTML = '<li>No referral history</li>';
    }

    openModal('studentDetailModal');
}

function saveCounselingNotes() {
    const notes = document.getElementById('counselingNotes').value;
    showAlert('Counseling notes saved successfully!', 'success');
    closeModal('studentDetailModal');
}

function searchRecords() {
    const searchText = document.getElementById('searchStudent').value.toLowerCase();
    const gradeFilter = document.getElementById('gradeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    let filtered = allReferrals;

    if (searchText) {
        filtered = filtered.filter(r => 
            r.studentName.toLowerCase().includes(searchText) || 
            r.studentId.toLowerCase().includes(searchText)
        );
    }

    if (gradeFilter) {
        filtered = filtered.filter(r => r.grade === gradeFilter);
    }

    if (statusFilter) {
        if (statusFilter === 'Active') {
            filtered = filtered.filter(r => r.stage !== 6);
        } else if (statusFilter === 'Closed') {
            filtered = filtered.filter(r => r.stage === 6);
        }
    }

    displayRecords(filtered);
}

function clearSearch() {
    document.getElementById('searchStudent').value = '';
    document.getElementById('gradeFilter').value = '';
    document.getElementById('statusFilter').value = '';
    displayRecords(allReferrals);
}

document.addEventListener('DOMContentLoaded', loadStudentRecords);
