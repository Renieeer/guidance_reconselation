let caseStudents = [];
let caseDrafts   = [];
let openDrawerId = null; // tracks which case's student drawer is open
const expandedStudentGroups = new Set(); // case ids whose student list is fully expanded
let sectionData  = [];   // [{ SectionID, SectionName, categories: [{CaseId, CategoryName}] }]
const CASE_SCENARIO_API = '../../api/case-scenario.php';

// Close any open "more students" popover when clicking outside of it
document.addEventListener('click', function(e) {
    if (expandedStudentGroups.size === 0) return;
    if (e.target.closest('.drawer-student-more-wrapper')) return;
    expandedStudentGroups.clear();
    renderRecentCases();
});

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

/* Returns the currently selected case section for the create-case form */
function getSelectedSectionAndCategory() {
    const secSelect = document.getElementById('caseSection');
    const section   = sectionData.find(s => String(s.SectionID) === String(secSelect?.value));
    return {
        sectionId:   secSelect?.value      || '',
        sectionName: section?.SectionName || '',
        sectionCode: section?.SectionCode || ''
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
    const gradeParam = `&grade_scope=${encodeURIComponent(getCurrentGradeScope())}`;
    let apiUrl;
    if (school) {
        apiUrl = `../../api/get-students.php?school=${encodeURIComponent(school)}&search=${encodeURIComponent(searchTerm)}&limit=8${gradeParam}`;
        statusEl.textContent = 'Searching school records...';
        statusEl.style.color = '#666';
    } else {
        // search across users_tables when school not provided
        apiUrl = `../../api/get-students.php?search=${encodeURIComponent(searchTerm)}&limit=8${gradeParam}`;
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
    document.getElementById('draftSectionFilter')?.addEventListener('change', renderRecentCases);
    document.getElementById('draftCategoryFilter')?.addEventListener('change', renderRecentCases);
    document.getElementById('draftStatusFilter')?.addEventListener('change', renderRecentCases);
    document.getElementById('clearDraftFiltersBtn')?.addEventListener('click', () => {
        const sectionSelect  = document.getElementById('draftSectionFilter');
        const categorySelect = document.getElementById('draftCategoryFilter');
        const statusSelect   = document.getElementById('draftStatusFilter');
        if (sectionSelect)  sectionSelect.value  = '';
        if (categorySelect) categorySelect.value = '';
        if (statusSelect)   statusSelect.value   = '';
        renderRecentCases();
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
            const gradeParam = `&grade_scope=${encodeURIComponent(getCurrentGradeScope())}`;
            let api;
            if (school) {
                api = `../../api/get-students.php?school=${encodeURIComponent(school)}&search=${encodeURIComponent(name)}&limit=1${gradeParam}`;
            } else {
                // search across all schools when current user has no school set
                api = `../../api/get-students.php?search=${encodeURIComponent(name)}&limit=1${gradeParam}`;
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

    if (!payload.sectionId) {
        showAlert('Please select a case section.', 'warning');
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
    const { sectionId, sectionName, sectionCode } = getSelectedSectionAndCategory();

    const caseTitle = sectionCode
        ? `${sectionCode}. ${sectionName}`
        : sectionName;

    return {
        id:               caseId,
        status:           'pending',
        counselorId:      user?.id || '',
        counselor:        user?.name || '',
        schoolAttended:   user?.school_attended || '',
        sectionId,
        sectionName,
        // Category is recorded per student later (follow-up / counseling info),
        // not at case creation.
        categoryId:       '',
        categoryName:     '',
        // Title should represent the case section/range.
        caseTitle,
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
    const gradeParam = `&grade_scope=${encodeURIComponent(getCurrentGradeScope())}`;
    const query = (school ? `?school_attended=${encodeURIComponent(school)}&limit=50` : '?limit=50') + gradeParam;

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

/* All sections/categories defined in the database (sectionData, loaded up front
   from get-case-section.php), used to populate the filters - so a section or
   category with zero cases so far still shows up and can be filtered on. */
function populateDraftSectionFilter() {
    const select = document.getElementById('draftSectionFilter');
    if (!select) return;

    const previousValue = select.value;
    const options = sectionData
        .map(s => [String(s.SectionID), s.SectionName || String(s.SectionID)])
        .sort((a, b) => a[1].localeCompare(b[1]));

    select.innerHTML = '<option value="">All sections</option>' +
        options.map(([id, name]) => `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`).join('');

    if (options.some(([id]) => id === previousValue)) {
        select.value = previousValue;
    }
}

/* Categories belong to a section (case_category.SectionID), so once a
   Section filter is picked, narrow the Category options to just that
   section's categories instead of listing every category in the school. */
function populateDraftCategoryFilter() {
    const select = document.getElementById('draftCategoryFilter');
    if (!select) return;

    const sectionFilter = document.getElementById('draftSectionFilter')?.value || '';
    const previousValue  = select.value;
    const categoryNames  = new Set();

    sectionData
        .filter(s => !sectionFilter || String(s.SectionID) === sectionFilter)
        .forEach(s => (s.categories || []).forEach(c => {
            if (c.CategoryName) categoryNames.add(c.CategoryName);
        }));

    const categories = Array.from(categoryNames).sort((a, b) => a.localeCompare(b));

    select.innerHTML = '<option value="">All categories</option>' +
        categories.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');

    if (categories.includes(previousValue)) {
        select.value = previousValue;
    }
}

/* A case's category isn't set at the case level - it's recorded per student,
   per follow-up (see saveFollowUp). This collects the distinct category
   names actually used by a case's follow-ups so filtering/display reflects
   what counselors picked, instead of the always-blank case-level field. */
function getRecordCategoryNames(record) {
    const names = new Set();
    if (record.categoryName) names.add(record.categoryName);
    (record.followUps || []).forEach(f => {
        if (f.categoryName) names.add(f.categoryName);
    });
    return Array.from(names);
}

/* Applies the section/category/status filters and sorts newest-first (by
   createdAt, falling back to the case id, which is time-ordered) for quick scanning. */
function getVisibleDrafts() {
    const sectionFilter  = document.getElementById('draftSectionFilter')?.value  || '';
    const categoryFilter = document.getElementById('draftCategoryFilter')?.value || '';
    const statusFilter   = document.getElementById('draftStatusFilter')?.value   || '';

    return caseDrafts
        .filter(record => !sectionFilter || String(record.sectionId) === sectionFilter)
        .filter(record => !categoryFilter || getRecordCategoryNames(record).includes(categoryFilter))
        .filter(record => !statusFilter || (statusFilter === 'closed' ? record.status === 'closed' : record.status !== 'closed'))
        .slice()
        .sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (bTime !== aTime) return bTime - aTime;
            return String(b.id).localeCompare(String(a.id));
        });
}

function renderRecentCases() {
    const tbody = document.getElementById('recentCasesBody');
    populateDraftSectionFilter();
    populateDraftCategoryFilter();

    if (!caseDrafts.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No saved drafts yet.</td></tr>';
        return;
    }

    const visibleDrafts = getVisibleDrafts();
    if (!visibleDrafts.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No drafts match the selected filters.</td></tr>';
        return;
    }

    tbody.innerHTML = visibleDrafts.map(record => {
        const titleDisplay    = record.sectionName  || record.caseTitle || '—';
        const recordCategories = getRecordCategoryNames(record);
        const categoryDisplay  = recordCategories.length ? recordCategories.join(', ') : '—';

        return `
        <tr>
            <td><strong>${escapeHtml(record.id)}</strong></td>
            <td>${escapeHtml(titleDisplay)}</td>
            <td>${escapeHtml(categoryDisplay)}</td>
            <td>${(record.students || []).length}</td>
            <td>
                ${record.status === 'closed' ? '<span class="badge badge-completed">Ended</span>' : '<span class="badge badge-pending">Pending</span>'}
            </td>
            <td style="display:flex;gap:8px;align-items:center;">
                <button type="button" class="btn btn-outline btn-sm" onclick="toggleStudentDrawer('${record.id}')">
                    <i class="bi bi-people"></i> View
                </button>
                ${record.status !== 'closed' ? `
                <button type="button" class="btn btn-outline btn-sm" onclick="openAppointModal('${record.id}')">
                    <i class="bi bi-calendar-plus"></i> Appoint
                </button>
                <button type="button" class="btn btn-outline btn-sm" onclick="openFollowUpModal('${record.id}')">
                    <i class="bi bi-chat-dots"></i> Follow up
                </button>
                <button type="button" class="btn btn-outline btn-sm btn-danger" onclick="endCase('${record.id}')">
                    <i class="bi bi-check-circle"></i> End case
                </button>
                ` : ''}
            </td>
        </tr>
        <tr class="drawer-row ${openDrawerId === record.id ? '' : 'hidden'}" id="drawerRow-${record.id}">
            <td colspan="6">
                <div class="student-drawer">
                    <div class="student-drawer-header">
                        <span><i class="bi bi-people"></i> Students involved in ${escapeHtml(record.id)}</span>
                        <button type="button" class="drawer-close" onclick="toggleStudentDrawer('${record.id}')">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>

                    <div class="drawer-columns">
                        <div class="student-drawer-grid">
                            ${(() => {
                                const students = record.students || [];
                                const STUDENT_PREVIEW_LIMIT = 2;
                                const isExpanded = expandedStudentGroups.has(record.id);
                                const visibleStudents = students.slice(0, STUDENT_PREVIEW_LIMIT);
                                const hiddenStudents = students.slice(STUDENT_PREVIEW_LIMIT);

                                let html = visibleStudents.map(s => `
                                    <div class="drawer-student-card clickable" onclick="openCounselingPanel('${record.id}', '${s.id}')">
                                        <div class="cp-avatar">${initials(s.name)}</div>
                                        <div>
                                            <p class="cp-name">${escapeHtml(s.name)}</p>
                                            <p class="cp-sub">${escapeHtml(s.grade)}</p>
                                            <p class="cp-sub">${escapeHtml(s.role)}</p>
                                        </div>
                                    </div>
                                `).join('');

                                if (hiddenStudents.length > 0) {
                                    html += `
                                        <div class="drawer-student-more-wrapper">
                                            <div class="drawer-student-card drawer-student-more clickable" onclick="toggleStudentGroup('${record.id}')">
                                                <div class="cp-avatar cp-avatar-more"><i class="bi bi-folder2${isExpanded ? '-open' : ''}"></i></div>
                                                <div>
                                                    <p class="cp-name">+${hiddenStudents.length} more student${hiddenStudents.length > 1 ? 's' : ''}</p>
                                                    <p class="cp-sub">Click to view all</p>
                                                </div>
                                            </div>
                                            ${isExpanded ? `
                                                <div class="student-more-popover-backdrop" onclick="toggleStudentGroup('${record.id}')"></div>
                                                <div class="student-more-popover" onclick="event.stopPropagation()">
                                                    <div class="student-more-popover-header">
                                                        <span>${hiddenStudents.length} more student${hiddenStudents.length > 1 ? 's' : ''}</span>
                                                        <button type="button" class="drawer-close" onclick="toggleStudentGroup('${record.id}')">
                                                            <i class="bi bi-x-lg"></i>
                                                        </button>
                                                    </div>
                                                    <div class="student-more-popover-list">
                                                        ${hiddenStudents.map(s => `
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
                                            ` : ''}
                                        </div>
                                    `;
                                }

                                return html;
                            })()}
                        </div>

                        <div class="drawer-case-summary">
                            <div class="drawer-case-field">
                                <span class="drawer-case-label">Section</span>
                                <span class="drawer-case-value">${escapeHtml(record.sectionName || '—')}</span>
                            </div>
                            <div class="drawer-case-field">
                                <span class="drawer-case-label">Summary of concern</span>
                                <span class="drawer-case-value">${escapeHtml(record.caseSummary || '—')}</span>
                            </div>
                            <div class="drawer-case-field">
                                <span class="drawer-case-label">Counseling objective</span>
                                <span class="drawer-case-value">${escapeHtml(record.caseObjective || '—')}</span>
                            </div>
                            <div class="drawer-case-field">
                                <span class="drawer-case-label">Initial action plan</span>
                                <span class="drawer-case-value">${escapeHtml(record.firstAction || '—')}</span>
                            </div>
                        </div>
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

function toggleStudentGroup(caseId) {
    if (expandedStudentGroups.has(caseId)) {
        expandedStudentGroups.delete(caseId);
    } else {
        expandedStudentGroups.add(caseId);
    }
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
        document_id:  ''
    };

    const modal = document.getElementById('counselingInfoModal');
    const body  = document.getElementById('counselingInfoBody');

    const caseDateFormatted = record.caseDate
        ? new Date(record.caseDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : '—';

    // Category is set via the Follow-up flow, not here - show the most recent
    // follow-up's category for this student, read-only.
    const studentFollowUps = (record.followUps || []).filter(f => f.studentId === studentId);
    const latestCategoryName = studentFollowUps.length
        ? studentFollowUps[studentFollowUps.length - 1].categoryName
        : (counseling.categoryName || '');

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
                        <input type="text" id="ci-category" class="rc-form-input" value="${escapeHtml(latestCategoryName || '—')}" readonly>
                    </div>
                </div>

                <div class="rc-form-field">
                    <label class="rc-form-label">DESCRIPTIONS</label>
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

                <div class="rc-form-field">
                    <label class="rc-form-label">SUPPORTING DOCUMENT</label>
                    <input type="text" id="ci-document" class="rc-form-input" value="${escapeHtml(counseling.document_id || '')}" placeholder="Document reference">
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
                    // Some records have the mother/father's info entered under the
                    // guardian table instead of the dedicated parent record (with
                    // Relationship set to "mother"/"father"). Route it to the right
                    // field instead of letting it default into Contact.
                    const guardianRelationship = (json.guardian_Relationship || '').trim().toLowerCase();
                    const guardianIsMother = guardianRelationship === 'mother';
                    const guardianIsFather = guardianRelationship === 'father';

                    setIfEmpty('ci-age', computeAgeFromDate(s.BirthDate || s.birthdate || s.Birth_Date || s.Birthdate));
                    setIfEmpty('ci-address', s.Address || json.father_Address || json.mother_Address || json.guardian_Address || '');
                    setIfEmpty('ci-mother', json.mother_name || (json.mother_FirstName ? `${json.mother_FirstName} ${json.mother_LastName || ''}`.trim() : '') || (guardianIsMother ? json.guardian_name : ''));
                    setIfEmpty('ci-father', json.father_name || (json.father_FirstName ? `${json.father_FirstName} ${json.father_LastName || ''}`.trim() : '') || (guardianIsFather ? json.guardian_name : ''));
                    setIfEmpty('ci-contact', (guardianIsMother || guardianIsFather) ? '' : (json.guardian_name || json.mother_name || json.father_name || ''));
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

    // Category is set via the Follow-up flow, not here.
    const existing = record.counselingRecords[studentId] || {};

    record.counselingRecords[studentId] = {
        categoryId:   existing.categoryId   || '',
        categoryName: existing.categoryName || '',
        scenario_id:  document.getElementById('ci-scenario')?.value.trim()  || '',
        action:       document.getElementById('ci-action')?.value.trim()    || '',
        reason:       document.getElementById('ci-reason')?.value.trim()    || '',
        document_id:  document.getElementById('ci-document')?.value.trim() || '',
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

/* ---- Follow-up modal ----
   Category and date are recorded once per follow-up session and apply to
   every student in the case; the note underneath each student is theirs
   individually. Saved via api/follow-up.php into the follow_up (session)
   and follow_up_note (per-student note) tables, not the old followUps
   JSON blob. */
const FOLLOW_UP_API = '../../api/follow-up.php';

// How many students show as tiles before the rest collapse into a
// "+N more" tile — matches STUDENT_PREVIEW_LIMIT used by the "View
// students" drawer elsewhere on this page, for the same reason (a case
// can have far more students than comfortably fit in one form).
const FOLLOW_UP_PREVIEW_LIMIT = 2;

function renderFollowUpNoteTile(record, s, autoExpand) {
    const existing = (record.followUps || []).filter(f => f.studentId === s.id);
    const last     = existing[existing.length - 1];
    const hasNote  = !!(last?.initialAction || '').trim();

    return `
    <div class="fu-note-tile ${autoExpand && hasNote ? 'expanded' : ''}">
        <button type="button" class="fu-note-tile-header" onclick="toggleFollowUpNoteTile(this)">
            <div class="fu-student-avatar">${initials(s.name)}</div>
            <div class="fu-note-tile-meta">
                <span class="fu-note-tile-name">${escapeHtml(s.name)}</span>
                <span class="fu-note-tile-sub">${escapeHtml(s.grade)}</span>
            </div>
            ${hasNote ? '<span class="fu-recorded-dot" title="Has follow-up"></span>' : ''}
            <i class="bi bi-chevron-down fu-note-tile-caret"></i>
        </button>
        <div class="fu-note-tile-body">
            <textarea
                class="fu-form-textarea fu-note-textarea"
                data-student-id="${escapeHtml(s.id)}"
                data-student-name="${escapeHtml(s.name)}"
                rows="3"
                placeholder="Note for ${escapeHtml(s.name)}…"
            >${escapeHtml(last?.initialAction || '')}</textarea>
        </div>
    </div>`;
}

// Accordion behavior: opening one student's note closes whichever other
// one was open (across both the main tile list and the "+N more" popover),
// so only one note is expanded at a time instead of stacking up.
function toggleFollowUpNoteTile(headerEl) {
    const tile = headerEl.closest('.fu-note-tile');
    if (!tile) return;

    const root = tile.closest('.fu-layout-single') || document;
    const shouldExpand = !tile.classList.contains('expanded');

    root.querySelectorAll('.fu-note-tile.expanded').forEach(other => {
        if (other !== tile) other.classList.remove('expanded');
    });

    tile.classList.toggle('expanded', shouldExpand);
}

function toggleFollowUpMorePopover(headerEl) {
    headerEl.closest('.fu-note-more-wrapper')?.classList.toggle('open');
}

function closeFollowUpMorePopover() {
    document.querySelector('.fu-note-more-wrapper.open')?.classList.remove('open');
}

function openFollowUpModal(caseId) {
    const record = caseDrafts.find(r => r.id === caseId);
    if (!record) return;

    const modal    = document.getElementById('followUpModal');
    const body     = document.getElementById('followUpBody');
    const students = record.students || [];

    // Only categories belonging to this case's section
    const sectionCategories = getCategoriesForRecord(record);
    const defaultCategoryId = record.categoryId || '';

    const visibleStudents = students.slice(0, FOLLOW_UP_PREVIEW_LIMIT);
    const hiddenStudents   = students.slice(FOLLOW_UP_PREVIEW_LIMIT);

    // At most one tile should start expanded, to match the accordion
    // behavior (opening one closes any other) — pick the first student
    // in list order who already has a saved note.
    const firstNotedStudent = students.find(s => {
        const existing = (record.followUps || []).filter(f => f.studentId === s.id);
        return !!(existing[existing.length - 1]?.initialAction || '').trim();
    });

    body.innerHTML = `
        <div class="fu-layout-single">
            <div class="fu-form-row-three">
                <div class="fu-form-field">
                    <label class="fu-form-label">SECTION</label>
                    <input type="text" class="fu-form-input" value="${escapeHtml(record.sectionName || '—')}" readonly>
                </div>
                <div class="fu-form-field">
                    <label class="fu-form-label">CATEGORY (applies to all students)</label>
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
                <label class="fu-form-label">Individual notes</label>
                <div class="fu-note-tiles">
                    ${students.length ? visibleStudents.map(s => renderFollowUpNoteTile(record, s, s === firstNotedStudent)).join('') : '<p class="empty-state" style="padding:16px;">No students linked to this case.</p>'}
                    ${hiddenStudents.length ? `
                        <div class="fu-note-more-wrapper">
                            <div class="fu-note-tile fu-note-more">
                                <button type="button" class="fu-note-tile-header" onclick="toggleFollowUpMorePopover(this)">
                                    <div class="fu-student-avatar cp-avatar-more"><i class="bi bi-folder2"></i></div>
                                    <div class="fu-note-tile-meta">
                                        <span class="fu-note-tile-name">+${hiddenStudents.length} more student${hiddenStudents.length > 1 ? 's' : ''}</span>
                                        <span class="fu-note-tile-sub">Click to add their notes</span>
                                    </div>
                                </button>
                            </div>
                            <div class="fu-note-more-popover-backdrop" onclick="closeFollowUpMorePopover()"></div>
                            <div class="fu-note-more-popover" onclick="event.stopPropagation()">
                                <div class="student-more-popover-header">
                                    <span>${hiddenStudents.length} more student${hiddenStudents.length > 1 ? 's' : ''}</span>
                                    <button type="button" class="drawer-close" onclick="closeFollowUpMorePopover()">
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                </div>
                                <div class="fu-note-more-popover-list">
                                    ${hiddenStudents.map(s => renderFollowUpNoteTile(record, s, s === firstNotedStudent)).join('')}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    modal.dataset.caseId = caseId;
    modal.classList.add('show');
}

function closeFollowUpModal() {
    document.getElementById('followUpModal').classList.remove('show');
    closeFollowUpMorePopover();
}

async function saveFollowUp() {
    const modal  = document.getElementById('followUpModal');
    const caseId = modal.dataset.caseId;
    const record = caseDrafts.find(r => r.id === caseId);
    if (!record) return;

    record.followUps = record.followUps || [];

    const catSelect = document.getElementById('fu-category');
    const catOpt    = catSelect?.selectedOptions[0];
    const date      = document.getElementById('fu-date')?.value;

    if (!catSelect?.value) {
        showAlert('Please select a category.', 'warning');
        return;
    }
    if (!isCategoryInSection(record.sectionId, catSelect.value)) {
        showAlert('Selected category does not belong to this case section.', 'warning');
        return;
    }
    if (!date) {
        showAlert('Please select a follow-up date.', 'warning');
        return;
    }

    const notes = Array.from(modal.querySelectorAll('.fu-note-textarea')).map(ta => ({
        student_id:   ta.dataset.studentId,
        student_name: ta.dataset.studentName,
        note:         ta.value.trim()
    }));

    if (!notes.length) {
        showAlert('No students linked to this case.', 'warning');
        return;
    }

    const categoryName = catOpt?.dataset.name || catOpt?.textContent || '';
    const user          = getCurrentUser();

    try {
        const res = await fetch(FOLLOW_UP_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                case_uid:       record.id,
                category_id:    catSelect.value,
                category_name:  categoryName,
                follow_up_date: date,
                counselor_id:   user?.id   || '',
                counselor_name: user?.name || '',
                notes
            })
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || `HTTP ${res.status}`);

        const recordedAt = new Date().toISOString();
        notes.forEach(n => {
            record.followUps.push({
                followUpId:    `FU-${json.data?.follow_up_id ?? Date.now()}-${n.student_id}`,
                studentId:     n.student_id,
                categoryId:    catSelect.value,
                categoryName,
                initialAction: n.note,
                followUpDate:  date,
                recordedAt
            });
        });

        saveData('counselor_case_records', caseDrafts);
        showAlert('Follow-up recorded successfully.', 'success');
        closeFollowUpModal();
        renderRecentCases();
    } catch (error) {
        console.error('Failed to save follow-up:', error);
        showAlert(`Failed to save follow-up: ${error.message}`, 'warning');
    }
}

const APPOINTMENT_REQUEST_API = '../../api/appointment-request.php';
const SCHEDULE_EVENTS_API     = '../../api/schedule-events.php';

// Appoint modal calendar state — lets the counselor see which days already
// have schedule events or booked appointments (so they can pick a vacant one)
// instead of typing a date blind.
let appointCalendarViewDate = new Date();
let appointSelectedDate     = '';
let appointScheduleEvents   = [];
let appointBookedEvents     = [];

function appointGetCurrentSchool() {
    const user = getCurrentUser();
    return user?.school_attended || '';
}

function appointGetTodayDateStr() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function appointIsWeekend(dateStr) {
    const day = new Date(`${dateStr}T00:00:00`).getDay();
    return day === 0 || day === 6;
}

async function loadAppointCalendarData() {
    const school = appointGetCurrentSchool();
    if (!school) {
        appointScheduleEvents = [];
        appointBookedEvents = [];
        return;
    }

    const month = `${appointCalendarViewDate.getFullYear()}-${String(appointCalendarViewDate.getMonth() + 1).padStart(2, '0')}`;

    try {
        const [scheduleRes, apptRes] = await Promise.all([
            fetch(`${SCHEDULE_EVENTS_API}?school=${encodeURIComponent(school)}&month=${encodeURIComponent(month)}`).then(r => r.json()),
            fetch(`${APPOINTMENT_REQUEST_API}?school=${encodeURIComponent(school)}&role=counselor`).then(r => r.json())
        ]);
        appointScheduleEvents = scheduleRes?.success ? (scheduleRes.data || []) : [];
        appointBookedEvents   = apptRes?.success ? (apptRes.data || []).filter(r => r.status !== 'rejected') : [];
    } catch (error) {
        console.error('Failed to load calendar availability:', error);
        appointScheduleEvents = [];
        appointBookedEvents = [];
    }
}

function appointEventsForDate(dateStr) {
    const schedule = appointScheduleEvents.filter(ev => {
        const start = String(ev.date || '').split('T')[0];
        const end   = String(ev.endDate || '').split('T')[0] || start;
        return start && dateStr >= start && dateStr <= end;
    });
    const appts = appointBookedEvents.filter(r => String(r.preferred_date || '').split('T')[0] === dateStr);
    return { schedule, appts };
}

function renderAppointCalendar() {
    const grid  = document.getElementById('appointCalendarGrid');
    const label = document.getElementById('appointCalendarMonth');
    if (!grid || !label) return;

    const today       = appointGetTodayDateStr();
    const year        = appointCalendarViewDate.getFullYear();
    const month       = appointCalendarViewDate.getMonth();
    const firstDay    = new Date(year, month, 1);
    const startDay    = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells  = Math.ceil((startDay + daysInMonth) / 7) * 7;

    label.textContent = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = dayNames.map(d => `<div class="appoint-mini-weekday">${d}</div>`).join('');

    for (let i = 0; i < totalCells; i++) {
        const cellDay = i - startDay + 1;
        if (cellDay < 1 || cellDay > daysInMonth) {
            html += '<div class="appoint-mini-day is-outside"></div>';
            continue;
        }

        const dateStr        = `${year}-${String(month + 1).padStart(2, '0')}-${String(cellDay).padStart(2, '0')}`;
        const { schedule, appts } = appointEventsForDate(dateStr);
        const isPast         = dateStr < today;
        const isWeekendDay   = appointIsWeekend(dateStr);
        const isDisabled     = isPast || isWeekendDay;

        const classes = ['appoint-mini-day'];
        if (dateStr === today) classes.push('is-today');
        if (isDisabled) classes.push('is-disabled');
        if (!isDisabled && (schedule.length || appts.length)) classes.push('is-busy');
        if (dateStr === appointSelectedDate) classes.push('is-selected');

        html += `<div class="${classes.join(' ')}" data-date="${dateStr}" ${isDisabled ? '' : `onclick="selectAppointDate('${dateStr}')"`}><span class="appoint-day-num">${cellDay}</span></div>`;
    }

    grid.innerHTML = html;
    renderAppointDayEvents();
}

function renderAppointDayEvents() {
    const el        = document.getElementById('appointDayEvents');
    const dateLabel = document.getElementById('appointSelectedDateLabel');

    if (dateLabel) {
        dateLabel.innerHTML = appointSelectedDate
            ? `<i class="bi bi-calendar-check"></i> ${escapeHtml(new Date(`${appointSelectedDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }))}`
            : '<i class="bi bi-calendar-x"></i> <span class="placeholder">No date selected — pick a day on the calendar</span>';
    }
    if (!el) return;

    if (!appointSelectedDate) {
        el.className = 'appoint-day-events';
        el.innerHTML = '';
        return;
    }

    const { schedule, appts } = appointEventsForDate(appointSelectedDate);
    if (!schedule.length && !appts.length) {
        el.className = 'appoint-day-events is-vacant';
        el.innerHTML = '<i class="bi bi-check-circle"></i> Fully vacant — no schedule or appointments on this day.';
        return;
    }

    const parts = [
        ...schedule.map(ev => `${escapeHtml(ev.title || 'Event')} (${ev.allDay ? 'All day' : escapeHtml(ev.time || '')})`),
        ...appts.map(a => `Appointment: ${escapeHtml(a.student_name || 'Student')} @ ${escapeHtml(a.preferred_time || '')}`)
    ];
    el.className = 'appoint-day-events is-busy-day';
    el.innerHTML = `<i class="bi bi-exclamation-circle"></i> Already booked: ${parts.join(', ')}`;
}

function selectAppointDate(dateStr) {
    appointSelectedDate = dateStr;
    renderAppointCalendar();
}

function changeAppointCalendarMonth(delta) {
    appointCalendarViewDate = new Date(appointCalendarViewDate.getFullYear(), appointCalendarViewDate.getMonth() + delta, 1);
    loadAppointCalendarData().then(renderAppointCalendar);
}

/* Appointment requests need a real numeric student id (see appointment-request.php,
   which casts to int and rejects 0). A case's student can lack one if they were
   added as a local fallback (see generateId() in addStudent) instead of a real
   DB lookup match, so those can't be appointed. */
function hasValidStudentId(student) {
    return /^\d+$/.test(String(student?.id ?? '').trim());
}

function updateAppointSelectedCount() {
    const el = document.getElementById('appointSelectedCount');
    if (!el) return;
    const count = document.querySelectorAll('.appoint-student-checkbox:checked').length;
    el.textContent = `${count} student${count === 1 ? '' : 's'} selected`;
}

function openAppointModal(caseId) {
    const record = caseDrafts.find(r => r.id === caseId);
    if (!record) return;

    const modal    = document.getElementById('appointModal');
    const body     = document.getElementById('appointBody');
    const students = record.students || [];

    appointCalendarViewDate = new Date();
    appointSelectedDate     = '';

    body.innerHTML = `
        <div class="appoint-layout">
            <div class="appoint-top-row">
                <div class="fu-student-list appoint-student-list">
                    ${students.length ? `
                    <div class="fu-select-all-row">
                        <label class="fu-select-all-label">
                            <input type="checkbox" id="appoint-select-all"> Select all (${students.length})
                        </label>
                    </div>` : ''}
                    ${students.map(s => {
                        const validId = hasValidStudentId(s);
                        return `
                        <label class="fu-student-row ${validId ? '' : 'fu-student-row--disabled'}">
                            <input type="checkbox" class="appoint-student-checkbox" value="${escapeHtml(s.id)}" data-name="${escapeHtml(s.name)}" ${validId ? '' : 'disabled'} hidden>
                            <div class="fu-student-avatar">${initials(s.name)}</div>
                            <div class="fu-student-meta">
                                <span class="fu-student-name">${escapeHtml(s.name)}</span>
                                <span class="fu-student-sub">${validId ? escapeHtml(s.grade || '—') : 'Missing student ID — cannot appoint'}</span>
                            </div>
                            <i class="bi bi-check-circle-fill fu-check-icon"></i>
                        </label>`;
                    }).join('') || '<p class="empty-state" style="padding:16px;">No students linked to this case.</p>'}
                </div>

                <div class="appoint-calendar-col">
                    <div class="appoint-calendar-header">
                        <div class="appoint-calendar-title-group">
                            <span class="appoint-calendar-eyebrow">Select a date</span>
                            <span class="appoint-calendar-title"><i class="bi bi-calendar3"></i> <span id="appointCalendarMonth"></span></span>
                        </div>
                        <div class="appoint-calendar-nav">
                            <button type="button" class="appoint-calendar-nav-btn" onclick="changeAppointCalendarMonth(-1)" aria-label="Previous month"><i class="bi bi-chevron-left"></i></button>
                            <button type="button" class="appoint-calendar-nav-btn" onclick="changeAppointCalendarMonth(1)" aria-label="Next month"><i class="bi bi-chevron-right"></i></button>
                        </div>
                    </div>
                    <div class="appoint-mini-grid" id="appointCalendarGrid"></div>
                    <div class="appoint-calendar-legend">
                        <span class="appoint-legend-item"><span class="appoint-legend-dot"></span> Booked</span>
                        <span class="appoint-legend-item"><span class="appoint-legend-ring"></span> Today</span>
                        <span class="appoint-legend-item"><span class="appoint-legend-swatch"></span> Selected</span>
                    </div>
                    <div class="appoint-day-events" id="appointDayEvents"></div>
                </div>
            </div>

            <div class="appoint-bottom-row">
                <div class="appoint-details-header">
                    <span class="appoint-section-label">Appointment details</span>
                    <div class="appoint-selected-date-chip" id="appointSelectedDateLabel"></div>
                </div>
                <div class="fu-form-row-two">
                    <div class="fu-form-field">
                        <label class="fu-form-label">Preferred time</label>
                        <input type="time" id="appoint-time" class="fu-form-input">
                    </div>
                    <div class="fu-form-field">
                        <label class="fu-form-label">Reason</label>
                        <input type="text" id="appoint-reason" class="fu-form-input" placeholder="e.g. Follow-up counseling session" value="Follow-up for case ${escapeHtml(record.id)}">
                    </div>
                </div>
                <div class="fu-form-field">
                    <label class="fu-form-label">Notes (optional)</label>
                    <textarea id="appoint-notes" class="fu-form-textarea" rows="3" placeholder="Additional context for this appointment"></textarea>
                </div>
                <p class="appoint-count-hint" id="appointSelectedCount">0 students selected</p>
            </div>
        </div>
    `;

    body.querySelectorAll('.appoint-student-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            cb.closest('.fu-student-row')?.classList.toggle('fu-student-row--active', cb.checked);
            updateAppointSelectedCount();
        });
    });

    const selectAll = document.getElementById('appoint-select-all');
    selectAll?.addEventListener('change', () => {
        body.querySelectorAll('.appoint-student-checkbox:not(:disabled)').forEach(cb => {
            cb.checked = selectAll.checked;
            cb.closest('.fu-student-row')?.classList.toggle('fu-student-row--active', cb.checked);
        });
        updateAppointSelectedCount();
    });

    modal.dataset.caseId = caseId;
    modal.classList.add('show');
    loadAppointCalendarData().then(renderAppointCalendar);
}

function closeAppointModal() {
    document.getElementById('appointModal').classList.remove('show');
    appointSelectedDate = '';
}

async function submitAppointments() {
    const body = document.getElementById('appointBody');

    const checked = Array.from(body.querySelectorAll('.appoint-student-checkbox:checked'));
    if (!checked.length) {
        showAlert('Select at least one student to appoint.', 'warning');
        return;
    }

    const date   = appointSelectedDate;
    const time   = document.getElementById('appoint-time')?.value;
    const reason = document.getElementById('appoint-reason')?.value.trim();
    const notes  = document.getElementById('appoint-notes')?.value.trim();

    if (!date) {
        showAlert('Pick a date on the calendar for this appointment.', 'warning');
        return;
    }
    if (!time || !reason) {
        showAlert('Please fill in the time and reason for the appointment.', 'warning');
        return;
    }

    const user   = getCurrentUser();
    const school = user?.school_attended || '';

    // Appointments made here are the counselor directly scheduling a
    // student (not a student requesting one), so the server auto-approves
    // them instead of leaving them pending review — see appointment-request.php.
    const results = await Promise.allSettled(checked.map(cb => fetch(APPOINTMENT_REQUEST_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            student_id:     cb.value,
            student_name:   cb.dataset.name,
            preferred_date: date,
            preferred_time: time,
            reason,
            notes,
            school,
            role:         user?.role || '',
            counselor_id: user?.id || 0
        })
    }).then(async res => {
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || `HTTP ${res.status}`);
        return json;
    })));

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed    = results.filter(r => r.status === 'rejected');

    if (succeeded) {
        showAlert(`Appointment${succeeded > 1 ? 's' : ''} requested for ${succeeded} student${succeeded > 1 ? 's' : ''}.`, 'success');
        closeAppointModal();
    }
    if (failed.length) {
        console.error('Appointment request failures:', failed.map(f => f.reason?.message));
        showAlert(`${failed.length} appointment request${failed.length > 1 ? 's' : ''} failed: ${failed[0].reason?.message || 'Unknown error'}`, 'warning');
    }
}

async function endCase(caseId) {
    const record = caseDrafts.find(r => r.id === caseId);
    if (!record) return;

    if (!confirm(`End case ${record.id}? This marks it as resolved and closes it for further follow-ups.`)) {
        return;
    }

    const previousStatus = record.status;
    record.status = 'closed';

    try {
        await persistCaseUpdate(record);
        saveData('counselor_case_records', caseDrafts);
        showAlert('Case ended successfully.', 'success');
        renderRecentCases();
    } catch (error) {
        record.status = previousStatus;
        console.error('Failed to end case:', error);
        showAlert(`Failed to end case: ${error.message}`, 'warning');
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