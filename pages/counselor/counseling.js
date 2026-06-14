let caseStudents = [];
let caseDrafts = [];

document.addEventListener('DOMContentLoaded', () => {
    initPage();
    initCounselingCasePage();
});

function initCounselingCasePage() {
    const user = getCurrentUser();

    document.getElementById('assignedCounselor').value = user?.name || 'Assigned counselor';
    setTodayDate('caseDate');

    const followUpDate = document.getElementById('followUpDate');
    if (followUpDate) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        followUpDate.value = nextWeek.toISOString().split('T')[0];
    }

    loadCaseDrafts();
    bindCaseEvents();
    renderStudentList();
}

function bindCaseEvents() {
    document.getElementById('addStudentBtn')?.addEventListener('click', addStudent);
    document.getElementById('saveDraftBtn')?.addEventListener('click', () => saveCase(false));
    document.getElementById('caseCreateForm')?.addEventListener('submit', event => {
        event.preventDefault();
        saveCase(true);
    });
}

function addStudent() {
    const nameInput = document.getElementById('studentName');
    const gradeInput = document.getElementById('studentGrade');
    const roleInput = document.getElementById('studentRole');

    const name = nameInput.value.trim();
    if (!name) {
        nameInput.focus();
        showAlert('Enter a student name before adding it to the case.', 'warning');
        return;
    }

    caseStudents.push({
        id: generateId(),
        name,
        grade: gradeInput.value.trim() || 'Grade not set',
        role: roleInput.value
    });

    nameInput.value = '';
    gradeInput.value = '';
    roleInput.value = 'Primary student';

    renderStudentList();
}

function removeStudent(id) {
    caseStudents = caseStudents.filter(student => student.id !== id);
    renderStudentList();
}

function renderStudentList() {
    const list = document.getElementById('studentList');
    const pill = document.getElementById('studentCountPill');

    pill.textContent = `${caseStudents.length} ${caseStudents.length === 1 ? 'student' : 'students'}`;

    if (caseStudents.length === 0) {
        list.innerHTML = '<div class="empty-state">No students linked yet. Add at least one student to open the case.</div>';
        return;
    }

    list.innerHTML = caseStudents.map(student => `
        <div class="student-item">
            <div class="student-meta">
                <strong>${escapeHtml(student.name)}</strong>
                <span>${escapeHtml(student.grade)}</span>
            </div>
            <div class="student-tags">
                <span class="tag"><i class="bi bi-person-badge"></i> ${escapeHtml(student.role)}</span>
                <button type="button" class="btn btn-outline btn-sm" onclick="removeStudent('${student.id}')">Remove</button>
            </div>
        </div>
    `).join('');
}

function saveCase(submitNow) {
    const payload = collectCaseData(submitNow ? 'submitted' : 'draft');

    if (!payload.caseTitle || !payload.caseCategory || !payload.caseSummary) {
        showAlert('Case title, category, and summary are required.', 'warning');
        return;
    }

    if (caseStudents.length === 0) {
        showAlert('Add at least one student before saving the case.', 'warning');
        return;
    }

    const storageKey = 'counselor_case_records';
    caseDrafts = getData(storageKey) || [];

    caseDrafts.unshift(payload);
    saveData(storageKey, caseDrafts.slice(0, 10));
    renderRecentCases();

    showAlert(submitNow ? 'Case submitted successfully.' : 'Draft saved successfully.', 'success');

    if (submitNow) {
        resetForm(false);
    }
}

function collectCaseData(status) {
    const user = getCurrentUser();
    const caseId = `CS-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 12)}`;

    return {
        id: caseId,
        status,
        counselor: user?.name || '',
        caseTitle: document.getElementById('caseTitle').value.trim(),
        caseCategory: document.getElementById('caseCategory').value,
        caseType: document.getElementById('caseType').value,
        urgency: document.getElementById('urgency').value,
        caseDate: document.getElementById('caseDate').value,
        caseSummary: document.getElementById('caseSummary').value.trim(),
        caseObjective: document.getElementById('caseObjective').value.trim(),
        firstAction: document.getElementById('firstAction').value.trim(),
        followUpDate: document.getElementById('followUpDate').value,
        confidentialityAck: document.getElementById('confidentialityAck').checked,
        students: caseStudents,
        createdAt: new Date().toISOString()
    };
}

function loadCaseDrafts() {
    caseDrafts = getData('counselor_case_records') || [];
    renderRecentCases();
}

function renderRecentCases() {
    const tbody = document.getElementById('recentCasesBody');

    if (!caseDrafts.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No saved drafts yet.</td></tr>';
        return;
    }

    tbody.innerHTML = caseDrafts.map(record => `
        <tr>
            <td><strong>${escapeHtml(record.id)}</strong></td>
            <td>${escapeHtml(record.caseTitle)}</td>
            <td>${escapeHtml(record.caseCategory)}</td>
            <td>${escapeHtml(record.urgency)}</td>
            <td>${record.status === 'submitted' ? 'Submitted' : 'Draft'}</td>
        </tr>
    `).join('');
}

function resetForm(clearSavedId = true) {
    document.getElementById('caseCreateForm').reset();
    caseStudents = [];

    document.getElementById('assignedCounselor').value = getCurrentUser()?.name || 'Assigned counselor';
    setTodayDate('caseDate');

    const followUpDate = document.getElementById('followUpDate');
    if (followUpDate) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        followUpDate.value = nextWeek.toISOString().split('T')[0];
    }

    renderStudentList();
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}