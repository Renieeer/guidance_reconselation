let caseStudents = [];
let caseDrafts = [];
let openDrawerId = null; // tracks which case's student drawer is open

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
    document.getElementById('openCaseFormBtn')?.addEventListener('click', openCaseForm);
    document.getElementById('cancelCaseFormBtn')?.addEventListener('click', cancelCaseForm);
    document.getElementById('addStudentBtn')?.addEventListener('click', addStudent);
    document.getElementById('caseCreateForm')?.addEventListener('submit', event => {
        event.preventDefault();
        saveCase();
    });
}

function openCaseForm() {
    const wrapper = document.getElementById('caseFormWrapper');
    wrapper.style.display = 'block';
    wrapper.classList.add('case-form-enter');
    document.getElementById('openCaseFormBtn').style.display = 'none';
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideCaseForm() {
    const wrapper = document.getElementById('caseFormWrapper');
    wrapper.style.display = 'none';
    wrapper.classList.remove('case-form-enter');
    document.getElementById('openCaseFormBtn').style.display = '';
}

function cancelCaseForm() {
    resetForm();
    hideCaseForm();
}

/* ---- Student involvement ---- */
function addStudent() {
    const nameInput  = document.getElementById('studentName');
    const gradeInput = document.getElementById('studentGrade');
    const roleInput  = document.getElementById('studentRole');

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

    nameInput.value  = '';
    gradeInput.value = '';
    roleInput.value  = 'Primary student';

    renderStudentList();
}

function removeStudent(id) {
    caseStudents = caseStudents.filter(s => s.id !== id);
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

    list.innerHTML = caseStudents.map(s => `
        <div class="student-item">
            <div class="student-meta">
                <strong>${escapeHtml(s.name)}</strong>
                <span>${escapeHtml(s.grade)}</span>
            </div>
            <div class="student-tags">
                <span class="tag"><i class="bi bi-person-badge"></i> ${escapeHtml(s.role)}</span>
                <button type="button" class="btn btn-outline btn-sm" onclick="removeStudent('${s.id}')">Remove</button>
            </div>
        </div>
    `).join('');
}

/* ---- Save / submit ---- */
function saveCase() {
    const payload = collectCaseData();

    if (!payload.caseCategory || !payload.caseSummary) {
        showAlert('Category and summary are required.', 'warning');
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

    showAlert('Case submitted successfully.', 'success');

    resetForm();
    hideCaseForm();
}

function collectCaseData() {
    const user   = getCurrentUser();
    const caseId = `CS-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 12)}`;

    return {
        id:               caseId,
        status:           'submitted',
        counselor:        user?.name || '',
        caseCategory:     document.getElementById('caseCategory').value,
        caseType:         document.getElementById('caseType').value,
        caseDate:         document.getElementById('caseDate').value,
        caseSummary:      document.getElementById('caseSummary').value.trim(),
        caseObjective:    document.getElementById('caseObjective').value.trim(),
        firstAction:      document.getElementById('firstAction').value.trim(),
        followUpDate:     document.getElementById('followUpDate').value,
        confidentialityAck: document.getElementById('confidentialityAck').checked,
        students:         [...caseStudents],
        createdAt:        new Date().toISOString()
    };
}

/* ---- Recent drafts table ---- */
function loadCaseDrafts() {
    caseDrafts = getData('counselor_case_records') || [];
    renderRecentCases();
}

function renderRecentCases() {
    const tbody = document.getElementById('recentCasesBody');

    if (!caseDrafts.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No saved drafts yet.</td></tr>';
        return;
    }

    tbody.innerHTML = caseDrafts.map(record => `
        <tr>
            <td><strong>${escapeHtml(record.id)}</strong></td>
            <td>${escapeHtml(record.caseSummary?.slice(0, 40) || '—')}${record.caseSummary?.length > 40 ? '…' : ''}</td>
            <td>${escapeHtml(record.caseCategory || '—')}</td>
            <td>${escapeHtml(record.caseType || '—')}</td>
            <td>${(record.students || []).length}</td>
            <td>
                ${record.status === 'confirmed'  ? '<span class="badge badge-green">Confirmed</span>' : ''}
                ${record.status === 'submitted'  ? '<span class="badge badge-amber">Submitted</span>' : ''}
            </td>
            <td>
                <button type="button" class="btn btn-outline btn-sm" onclick="toggleStudentDrawer('${record.id}')">
                    <i class="bi bi-people"></i> View students
                </button>
                <button type="button" class="btn btn-outline btn-sm" onclick="">
                    <i class="bi bi-chat-dots"></i> Follow up
                </button>
            </td>
        </tr>
        <tr class="drawer-row ${openDrawerId === record.id ? '' : 'hidden'}" id="drawerRow-${record.id}">
            <td colspan="7">
                <div class="student-drawer">
                    <div class="student-drawer-header">
                        <span><i class="bi bi-people"></i> Students involved in ${escapeHtml(record.id)}</span>
                        <button type="button" class="drawer-close" onclick="toggleStudentDrawer('${record.id}')">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                    <div class="student-drawer-grid">
                        ${(record.students || []).map(s => `
                            <div class="drawer-student-card clickable" onclick="openCounselingPanel('${record.id}', '${s.id}')">
                                <div class="cp-avatar">${initials(s.name)}</div>
                                <div>
                                    <p class="cp-name">${escapeHtml(s.name)}</p>
                                    <p class="cp-sub">${escapeHtml(s.grade)}</p>
                                    <p class="cp-sub">${escapeHtml(s.role)}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </td>
        </tr>
    `).join('');
}

function toggleStudentDrawer(caseId) {
    openDrawerId = openDrawerId === caseId ? null : caseId;
    renderRecentCases();
}

/* ---- Helpers ---- */
function initials(name) {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function resetForm() {
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

/* ---- Counseling info panel (per student, per case) ---- */
function openCounselingPanel(caseId, studentId) {
    const record = caseDrafts.find(r => r.id === caseId);
    const student = record?.students.find(s => s.id === studentId);
    if (!record || !student) return;

    record.counselingRecords = record.counselingRecords || {};
    const counseling = record.counselingRecords[studentId] || {
        category_id: record.caseCategory || '',
        scenario_id: '',
        action: '',
        reason: '',
        type: 'Individual',
        document_id: '',
        follow_id: record.followUpDate || ''
    };

    const modal = document.getElementById('counselingInfoModal');
    const body = document.getElementById('counselingInfoBody');

    body.innerHTML = `
        <div class="cp-student-info" style="margin-bottom:16px;">
            <div class="cp-avatar">${initials(student.name)}</div>
            <div>
                <p class="cp-name">${escapeHtml(student.name)}</p>
                <p class="cp-sub">${escapeHtml(student.grade)} · ${escapeHtml(student.role)}</p>
            </div>
        </div>
        <div class="form-grid two-up">
            <div class="form-field">
                <label for="ci-category">Category</label>
                <input type="text" id="ci-category" value="${escapeHtml(counseling.category_id || record.caseCategory || '')}" readonly>
            </div>
            <div class="form-field">
                <label for="ci-type">Type</label>
                <select id="ci-type">
                    <option value="Individual" ${counseling.type === 'Individual' ? 'selected' : ''}>Individual</option>
                    <option value="Group" ${counseling.type === 'Group' ? 'selected' : ''}>Group</option>
                    <option value="Family" ${counseling.type === 'Family' ? 'selected' : ''}>Family</option>
                    <option value="Peer" ${counseling.type === 'Peer' ? 'selected' : ''}>Peer</option>
                </select>
            </div>
        </div>
        <div class="form-field">
            <label for="ci-scenario">Scenario</label>
            <textarea id="ci-scenario" rows="2" placeholder="Describe the counseling scenario.">${escapeHtml(counseling.scenario_id || '')}</textarea>
        </div>
        <div class="form-field">
            <label for="ci-action">Action taken</label>
            <textarea id="ci-action" rows="2" maxlength="45" placeholder="e.g. Conducted one-on-one session">${escapeHtml(counseling.action || '')}</textarea>
        </div>
        <div class="form-field">
            <label for="ci-reason">Reason</label>
            <textarea id="ci-reason" rows="2" maxlength="45" placeholder="e.g. Reported bullying incident">${escapeHtml(counseling.reason || '')}</textarea>
        </div>
        <div class="form-grid two-up">
            <div class="form-field">
                <label for="ci-document">Supporting document</label>
                <input type="text" id="ci-document" value="${escapeHtml(counseling.document_id || '')}" placeholder="Document reference">
            </div>
            <div class="form-field">
                <label for="ci-followup">Follow-up date</label>
                <input type="date" id="ci-followup" value="${escapeHtml(counseling.follow_id || '')}">
            </div>
        </div>
    `;

    modal.dataset.caseId = caseId;
    modal.dataset.studentId = studentId;
    modal.classList.add('show');
}

function closeCounselingPanel() {
    document.getElementById('counselingInfoModal').classList.remove('show');
}

function saveCounselingInfo() {
    const modal = document.getElementById('counselingInfoModal');
    const caseId = modal.dataset.caseId;
    const studentId = modal.dataset.studentId;

    const record = caseDrafts.find(r => r.id === caseId);
    if (!record) return;

    record.counselingRecords = record.counselingRecords || {};
    record.counselingRecords[studentId] = {
        category_id: record.caseCategory || '',
        scenario_id: document.getElementById('ci-scenario').value.trim(),
        action: document.getElementById('ci-action').value.trim(),
        reason: document.getElementById('ci-reason').value.trim(),
        type: document.getElementById('ci-type').value,
        document_id: document.getElementById('ci-document').value.trim(),
        follow_id: document.getElementById('ci-followup').value
    };

    saveData('counselor_case_records', caseDrafts);
    showAlert('Counseling information saved.', 'success');
    closeCounselingPanel();
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
