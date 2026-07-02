let caseStudents = [];
let caseDrafts   = [];
let openDrawerId = null; // tracks which case's student drawer is open
let sectionData  = [];   // [{ SectionID, SectionName, categories: [{CaseId, CategoryName}] }]
const CASE_SCENARIO_API = '../../api/case-scenario.php';

function formatGradeLabel(grade) {
    const value = String(grade ?? '').trim();
    if (!value) return '';

    if (/^grade\s*\d+$/i.test(value)) {
        return value.replace(/\s+/g, ' ').replace(/^grade/i, 'Grade');
    }

    const gradeMap = {
        '1': 'Grade 7',
        '2': 'Grade 8',
        '3': 'Grade 9',
        '4': 'Grade 10',
        '5': 'Grade 11',
        '6': 'Grade 12'
    };

    if (gradeMap[value]) {
        return gradeMap[value];
    }

    if (/^\d+$/.test(value)) {
        const numericGrade = Number(value);
        if (numericGrade >= 7 && numericGrade <= 12) {
            return `Grade ${numericGrade}`;
        }
    }

    return value;
}

document.addEventListener('DOMContentLoaded', () => {
    initPage();
    loadSectionData().then(() => initCounselingCasePage());
});

/* ---- Load sections + categories from DB ---- */
async function loadSectionData() {
    const sectionSelect = document.getElementById('caseSection');
    const categorySelect = document.getElementById('caseCategory');

    try {
        const res  = await fetch('../../api/get-case-section.php');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (json.success && Array.isArray(json.sections)) {
            sectionData = json.sections;
            populateSectionSelect();
            return;
        }

        throw new Error(json.message || 'Invalid sections payload.');
    } catch (e) {
        console.error('Failed to load section data:', e);
        if (sectionSelect) {
            sectionSelect.innerHTML = '<option value="">Failed to load sections</option>';
            sectionSelect.disabled = true;
        }
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Select a section first</option>';
            categorySelect.disabled = true;
        }
        showAlert('Failed to load case sections. Please refresh the page.', 'warning');
    }
}

function populateSectionSelect() {
    const select = document.getElementById('caseSection');
    if (!select) return;
    select.innerHTML = '<option value="">Select section</option>';
    sectionData.forEach(s => {
        const opt = document.createElement('option');
        opt.value       = s.SectionID;
        opt.textContent = s.SectionName;
        select.appendChild(opt);
    });
}

function populateCategorySelect(sectionId) {
    const select = document.getElementById('caseCategory');
    if (!select) return;

    const section = sectionData.find(s => String(s.SectionID) === String(sectionId));
    if (!section || !section.categories.length) {
        select.innerHTML = '<option value="">No categories found</option>';
        select.disabled  = true;
        return;
    }

    select.innerHTML = '<option value="">Select category</option>';
    section.categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value            = c.CaseId;
        opt.dataset.name     = c.CategoryName;
        opt.textContent      = c.CategoryName;
        select.appendChild(opt);
    });
    select.disabled = false;
}

/* Returns { sectionName, categoryName } for the current form selection */
function getSelectedSectionAndCategory() {
    const secSelect  = document.getElementById('caseSection');
    const catSelect  = document.getElementById('caseCategory');
    const section    = sectionData.find(s => String(s.SectionID) === String(secSelect?.value));
    const catOpt     = catSelect?.selectedOptions[0];
    return {
        sectionId:    secSelect?.value   || '',
        sectionName:  section?.SectionName || '',
        sectionCode:  section?.SectionCode || '',
        categoryId:   catSelect?.value   || '',
        categoryName: catOpt?.dataset.name || catOpt?.textContent || ''
    };
}

function isCategoryInSection(sectionId, categoryId) {
    const section = sectionData.find(s => String(s.SectionID) === String(sectionId));
    if (!section || !Array.isArray(section.categories)) return false;
    return section.categories.some(c => String(c.CaseId) === String(categoryId));
}

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
    setupStudentSearchCounselor();
}

// Setup student name search/autocomplete for counselor page
function setupStudentSearchCounselor() {
    const input = document.getElementById('studentName');
    if (!input) return;

    // create small status element if not present
    let status = document.getElementById('studentSearchStatus');
    if (!status) {
        status = document.createElement('div');
        status.id = 'studentSearchStatus';
        status.style.cssText = 'margin-top:6px;font-size:12px;color:#666;min-height:18px;';
        input.parentNode.insertBefore(status, input.nextSibling);
    }

    // suggestion dropdown
    let box = document.getElementById('studentSuggestionBox');
    if (!box) {
        box = document.createElement('div');
        box.id = 'studentSuggestionBox';
        box.style.cssText = 'position:relative';
        const inner = document.createElement('div');
        inner.id = 'studentSuggestionList';
        inner.style.cssText = 'position:absolute;left:0;right:0;z-index:50;background:#fff;border:1px solid #ddd;border-radius:4px;max-height:200px;overflow:auto;box-shadow:0 6px 16px rgba(0,0,0,0.08);';
        box.appendChild(inner);
        input.parentNode.insertBefore(box, status);
    }

    let timeout;
    window.counselorStudentSuggestion = null;

    input.addEventListener('input', () => {
        clearTimeout(timeout);
        const q = input.value.trim();
        status.textContent = '';
        status.style.color = '#666';
        window.counselorStudentSuggestion = null;

        if (q.length < 2) return;

        timeout = setTimeout(() => searchStudentsForSuggestionCounselor(q, input, status), 250);
    });

    let highlightedIndex = -1;
    input.addEventListener('keydown', (e) => {
        const list = document.getElementById('studentSuggestionList');
        const items = list ? Array.from(list.querySelectorAll('.suggestion-item')) : [];
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
            updateHighlight(items, highlightedIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIndex = Math.max(highlightedIndex - 1, 0);
            updateHighlight(items, highlightedIndex);
        } else if (e.key === 'Enter') {
            if (highlightedIndex >= 0 && items[highlightedIndex]) {
                e.preventDefault();
                items[highlightedIndex].click();
            }
        } else if ((e.key === 'Tab' || e.key === 'ArrowRight') && window.counselorStudentSuggestion) {
            e.preventDefault();
            const s = window.counselorStudentSuggestion;
            input.value = s.fullName;
            populateStudentFromSuggestionCounselor(s);
            window.counselorStudentSuggestion = null;
            status.textContent = `Selected: ${s.fullName}`;
            status.style.color = 'green';
        } else if (e.key === 'Escape') {
            hideSuggestions();
        }
    });

    input.addEventListener('blur', () => {
        // hide suggestion box shortly after blur
        setTimeout(() => hideSuggestions(), 200);
    });
}

function updateHighlight(items, idx) {
    items.forEach((it, i) => {
        if (i === idx) {
            it.style.background = '#f1f5ff';
        } else {
            it.style.background = '';
        }
    });
}

function hideSuggestions() {
    const list = document.getElementById('studentSuggestionList');
    if (list) list.innerHTML = '';
    window.counselorStudentSuggestion = null;
}

function searchStudentsForSuggestionCounselor(searchTerm, inputField, statusEl) {
    const user = getCurrentUser();
    let school = user?.school_attended;
    if (!school) school = localStorage.getItem('teacherSchool') || '';
    let apiUrl;
    if (school) {
        apiUrl = `/guidancemanagment/api/get-students.php?school=${encodeURIComponent(school)}&search=${encodeURIComponent(searchTerm)}&limit=8`;
        statusEl.textContent = 'Searching school records...';
        statusEl.style.color = '#666';
    } else {
        // search across users_tables when school not provided
        apiUrl = `/guidancemanagment/api/get-students.php?search=${encodeURIComponent(searchTerm)}&limit=8`;
        statusEl.textContent = 'Searching records across schools...';
        statusEl.style.color = '#666';
    }

    console.debug('Student search URL:', apiUrl);
    fetch(apiUrl)
        .then(r => {
            console.debug('get-students HTTP status:', r.status, r.statusText);
            return r.json();
        })
        .then(result => {
            console.debug('get-students response:', result);
            if (!result.success) {
                statusEl.textContent = 'Unable to check student records.';
                statusEl.style.color = '#d66';
                hideSuggestions();
                return;
            }
            const listEl = document.getElementById('studentSuggestionList');
            listEl.innerHTML = '';
            if (result.data && result.data.length > 0) {
                result.data.forEach((student, i) => {
                    const fullName = `${student.first_name || student.FirstName || ''} ${student.last_name || student.LastName || ''}`.trim();
                    const gradeLabel = formatGradeLabel(student.grade_name || student.grade_level || student.grade_id || student.Grade || '');
                    const row = document.createElement('div');
                    row.className = 'suggestion-item';
                    row.style.cssText = 'padding:8px 10px;cursor:pointer;border-bottom:1px solid #f2f2f2;';
                    row.innerHTML = `<div style="font-weight:600">${escapeHtml(fullName)}</div><div style="font-size:12px;color:#666">${escapeHtml(gradeLabel)}${student.school_attended? ' • ' + escapeHtml(student.school_attended):''}</div>`;
                    row.addEventListener('mousedown', (ev) => {
                        ev.preventDefault();
                        inputField.value = fullName;
                        populateStudentFromSuggestionCounselor(Object.assign({}, student, { fullName }));
                        statusEl.textContent = `Selected: ${fullName}`;
                        statusEl.style.color = 'green';
                        hideSuggestions();
                    });
                    listEl.appendChild(row);
                });
                // set first suggestion for quick Tab acceptance
                const first = result.data[0];
                window.counselorStudentSuggestion = Object.assign({}, first, { fullName: `${first.first_name||first.FirstName||''} ${first.last_name||first.LastName||''}`.trim() });
                statusEl.textContent = `Found ${result.data.length} match${result.data.length>1?'es':''}`;
                statusEl.style.color = 'green';
            } else {
                statusEl.textContent = 'No matching student found in school records.';
                statusEl.style.color = '#d9534f';
                window.counselorStudentSuggestion = null;
                hideSuggestions();
            }
        })
        .catch(err => {
            console.error('Error searching students:', err);
            statusEl.textContent = 'Error checking student records.';
            statusEl.style.color = '#d66';
            window.counselorStudentSuggestion = null;
        });
}

function populateStudentFromSuggestionCounselor(student) {
    if (!student) return;
    const fullName = student.fullName || `${student.first_name || student.FirstName || ''} ${student.last_name || student.LastName || ''}`.trim();
    const nameInput = document.getElementById('studentName');
    if (nameInput) nameInput.value = fullName;

    const gradeInput = document.getElementById('studentGrade');
    if (gradeInput) gradeInput.value = formatGradeLabel(student.grade_name || student.grade_level || student.grade_id || student.Grade || '');
}

function bindCaseEvents() {
    document.getElementById('openCaseFormBtn')?.addEventListener('click', openCaseForm);
    document.getElementById('cancelCaseFormBtn')?.addEventListener('click', cancelCaseForm);
    document.getElementById('addStudentBtn')?.addEventListener('click', addStudent);
    document.getElementById('caseCreateForm')?.addEventListener('submit', event => {
        event.preventDefault();
        saveCase();
    });

    // When section changes, reload category options
    document.getElementById('caseSection')?.addEventListener('change', function () {
        populateCategorySelect(this.value);
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

    // Validate student exists in DB before adding
    (async function validateAndAdd() {
        try {
            const user = getCurrentUser();
            const school = user?.school_attended || localStorage.getItem('teacherSchool') || '';
            let api;
            if (school) {
                api = `../../api/get-students.php?school=${encodeURIComponent(school)}&search=${encodeURIComponent(name)}&limit=1`;
            } else {
                // search across all schools when current user has no school set
                api = `../../api/get-students.php?search=${encodeURIComponent(name)}&limit=1`;
            }

            console.debug('Validate student API URL:', api, 'searchName:', name, 'userSchool:', school);

            const res = await fetch(api);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const json = await res.json();
            console.debug('validate student response:', json);
            if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
                console.warn('Student lookup returned no matches for:', name, json);
                showAlert('Student not found in school records. Please register the student first or correct the name.', 'warning');
                nameInput.focus();
                return;
            }

            const s = json.data[0];
            const gradeLabel = formatGradeLabel(s.grade_name || s.grade_level || s.grade_id || s.Grade || gradeInput.value.trim());

            caseStudents.push({
                id: s.id || s.StudentId || generateId(),
                name: `${s.first_name || s.FirstName || ''} ${s.last_name || s.LastName || ''}`.trim() || name,
                grade: gradeLabel || 'Grade not set',
                role: roleInput.value
            });

            nameInput.value  = '';
            gradeInput.value = '';
            roleInput.value  = 'Primary student';

            renderStudentList();
        } catch (error) {
            console.error('Failed to validate student:', error);
            showAlert('Unable to verify student at this time. Try again later.', 'warning');
        }
    })();
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
                <span>${escapeHtml(formatGradeLabel(s.grade_name || s.grade_level || s.grade_id || s.Grade || s.grade))}</span>
            </div>
            <div class="student-tags">
                <span class="tag"><i class="bi bi-person-badge"></i> ${escapeHtml(s.role)}</span>
                <button type="button" class="btn btn-outline btn-sm" onclick="removeStudent('${s.id}')">Remove</button>
            </div>
        </div>
    `).join('');
}

/* ---- Save / submit ---- */
async function saveCase() {
    const payload = collectCaseData();

    if (!payload.sectionId || !payload.categoryId) {
        showAlert('Please select both a section and a category.', 'warning');
        return;
    }
    if (!isCategoryInSection(payload.sectionId, payload.categoryId)) {
        showAlert('Selected category does not belong to the selected section.', 'warning');
        return;
    }
    if (!payload.caseSummary) {
        showAlert('Summary of concern is required.', 'warning');
        return;
    }
    if (caseStudents.length === 0) {
        showAlert('Add at least one student before saving the case.', 'warning');
        return;
    }

    try {
        const res = await fetch(CASE_SCENARIO_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', record: payload })
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
            throw new Error(json.message || `HTTP ${res.status}`);
        }

        caseDrafts.unshift(payload);
        caseDrafts = caseDrafts.slice(0, 50);
        renderRecentCases();

        showAlert('Case submitted and saved to database.', 'success');
        resetForm();
        hideCaseForm();
    } catch (error) {
        console.error('Failed to save case scenario:', error);
        showAlert(`Failed to save case scenario: ${error.message}`, 'warning');
    }
}

function collectCaseData() {
    const user = getCurrentUser();
    const caseId = `CS-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 12)}`;
    const { sectionId, sectionName, sectionCode, categoryId, categoryName } = getSelectedSectionAndCategory();

    const caseTitle = sectionCode
        ? `${sectionCode}. ${sectionName}`
        : sectionName;

    return {
        id:               caseId,
        status:           'submitted',
        counselorId:      user?.id || '',
        counselor:        user?.name || '',
        schoolAttended:   user?.school_attended || '',
        sectionId,
        sectionName,
        categoryId,
        categoryName,
        // Title should represent the case section/range.
        caseTitle,
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

/* Returns the categories that belong to this record's section */
function getCategoriesForRecord(record) {
    if (!record?.sectionId) return [];
    const section = sectionData.find(s => String(s.SectionID) === String(record.sectionId));
    return section?.categories || [];
}

/* ---- Recent drafts table ---- */
async function loadCaseDrafts() {
    const user = getCurrentUser();
    const school = user?.school_attended ? String(user.school_attended).trim() : '';
    const query = school ? `?school_attended=${encodeURIComponent(school)}&limit=50` : '?limit=50';

    try {
        const res = await fetch(`${CASE_SCENARIO_API}${query}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (!json.success || !Array.isArray(json.data)) {
            throw new Error(json.message || 'Invalid case scenario payload.');
        }

        caseDrafts = json.data;
        renderRecentCases();
    } catch (error) {
        console.error('Failed to load case scenarios from database:', error);
        caseDrafts = getData('counselor_case_records') || [];
        renderRecentCases();
        showAlert('Unable to load case scenarios from database. Showing local drafts.', 'warning');
    }
}

async function persistCaseUpdate(record) {
    const res = await fetch(CASE_SCENARIO_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', record })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
        throw new Error(json.message || `HTTP ${res.status}`);
    }
}

function renderRecentCases() {
    const tbody = document.getElementById('recentCasesBody');

    if (!caseDrafts.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No saved drafts yet.</td></tr>';
        return;
    }

    tbody.innerHTML = caseDrafts.map(record => {
        const titleDisplay    = record.sectionName  || record.caseTitle || '—';
        const categoryDisplay = record.categoryName || '—';

        return `
        <tr>
            <td><strong>${escapeHtml(record.id)}</strong></td>
            <td>${escapeHtml(titleDisplay)}</td>
            <td>${escapeHtml(categoryDisplay)}</td>
            <td>${escapeHtml(record.caseType || '—')}</td>
            <td>${(record.students || []).length}</td>
            <td>
                ${record.status === 'confirmed' ? '<span class="badge badge-green">Confirmed</span>' : ''}
                ${record.status === 'submitted' ? '<span class="badge badge-amber">Submitted</span>' : ''}
            </td>
            <td style="display:flex;gap:8px;align-items:center;">
                <button type="button" class="btn btn-outline btn-sm" onclick="toggleStudentDrawer('${record.id}')">
                    <i class="bi bi-people"></i> View students
                </button>
                <button type="button" class="btn btn-outline btn-sm" onclick="openFollowUpModal('${record.id}')">
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
    `;
    }).join('');
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
    // Reset category select back to placeholder
    const catSelect = document.getElementById('caseCategory');
    if (catSelect) {
        catSelect.innerHTML = '<option value="">Select a section first</option>';
        catSelect.disabled  = true;
    }
    renderStudentList();
}

/* ---- Counseling info panel (per student, per case) ---- */
function openCounselingPanel(caseId, studentId) {
    const record  = caseDrafts.find(r => r.id === caseId);
    const student = record?.students.find(s => s.id === studentId);
    if (!record || !student) return;

    record.counselingRecords = record.counselingRecords || {};
    const counseling = record.counselingRecords[studentId] || {
        categoryId:   record.categoryId   || '',
        categoryName: record.categoryName || '',
        scenario_id:  '',
        action:       '',
        reason:       '',
        type:         'Individual',
        document_id:  '',
        follow_id:    record.followUpDate || ''
    };

    const modal = document.getElementById('counselingInfoModal');
    const body  = document.getElementById('counselingInfoBody');

    const caseDateFormatted = record.caseDate
        ? new Date(record.caseDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : '—';

    // Build category options scoped to this record's section
    const sectionCategories = getCategoriesForRecord(record);
    const categoryOptionsHtml = sectionCategories.map(c =>
        `<option value="${escapeHtml(c.CaseId)}" data-name="${escapeHtml(c.CategoryName)}" ${counseling.categoryId === c.CaseId ? 'selected' : ''}>${escapeHtml(c.CategoryName)}</option>`
    ).join('');

    body.innerHTML = `
        <div class="rc-layout">
            <div class="rc-sidebar">
                <div class="rc-avatar-lg">${initials(student.name)}</div>
                <div class="rc-profile-rows">
                    <div class="rc-profile-row"><span class="rc-label">NAME</span><span class="rc-value">${escapeHtml(student.name)}</span></div>
                    <div class="rc-profile-row"><span class="rc-label">GRADE / SEC</span><span class="rc-value">${escapeHtml(formatGradeLabel(student.grade_name || student.grade_level || student.grade_id || student.Grade || student.grade))}</span></div>
                    <div class="rc-profile-row"><span class="rc-label">ROLE</span><span class="rc-value">${escapeHtml(student.role)}</span></div>
                    <div class="rc-profile-row"><span class="rc-label">AGE</span><span class="rc-value"><input type="text" class="rc-inline-input" id="ci-age" value="${escapeHtml(counseling.age || '')}" placeholder="—"></span></div>
                    <div class="rc-profile-row"><span class="rc-label">ADDRESS</span><span class="rc-value"><input type="text" class="rc-inline-input" id="ci-address" value="${escapeHtml(counseling.address || '')}" placeholder="—"></span></div>
                    <div class="rc-profile-row"><span class="rc-label">MOTHER</span><span class="rc-value"><input type="text" class="rc-inline-input" id="ci-mother" value="${escapeHtml(counseling.mother || '')}" placeholder="—"></span></div>
                    <div class="rc-profile-row"><span class="rc-label">CONTACT</span><span class="rc-value"><input type="text" class="rc-inline-input" id="ci-contact" value="${escapeHtml(counseling.contact || '')}" placeholder="—"></span></div>
                    <div class="rc-profile-row"><span class="rc-label">FATHER</span><span class="rc-value"><input type="text" class="rc-inline-input" id="ci-father" value="${escapeHtml(counseling.father || '')}" placeholder="—"></span></div>
                    <div class="rc-profile-row"><span class="rc-label">CONTACT NO.</span><span class="rc-value"><input type="text" class="rc-inline-input" id="ci-contactno" value="${escapeHtml(counseling.contactNo || '')}" placeholder="—"></span></div>
                </div>
                <div class="rc-sidebar-footer">
                    <div class="rc-profile-row"><span class="rc-label">PROBLEMS</span><span class="rc-value">${(record.followUps || []).filter(f => f.studentId === student.id).length} follow-ups</span></div>
                    <div class="rc-profile-row"><span class="rc-label">DATE</span><span class="rc-value">${caseDateFormatted}</span></div>
                </div>
            </div>

            <div class="rc-main">
                <div class="rc-form-row-two">
                    <div class="rc-form-field">
                        <label class="rc-form-label">SECTION</label>
                        <input type="text" id="ci-section" class="rc-form-input" value="${escapeHtml(record.sectionName || '')}" readonly>
                    </div>
                    <div class="rc-form-field">
                        <label class="rc-form-label">CATEGORY</label>
                        <select id="ci-category" class="rc-form-select">
                            <option value="">Select category</option>
                            ${categoryOptionsHtml}
                        </select>
                    </div>
                </div>
                <div class="rc-form-row-two">
                    <div class="rc-form-field">
                        <label class="rc-form-label">TYPE</label>
                        <select id="ci-type" class="rc-form-select">
                            <option value="Individual" ${counseling.type === 'Individual' ? 'selected' : ''}>Individual</option>
                            <option value="Group"      ${counseling.type === 'Group'      ? 'selected' : ''}>Group</option>
                            <option value="Family"     ${counseling.type === 'Family'     ? 'selected' : ''}>Family</option>
                            <option value="Peer"       ${counseling.type === 'Peer'       ? 'selected' : ''}>Peer</option>
                        </select>
                    </div>
                </div>

                <div class="rc-form-field">
                    <label class="rc-form-label">SCENARIO</label>
                    <textarea id="ci-scenario" class="rc-form-textarea" rows="4" placeholder="Describe the counseling scenario.">${escapeHtml(counseling.scenario_id || '')}</textarea>
                </div>

                <div class="rc-form-field">
                    <label class="rc-form-label">ACTION TAKEN</label>
                    <textarea id="ci-action" class="rc-form-textarea" rows="4" placeholder="e.g. Conducted one-on-one session">${escapeHtml(counseling.action || '')}</textarea>
                </div>

                <div class="rc-form-field">
                    <label class="rc-form-label">REASON</label>
                    <textarea id="ci-reason" class="rc-form-textarea" rows="3" placeholder="e.g. Reported bullying incident">${escapeHtml(counseling.reason || '')}</textarea>
                </div>

                <div class="rc-form-row-two">
                    <div class="rc-form-field">
                        <label class="rc-form-label">SUPPORTING DOCUMENT</label>
                        <input type="text" id="ci-document" class="rc-form-input" value="${escapeHtml(counseling.document_id || '')}" placeholder="Document reference">
                    </div>
                    <div class="rc-form-field">
                        <label class="rc-form-label">FOLLOW-UP DATE</label>
                        <input type="date" id="ci-followup" class="rc-form-input" value="${escapeHtml(counseling.follow_id || record.followUpDate || '')}">
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.dataset.caseId    = caseId;
    modal.dataset.studentId = studentId;

    // Try to auto-fill student details from backend when available.
    (async function tryPrefillStudentDetails() {
        const api = '../../api/get-student-details.php';

        // Candidate ID fields that may map to the DB student id
        const idCandidates = [student.StudentId, student.studentId, student.student_id, student.schoolStudentId, student.id];

        function setIfEmpty(elId, value) {
            try {
                const el = document.getElementById(elId);
                if (!el) return;
                if (!el.value || String(el.value).trim() === '') el.value = value || '';
            } catch (e) { /* ignore */ }
        }

        function computeAgeFromDate(d) {
            if (!d) return '';
            const bd = new Date(d);
            if (isNaN(bd)) return '';
            const now = new Date();
            let age = now.getFullYear() - bd.getFullYear();
            const m = now.getMonth() - bd.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
            return String(age);
        }

        // small inline loader appended to modal body so user sees activity
        let loader = null;
        try {
            const bodyEl = document.getElementById('counselingInfoBody');
            if (bodyEl) {
                loader = document.createElement('div');
                loader.id = 'ci-loader';
                loader.textContent = 'Loading student details…';
                loader.style.cssText = 'padding:8px 12px;font-size:13px;color:#666;opacity:0.95;';
                bodyEl.prepend(loader);
            }

            for (const sid of idCandidates) {
                if (!sid) continue;
                try {
                    const res = await fetch(`${api}?student_id=${encodeURIComponent(sid)}`);
                    if (!res.ok) continue;
                    const json = await res.json();
                    if (!json || !json.success || !json.student) continue;

                    const s = json.student || {};

                    // Only fill values when empty so user can override or type freely
                    setIfEmpty('ci-age', computeAgeFromDate(s.BirthDate || s.birthdate || s.Birth_Date || s.Birthdate));
                    setIfEmpty('ci-address', s.Address || json.father_Address || json.mother_Address || json.guardian_Address || '');
                    setIfEmpty('ci-mother', json.mother_name || (json.mother_FirstName ? `${json.mother_FirstName} ${json.mother_LastName || ''}`.trim() : ''));
                    setIfEmpty('ci-father', json.father_name || (json.father_FirstName ? `${json.father_FirstName} ${json.father_LastName || ''}`.trim() : ''));
                    setIfEmpty('ci-contact', json.guardian_name || json.mother_name || json.father_name || '');
                    setIfEmpty('ci-contactno', json.guardian_MobileNumber || json.father_ContactNumber || json.mother_ContactNumber || '');

                    // Stop after first successful match
                    break;
                } catch (e) {
                    // ignore and try next candidate
                    continue;
                }
            }
        } finally {
            try { if (loader && loader.remove) loader.remove(); } catch (e) { /* ignore */ }
        }
    })();

    modal.classList.add('show');

    const headerMeta = document.getElementById('rcHeaderMeta');
    if (headerMeta) {
        headerMeta.innerHTML = `
            <div class="rc-header-meta-item"><div class="rc-header-meta-label">Case ID</div><div class="rc-header-meta-val">${escapeHtml(record.id)}</div></div>
            <div class="rc-header-meta-item"><div class="rc-header-meta-label">Date Logged</div><div class="rc-header-meta-val">${record.caseDate ? new Date(record.caseDate + 'T00:00:00').toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'}) : '—'}</div></div>
            <div class="rc-header-meta-item"><div class="rc-header-meta-label">Counselor</div><div class="rc-header-meta-val">${escapeHtml(record.counselor || '—')}</div></div>
        `;
    }
}

function closeCounselingPanel() {
    document.getElementById('counselingInfoModal').classList.remove('show');
}

async function saveCounselingInfo() {
    const modal     = document.getElementById('counselingInfoModal');
    const caseId    = modal.dataset.caseId;
    const studentId = modal.dataset.studentId;

    const record = caseDrafts.find(r => r.id === caseId);
    if (!record) return;

    record.counselingRecords = record.counselingRecords || {};

    const catSelect  = document.getElementById('ci-category');
    const catOpt     = catSelect?.selectedOptions[0];
    if (!isCategoryInSection(record.sectionId, catSelect?.value || '')) {
        showAlert('Selected category does not belong to this case section.', 'warning');
        return;
    }

    record.counselingRecords[studentId] = {
        categoryId:   catSelect?.value               || '',
        categoryName: catOpt?.dataset.name           || catOpt?.textContent || '',
        scenario_id:  document.getElementById('ci-scenario')?.value.trim()  || '',
        action:       document.getElementById('ci-action')?.value.trim()    || '',
        reason:       document.getElementById('ci-reason')?.value.trim()    || '',
        type:         document.getElementById('ci-type')?.value             || 'Individual',
        document_id:  document.getElementById('ci-document')?.value.trim() || '',
        follow_id:    document.getElementById('ci-followup')?.value        || '',
        age:          document.getElementById('ci-age')?.value.trim()      || '',
        address:      document.getElementById('ci-address')?.value.trim()  || '',
        mother:       document.getElementById('ci-mother')?.value.trim()   || '',
        father:       document.getElementById('ci-father')?.value.trim()   || '',
        contact:      document.getElementById('ci-contact')?.value.trim()  || '',
        contactNo:    document.getElementById('ci-contactno')?.value.trim()|| '',
    };

    try {
        await persistCaseUpdate(record);
        saveData('counselor_case_records', caseDrafts);
        showAlert('Counseling information saved.', 'success');
        closeCounselingPanel();
    } catch (error) {
        console.error('Failed to update counseling info:', error);
        showAlert(`Failed to save counseling info: ${error.message}`, 'warning');
    }
}

/* ---- Follow-up modal ---- */
function openFollowUpModal(caseId) {
    const record = caseDrafts.find(r => r.id === caseId);
    if (!record) return;

    const modal    = document.getElementById('followUpModal');
    const body     = document.getElementById('followUpBody');
    const students = record.students || [];

    // Only categories belonging to this case's section
    const sectionCategories = getCategoriesForRecord(record);
    const defaultCategoryId = record.categoryId || '';

    const firstStudentId = students.length ? students[0].id : null;

    body.innerHTML = `
        <div class="fu-layout">
            <div class="fu-student-list">
                ${students.map((s, i) => {
                    const hasRecord = (record.followUps || []).some(f => f.studentId === s.id);
                    return `
                    <label class="fu-student-row ${i === 0 ? 'fu-student-row--active' : ''}" data-student-id="${s.id}">
                        <input type="radio" name="fu-selected-student" value="${s.id}" ${i === 0 ? 'checked' : ''} hidden>
                        <div class="fu-student-avatar">${initials(s.name)}</div>
                        <div class="fu-student-meta">
                            <span class="fu-student-name">${escapeHtml(s.name)}</span>
                            <span class="fu-student-sub">${escapeHtml(s.grade)}</span>
                        </div>
                        ${hasRecord ? '<span class="fu-recorded-dot" title="Has follow-up"></span>' : ''}
                    </label>`;
                }).join('')}
            </div>

            <div class="fu-form-panel">
                <div class="fu-form-row-two">
                    <div class="fu-form-field">
                        <label class="fu-form-label">SECTION</label>
                        <input type="text" class="fu-form-input" value="${escapeHtml(record.sectionName || '—')}" readonly>
                    </div>
                    <div class="fu-form-field">
                        <label class="fu-form-label">CATEGORY</label>
                        <select id="fu-category" class="fu-form-select">
                            <option value="">Select category</option>
                            ${sectionCategories.map(c =>
                                `<option value="${escapeHtml(c.CaseId)}" data-name="${escapeHtml(c.CategoryName)}" ${defaultCategoryId === c.CaseId ? 'selected' : ''}>${escapeHtml(c.CategoryName)}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="fu-form-field">
                        <label class="fu-form-label">DATE</label>
                        <input type="date" id="fu-date" class="fu-form-input" value="${record.followUpDate || ''}">
                    </div>
                </div>
                <div class="fu-form-field">
                    <label class="fu-form-label">INITIAL ACTION</label>
                    <textarea id="fu-action" class="fu-form-textarea" rows="6" placeholder="Describe the initial action taken or planned for this follow-up…"></textarea>
                </div>
            </div>
        </div>
    `;

    body.querySelectorAll('.fu-student-row').forEach(row => {
        row.addEventListener('click', () => {
            body.querySelectorAll('.fu-student-row').forEach(r => r.classList.remove('fu-student-row--active'));
            row.classList.add('fu-student-row--active');

            const sid      = row.dataset.studentId;
            const existing = (record.followUps || []).filter(f => f.studentId === sid);
            const last     = existing[existing.length - 1];

            const fuCat = document.getElementById('fu-category');
            if (fuCat) fuCat.value = last?.categoryId || defaultCategoryId;
            document.getElementById('fu-date').value   = last?.followUpDate || record.followUpDate || '';
            document.getElementById('fu-action').value = last?.initialAction || '';
        });
    });

    // Pre-fill first student's existing follow-up if any
    if (firstStudentId) {
        const existing = (record.followUps || []).filter(f => f.studentId === firstStudentId);
        const last     = existing[existing.length - 1];
        if (last) {
            const fuCat = document.getElementById('fu-category');
            if (fuCat) fuCat.value = last.categoryId || defaultCategoryId;
            document.getElementById('fu-date').value   = last.followUpDate   || record.followUpDate || '';
            document.getElementById('fu-action').value = last.initialAction  || '';
        }
    }

    modal.dataset.caseId = caseId;
    modal.classList.add('show');
}

function closeFollowUpModal() {
    document.getElementById('followUpModal').classList.remove('show');
}

async function saveFollowUp() {
    const modal  = document.getElementById('followUpModal');
    const caseId = modal.dataset.caseId;
    const record = caseDrafts.find(r => r.id === caseId);
    if (!record) return;

    record.followUps = record.followUps || [];

    const selectedRadio = modal.querySelector('input[name="fu-selected-student"]:checked');
    const catSelect     = document.getElementById('fu-category');
    const catOpt        = catSelect?.selectedOptions[0];
    const date          = document.getElementById('fu-date')?.value;
    const action        = document.getElementById('fu-action')?.value.trim();

    if (!selectedRadio) {
        showAlert('Select a student for this follow-up.', 'warning');
        return;
    }
    if (!catSelect?.value) {
        showAlert('Please select a category.', 'warning');
        return;
    }
    if (!isCategoryInSection(record.sectionId, catSelect.value)) {
        showAlert('Selected category does not belong to this case section.', 'warning');
        return;
    }

    const entry = {
        followUpId:    `FU-${Date.now()}`,
        studentId:     selectedRadio.value,
        categoryId:    catSelect.value,
        categoryName:  catOpt?.dataset.name || catOpt?.textContent || '',
        initialAction: action,
        followUpDate:  date,
        recordedAt:    new Date().toISOString()
    };

    record.followUps.push(entry);

    try {
        await persistCaseUpdate(record);
        saveData('counselor_case_records', caseDrafts);
        showAlert('Follow-up recorded successfully.', 'success');
        closeFollowUpModal();
        renderRecentCases();
    } catch (error) {
        console.error('Failed to save follow-up:', error);
        showAlert(`Failed to save follow-up: ${error.message}`, 'warning');
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}