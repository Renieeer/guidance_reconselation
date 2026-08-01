// School Management — overview of every school and its assigned staff.
// Defaults to a read-only view; clicking "Edit" (top-right) switches on
// per-card controls (assign/save/revoke, Add School) without leaving the page.
// Clicking a folder card opens its details in a floating modal (rather than
// expanding in place) so editing one school doesn't disturb the grid.
const SCHOOL_STAFF_ENDPOINT = '../../api/sdo-school-staff.php';

// Module state for the folder grid — kept outside render functions so
// search/filter changes and data reloads don't reset the view.
let allAssignments = [];
let currentFilter = 'all';
let currentSearch = '';
let editMode = false;
let openSchoolCode = null;

const EDIT_MODE_DESC = 'Add schools, assign coordinator/counselor accounts, and manage staff access.';
const VIEW_MODE_DESC = "A read-only overview of every school in the district and who's assigned to it. Click Edit to add a school or change staff assignments.";

function initSidebarActive() {
    const url = window.location.href;
    const menuLinks = document.querySelectorAll('.sidebar-menu a');

    menuLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');

        if (href && url.includes(href)) {
            link.classList.add('active');
        }
    });
}

function initSchoolManagementPage() {
    initPage();
    initSidebarActive();

    const form = document.getElementById('schoolAssignmentForm');
    const assignType = document.getElementById('assignType');

    if (form && assignType) {
        assignType.addEventListener('change', toggleAssignmentFields);
        form.addEventListener('submit', handleSchoolAssignmentSubmit);
        toggleAssignmentFields();
    }

    initSchoolAssignmentModal();
    initSchoolDetailModal();
    initSchoolFoldersToolbar();
    initEditModeToggle();

    loadSchoolAssignments();
}

function initSchoolDetailModal() {
    const modal = document.getElementById('schoolDetailModal');
    const closeBtn = document.getElementById('closeSchoolDetailModal');
    if (!modal || !closeBtn) return;

    closeBtn.addEventListener('click', () => {
        closeModal('schoolDetailModal');
        openSchoolCode = null;
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal('schoolDetailModal');
            openSchoolCode = null;
        }
    });
}

function openSchoolDetailModal(schoolCode) {
    const item = allAssignments.find(a => a.schoolCode === schoolCode);
    if (!item) return;

    openSchoolCode = schoolCode;
    renderSchoolDetailModal(item);
    openModal('schoolDetailModal');
}

function renderSchoolDetailModal(item) {
    const titleEl = document.getElementById('schoolDetailTitle');
    const bodyEl = document.getElementById('schoolDetailBody');
    if (!titleEl || !bodyEl) return;

    titleEl.textContent = item.schoolName;
    bodyEl.innerHTML = buildSchoolDetailContent(item);
    wireSchoolDetailEvents(bodyEl);
}

// After a mutation (save grade, toggle active, save district, revoke) the
// data is reloaded from the server — if the detail modal is still open for
// that school, refresh its content in place instead of closing it.
function refreshOpenSchoolDetail() {
    if (!openSchoolCode) return;

    const item = allAssignments.find(a => a.schoolCode === openSchoolCode);
    if (!item) {
        closeModal('schoolDetailModal');
        openSchoolCode = null;
        return;
    }

    renderSchoolDetailModal(item);
}

// Single Edit / Done toggle: swaps the description text, shows/hides the
// Add School button, and re-renders the folder grid with (or without)
// per-card mutation controls.
function initEditModeToggle() {
    const toggleBtn = document.getElementById('editModeToggleBtn');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => setEditMode(!editMode));
}

function setEditMode(next) {
    editMode = next;

    const addBtn = document.getElementById('openSchoolAssignmentModalBtn');
    const toggleBtn = document.getElementById('editModeToggleBtn');
    const desc = document.getElementById('schoolManagementDesc');

    if (addBtn) {
        addBtn.hidden = !editMode;
    }

    if (toggleBtn) {
        toggleBtn.innerHTML = editMode
            ? '<i class="bi bi-check2"></i> Done Editing'
            : '<i class="bi bi-pencil-square"></i> Edit';
    }

    if (desc) {
        desc.textContent = editMode ? EDIT_MODE_DESC : VIEW_MODE_DESC;
    }

    renderFolderGrid();
    refreshOpenSchoolDetail();
}

function initSchoolAssignmentModal() {
    const modal = document.getElementById('schoolAssignmentModal');
    const openBtn = document.getElementById('openSchoolAssignmentModalBtn');
    const closeBtn = document.getElementById('closeSchoolAssignmentModal');

    if (!modal || !openBtn || !closeBtn) {
        return;
    }

    openBtn.addEventListener('click', () => {
        resetAssignmentModal();
        openModal('schoolAssignmentModal');
    });
    closeBtn.addEventListener('click', () => closeModal('schoolAssignmentModal'));

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal('schoolAssignmentModal');
        }
    });
}

function initSchoolFoldersToolbar() {
    const searchInput = document.getElementById('schoolSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentSearch = searchInput.value.trim().toLowerCase();
            renderFolderGrid();
        });
    }

    const filterGroup = document.getElementById('schoolFilterGroup');
    if (filterGroup) {
        filterGroup.addEventListener('click', (event) => {
            const btn = event.target.closest('.school-filter-btn');
            if (!btn) return;

            filterGroup.querySelectorAll('.school-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter') || 'all';
            renderFolderGrid();
        });
    }
}

function toggleAssignmentFields() {
    const assignType = document.getElementById('assignType')?.value || '';

    const showCoordinator = assignType === 'coordinator' || assignType === 'both';
    const showCounselor = assignType === 'counselor' || assignType === 'both';
    const showCombined = assignType === 'combined';

    const coordinatorFields = document.getElementById('coordinatorFields');
    const counselorFields = document.getElementById('counselorFields');
    const combinedFields = document.getElementById('combinedFields');
    const roleHint = document.getElementById('assignmentRoleHint');

    if (coordinatorFields) {
        coordinatorFields.style.display = showCoordinator ? 'block' : 'none';
    }

    if (counselorFields) {
        counselorFields.style.display = showCounselor ? 'block' : 'none';
    }

    if (combinedFields) {
        combinedFields.style.display = showCombined ? 'block' : 'none';
    }

    if (roleHint) {
        roleHint.style.display = (showCoordinator || showCounselor || showCombined) ? 'none' : 'flex';
    }

    setRoleFieldsRequired('coordinator', showCoordinator);
    setRoleFieldsRequired('counselor', showCounselor);
    setRoleFieldsRequired('combined', showCombined);
}

function setRoleFieldsRequired(rolePrefix, isRequired) {
    const ids = ['FirstName', 'LastName', 'Email', 'Password'];

    ids.forEach(suffix => {
        const element = document.getElementById(`${rolePrefix}${suffix}`);
        if (element) {
            element.required = isRequired;
            if (!isRequired) {
                element.value = '';
            }
        }
    });

    // Grade select isn't required (blank = no restriction), but reset it
    // back to default when the role block is hidden.
    const gradeEl = document.getElementById(`${rolePrefix}Grade`);
    if (gradeEl && !isRequired) {
        gradeEl.selectedIndex = 0;
    }
}

function getRolePayload(rolePrefix) {
    return {
        firstName: document.getElementById(`${rolePrefix}FirstName`)?.value.trim() || '',
        lastName: document.getElementById(`${rolePrefix}LastName`)?.value.trim() || '',
        email: document.getElementById(`${rolePrefix}Email`)?.value.trim() || '',
        password: document.getElementById(`${rolePrefix}Password`)?.value || '',
        grade: document.getElementById(`${rolePrefix}Grade`)?.value || ''
    };
}

// Puts the "Add School" modal back into its default create-a-new-school
// state. Used both when opening it fresh and after "+ Assign an account"
// on a folder left it scoped to one school/role.
function resetAssignmentModal() {
    const form = document.getElementById('schoolAssignmentForm');
    if (form) {
        form.reset();
    }

    const schoolNameInput = document.getElementById('schoolName');
    if (schoolNameInput) {
        schoolNameInput.readOnly = false;
    }

    const assignType = document.getElementById('assignType');
    if (assignType) {
        assignType.disabled = false;
    }

    const intro = document.getElementById('schoolAssignmentIntro');
    if (intro) {
        intro.textContent = 'Add a school and assign a coordinator, counselor, or both.';
    }

    toggleAssignmentFields();
}

// Opens the "Add School" modal pre-scoped to one existing school/role, so
// "+ Assign an account" on an empty folder role doesn't require re-typing
// the school name or picking the assignment type.
function openAssignRoleModal(btn) {
    const role = btn.getAttribute('data-assign-role');
    const schoolName = btn.getAttribute('data-school-name') || '';

    // This button can live inside the school detail modal — close it first
    // so the two floating panels don't stack.
    closeModal('schoolDetailModal');

    resetAssignmentModal();

    const schoolNameInput = document.getElementById('schoolName');
    if (schoolNameInput) {
        schoolNameInput.value = schoolName;
        schoolNameInput.readOnly = true;
    }

    const assignType = document.getElementById('assignType');
    if (assignType && role) {
        assignType.value = role;
        assignType.disabled = true;
    }

    const intro = document.getElementById('schoolAssignmentIntro');
    if (intro) {
        const roleLabel = role === 'combined' ? 'a combined coordinator & counselor' : `a ${role}`;
        intro.textContent = `Assign ${roleLabel} account to ${schoolName}.`;
    }

    toggleAssignmentFields();
    openModal('schoolAssignmentModal');
}

async function handleSchoolAssignmentSubmit(event) {
    event.preventDefault();

    const submitBtn = document.getElementById('schoolAssignmentSubmit');
    const originalBtnText = submitBtn ? submitBtn.textContent : 'Save School Assignment';

    const schoolName = document.getElementById('schoolName')?.value.trim() || '';
    const assignType = document.getElementById('assignType')?.value || '';

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
    }

    try {
        const payload = {
            schoolName,
            assignType,
            coordinator: getRolePayload('coordinator'),
            counselor: getRolePayload('counselor'),
            combined: getRolePayload('combined')
        };

        const response = await fetch(SCHOOL_STAFF_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to save school assignment.');
        }

        showSchoolAssignmentAlert(data.message || 'School assignment saved.', 'success');
        resetAssignmentModal();
        await loadSchoolAssignments();
        closeModal('schoolAssignmentModal');
    } catch (error) {
        showSchoolAssignmentAlert(error.message || 'Failed to save school assignment.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    }
}

async function loadSchoolAssignments() {
    const grid = document.getElementById('schoolFolderGrid');
    if (!grid) {
        return;
    }

    grid.classList.add('is-empty');
    grid.innerHTML = '<p class="text-center p-5 text-muted">Loading schools...</p>';

    try {
        const response = await fetch(SCHOOL_STAFF_ENDPOINT);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to load school assignments.');
        }

        allAssignments = data.assignments || [];
        renderFolderGrid();
    } catch (error) {
        grid.innerHTML = `<p class="text-center p-5 text-danger">${escapeHtml(error.message || 'Unable to load school assignments.')}</p>`;
    }
}

function schoolMatchesSearch(item, search) {
    if (!search) return true;

    const haystack = [
        item.schoolName,
        item.coordinator?.name, item.coordinator?.email,
        item.counselor?.name, item.counselor?.email,
        item.combined?.name, item.combined?.email
    ].filter(Boolean).join(' ').toLowerCase();

    return haystack.includes(search);
}

function renderFolderGrid() {
    const grid = document.getElementById('schoolFolderGrid');
    if (!grid) {
        return;
    }

    const filtered = allAssignments.filter(item => {
        if (currentFilter === 'with-staff' && item.totalAssigned === 0) return false;
        if (currentFilter === 'no-staff' && item.totalAssigned > 0) return false;
        return schoolMatchesSearch(item, currentSearch);
    });

    if (!filtered.length) {
        grid.classList.add('is-empty');
        grid.innerHTML = `<p class="text-center p-5 text-muted">${allAssignments.length ? 'No schools match your search.' : 'No schools yet.'}</p>`;
        return;
    }

    grid.classList.remove('is-empty');
    grid.innerHTML = filtered.map(buildFolderCard).join('');

    grid.querySelectorAll('[data-open-school]').forEach(card => {
        card.addEventListener('click', () => {
            openSchoolDetailModal(card.getAttribute('data-open-school'));
        });
    });
}

// A grade scope is a comma-separated list of grade numbers 7-12 (mirrors
// api/grade-scope.php's grade_scope_to_list()); empty means no restriction.
function parseGradeScope(grade) {
    return String(grade || '')
        .split(',')
        .map(g => parseInt(g.trim(), 10))
        .filter(g => g >= 7 && g <= 12);
}

// Mirrors api/grade-scope.php's grade_scope_label() so the read-only view
// reads naturally for any combination the checkboxes can produce, not just
// the handful of presets the old dropdown offered.
function gradeDisplayLabel(grade) {
    const grades = [...new Set(parseGradeScope(grade))].sort((a, b) => a - b);
    if (grades.length === 0) return 'All grades';
    if (grades.length === 1) return `Grade ${grades[0]}`;

    const isConsecutive = grades.every((g, i) => i === 0 || g === grades[i - 1] + 1);
    return isConsecutive
        ? `Grades ${grades[0]}-${grades[grades.length - 1]}`
        : `Grades ${grades.join(', ')}`;
}

const GRADE_CHECKBOX_VALUES = [7, 8, 9, 10, 11, 12];

function buildGradeCheckboxes(accountId, grade) {
    const selected = new Set(parseGradeScope(grade));
    const boxes = GRADE_CHECKBOX_VALUES.map(g => `
                    <label class="grade-checkbox">
                        <input type="checkbox" value="${g}" ${selected.has(g) ? 'checked' : ''}>
                        <span>${g}</span>
                    </label>`).join('');

    return `
                <div class="grade-checkbox-group" data-account-id="${accountId}">
                    ${boxes}
                    <span class="grade-checkbox-hint">Leave all unchecked to allow every grade.</span>
                </div>`;
}

// One folder card per school: a compact preview (name, fill dots, account
// count). Clicking it opens the full details in a floating modal instead of
// expanding in place, so reviewing/editing one school never disturbs the grid.
function buildFolderCard(item) {
    const roleCount = [item.coordinator, item.counselor, item.combined].filter(Boolean).length;
    const dots = [0, 1, 2].map(i =>
        `<span class="school-folder-dot ${i < roleCount ? 'is-filled' : ''}"></span>`
    ).join('');
    const accountLabel = item.totalAssigned === 1 ? 'account' : 'accounts';

    const cardClasses = ['school-folder'];
    if (item.totalAssigned > 0) cardClasses.push('has-staff');

    return `
        <div class="${cardClasses.join(' ')}" data-open-school="${escapeHtml(item.schoolCode)}">
            <div class="school-folder-header">
                <div>
                    <div class="school-folder-name">
                        <span class="school-folder-icon"><i class="bi bi-building"></i></span>
                        ${escapeHtml(item.schoolName)}
                    </div>
                    <div class="school-folder-meta">
                        <span class="school-folder-dots">${dots}</span>
                        <span class="school-folder-count">${item.totalAssigned} ${accountLabel}</span>
                    </div>
                </div>
                <i class="bi bi-chevron-right school-folder-chevron"></i>
            </div>
        </div>
    `;
}

// The school detail modal's body: the three role slots, plus (in edit mode
// only) the district editor and a revoke-access footer.
function buildSchoolDetailContent(item) {
    const districtBlock = editMode ? `
                <div class="school-role-slot">
                    <div class="school-role-slot-header">
                        <span class="school-role-label">District</span>
                    </div>
                    <p class="school-role-empty-text">Used to group this school in district-level reports. Free text — enter whatever your division calls it (e.g. "District 1").</p>
                    <div class="school-role-controls">
                        <input type="text" class="district-inline-input" data-school-code="${escapeHtml(item.schoolCode)}" value="${escapeHtml(item.district || '')}" placeholder="Unassigned">
                        <button type="button" class="btn btn-secondary btn-sm" data-save-district data-school-code="${escapeHtml(item.schoolCode)}">Save</button>
                    </div>
                </div>` : '';

    const revokeBtn = editMode
        ? `<button type="button" class="school-folder-revoke" data-revoke-school="${escapeHtml(item.schoolCode)}">Revoke school access</button>`
        : '';

    return `
        ${buildRoleSlot('COORDINATOR', item.coordinator, 'coordinator', item.schoolName)}
        ${buildRoleSlot('COUNSELOR', item.counselor, 'counselor', item.schoolName)}
        ${buildRoleSlot('COMBINED', item.combined, 'combined', item.schoolName)}
        ${districtBlock}
        <div class="school-folder-footer">
            <span class="school-folder-id">ID ${escapeHtml(String(item.schoolCode || '').toUpperCase())}</span>
            ${revokeBtn}
        </div>
    `;
}

// Wires the mutation controls inside the (freshly re-rendered) detail modal
// body. View mode renders none of these elements, so this is a no-op then.
function wireSchoolDetailEvents(container) {
    if (!editMode) return;

    container.querySelectorAll('[data-save-grade]').forEach(btn => {
        btn.addEventListener('click', () => saveInlineGrade(btn));
    });

    container.querySelectorAll('[data-save-district]').forEach(btn => {
        btn.addEventListener('click', () => saveInlineDistrict(btn));
    });

    container.querySelectorAll('[data-toggle-active]').forEach(btn => {
        btn.addEventListener('click', () => toggleAccountActive(btn));
    });

    container.querySelectorAll('[data-assign-role]').forEach(btn => {
        btn.addEventListener('click', () => openAssignRoleModal(btn));
    });

    container.querySelectorAll('[data-revoke-school]').forEach(btn => {
        btn.addEventListener('click', () => revokeSchoolAccess(btn));
    });
}

// Renders one role's block inside the detail modal. View mode: plain
// read-only text. Edit mode: a grade checkbox group + activate/deactivate,
// or an "assign an account" shortcut into the Add School modal when empty.
function buildRoleSlot(label, person, roleKey, schoolName) {
    if (!person || !person.name) {
        const assignBtn = editMode
            ? `<button type="button" class="school-role-assign-btn" data-assign-role="${roleKey}" data-school-name="${escapeHtml(schoolName)}">+ Assign an account</button>`
            : '';
        return `
            <div class="school-role-slot">
                <div class="school-role-slot-header">
                    <span class="school-role-label">${label}</span>
                    <span class="badge badge-empty">Empty</span>
                </div>
                <p class="school-role-empty-text">No account assigned to this role yet.</p>
                ${assignBtn}
            </div>
        `;
    }

    const isActive = person.active !== false;
    const badgeClass = isActive ? 'badge-completed' : 'badge-rejected';
    const badgeLabel = isActive ? 'Active' : 'Inactive';
    const email = person.email ? `<div class="school-role-email">${escapeHtml(person.email)}</div>` : '';

    const details = editMode ? (() => {
        const toggleBtnClass = isActive ? 'btn-danger' : 'btn-success';
        const toggleLabel = isActive ? 'Deactivate' : 'Activate';
        return `
            <div class="school-role-controls">
                ${buildGradeCheckboxes(person.accountId, person.grade || '')}
                <button type="button" class="btn btn-secondary btn-sm" data-save-grade data-account-id="${person.accountId}">Save</button>
                <button type="button" class="btn ${toggleBtnClass} btn-sm" data-toggle-active data-account-id="${person.accountId}" data-active="${isActive ? '1' : '0'}">${toggleLabel}</button>
            </div>
        `;
    })() : `<div class="text-sm text-muted">${gradeDisplayLabel(person.grade)}</div>`;

    return `
        <div class="school-role-slot">
            <div class="school-role-slot-header">
                <span class="school-role-label">${label}</span>
                <span class="badge ${badgeClass}">${badgeLabel}</span>
            </div>
            <div class="school-role-name">${escapeHtml(person.name)}</div>
            ${email}
            ${details}
        </div>
    `;
}

async function saveInlineGrade(btn) {
    const accountId = btn.getAttribute('data-account-id');
    const group = document.querySelector(`.grade-checkbox-group[data-account-id="${accountId}"]`);
    if (!accountId || !group) return;

    const grade = Array.from(group.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value)
        .join(',');

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        const response = await fetch(SCHOOL_STAFF_ENDPOINT, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'updateGrade', accountId, grade })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to update grade assignment.');
        }
        showSchoolAssignmentAlert('Grade assignment updated.', 'success');
        await loadSchoolAssignments();
        refreshOpenSchoolDetail();
    } catch (error) {
        showSchoolAssignmentAlert(error.message || 'Failed to update grade assignment.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

async function saveInlineDistrict(btn) {
    const schoolCode = btn.getAttribute('data-school-code');
    const input = document.querySelector(`.district-inline-input[data-school-code="${schoolCode}"]`);
    if (!schoolCode || !input) return;

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        const response = await fetch(SCHOOL_STAFF_ENDPOINT, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'updateDistrict', schoolCode, district: input.value.trim() })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to update district assignment.');
        }
        showSchoolAssignmentAlert('District assignment updated.', 'success');
        await loadSchoolAssignments();
        refreshOpenSchoolDetail();
    } catch (error) {
        showSchoolAssignmentAlert(error.message || 'Failed to update district assignment.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

async function toggleAccountActive(btn) {
    const accountId = btn.getAttribute('data-account-id');
    const currentlyActive = btn.getAttribute('data-active') === '1';
    const nextActive = !currentlyActive;
    if (!accountId) return;

    const confirmMessage = nextActive
        ? 'Reactivate this account? The user will be able to log in again.'
        : 'Deactivate this account? The user will not be able to log in until reactivated.';
    if (!window.confirm(confirmMessage)) {
        return;
    }

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = nextActive ? 'Activating...' : 'Deactivating...';

    try {
        const response = await fetch(SCHOOL_STAFF_ENDPOINT, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'setActive', accountId, active: nextActive })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to update account status.');
        }
        showSchoolAssignmentAlert(nextActive ? 'Account activated.' : 'Account deactivated.', 'success');
        await loadSchoolAssignments();
        refreshOpenSchoolDetail();
    } catch (error) {
        showSchoolAssignmentAlert(error.message || 'Failed to update account status.', 'error');
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

async function revokeSchoolAccess(btn) {
    const schoolCode = btn.getAttribute('data-revoke-school');
    if (!schoolCode) return;

    if (!window.confirm('Revoke access for this school? It will be removed from this list along with its staff groupings.')) {
        return;
    }

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Revoking...';

    try {
        const response = await fetch(SCHOOL_STAFF_ENDPOINT, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'revokeSchool', schoolCode })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to revoke school access.');
        }
        showSchoolAssignmentAlert('School access revoked.', 'success');
        await loadSchoolAssignments();
        refreshOpenSchoolDetail();
    } catch (error) {
        showSchoolAssignmentAlert(error.message || 'Failed to revoke school access.', 'error');
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function showSchoolAssignmentAlert(message, type) {
    const alertBox = document.getElementById('schoolAssignAlert');
    if (!alertBox) {
        return;
    }

    alertBox.className = 'alert show';
    alertBox.classList.add(type === 'success' ? 'alert-success' : 'alert-error');
    alertBox.textContent = message;

    setTimeout(() => {
        alertBox.classList.remove('show');
    }, 4500);
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', initSchoolManagementPage);
