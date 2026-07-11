const SCHOOL_STAFF_ENDPOINT = 'http://localhost/guidancemanagment/api/sdo-school-staff.php';

// Module state for the folder grid — kept outside render functions so
// search/filter changes and data reloads don't collapse folders the SDO
// already opened.
let allAssignments = [];
let expandedSchools = new Set();
let currentFilter = 'all';
let currentSearch = '';

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

    if (!form || !assignType) {
        return;
    }

    assignType.addEventListener('change', toggleAssignmentFields);
    form.addEventListener('submit', handleSchoolAssignmentSubmit);

    initSchoolAssignmentModal();
    initSchoolFoldersToolbar();

    toggleAssignmentFields();
    loadSchoolAssignments();
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

    grid.querySelectorAll('[data-toggle-folder]').forEach(header => {
        header.addEventListener('click', () => {
            const card = header.closest('.school-folder');
            const schoolCode = header.getAttribute('data-toggle-folder');
            if (!card || !schoolCode) return;

            // Accordion: opening a folder closes whichever one was open
            // before it, so only one overlay is ever on screen at a time.
            const wasExpanded = card.classList.contains('is-expanded');

            grid.querySelectorAll('.school-folder.is-expanded').forEach(openCard => {
                openCard.classList.remove('is-expanded');
            });
            expandedSchools.clear();

            if (!wasExpanded) {
                card.classList.add('is-expanded');
                expandedSchools.add(schoolCode);
            }
        });
    });

    grid.querySelectorAll('[data-save-grade]').forEach(btn => {
        btn.addEventListener('click', () => saveInlineGrade(btn));
    });

    grid.querySelectorAll('[data-toggle-active]').forEach(btn => {
        btn.addEventListener('click', () => toggleAccountActive(btn));
    });

    grid.querySelectorAll('[data-assign-role]').forEach(btn => {
        btn.addEventListener('click', () => openAssignRoleModal(btn));
    });

    grid.querySelectorAll('[data-revoke-school]').forEach(btn => {
        btn.addEventListener('click', () => revokeSchoolAccess(btn));
    });
}

const GRADE_SELECT_OPTIONS = [
    { value: '', label: 'All grades' },
    { value: '7', label: 'Grade 7' },
    { value: '8', label: 'Grade 8' },
    { value: '9', label: 'Grade 9' },
    { value: '10', label: 'Grade 10' },
    { value: '11,12', label: 'Grades 11 & 12' },
    { value: '7,8,9,10', label: 'Grades 7-10' }
];

function buildGradeSelectOptions(selectedValue) {
    const selected = selectedValue || '';
    return GRADE_SELECT_OPTIONS.map(opt =>
        `<option value="${opt.value}" ${opt.value === selected ? 'selected' : ''}>${opt.label}</option>`
    ).join('');
}

// One folder card per school: a collapsed header (name, fill dots, account
// count) that expands into its three role slots plus the school id/revoke
// footer.
function buildFolderCard(item) {
    const roleCount = [item.coordinator, item.counselor, item.combined].filter(Boolean).length;
    const dots = [0, 1, 2].map(i =>
        `<span class="school-folder-dot ${i < roleCount ? 'is-filled' : ''}"></span>`
    ).join('');
    const isExpanded = expandedSchools.has(item.schoolCode);
    const accountLabel = item.totalAssigned === 1 ? 'account' : 'accounts';

    const cardClasses = ['school-folder'];
    if (isExpanded) cardClasses.push('is-expanded');
    if (item.totalAssigned > 0) cardClasses.push('has-staff');

    return `
        <div class="${cardClasses.join(' ')}" data-school-code="${escapeHtml(item.schoolCode)}">
            <div class="school-folder-header" data-toggle-folder="${escapeHtml(item.schoolCode)}">
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
            <div class="school-folder-body">
                ${buildRoleSlot('COORDINATOR (7-10)', item.coordinator, 'coordinator', item.schoolName)}
                ${buildRoleSlot('COUNSELOR', item.counselor, 'counselor', item.schoolName)}
                ${buildRoleSlot('COMBINED (11/12)', item.combined, 'combined', item.schoolName)}
                <div class="school-folder-footer">
                    <span class="school-folder-id">ID ${escapeHtml(String(item.schoolCode || '').toUpperCase())}</span>
                    <button type="button" class="school-folder-revoke" data-revoke-school="${escapeHtml(item.schoolCode)}">Revoke school access</button>
                </div>
            </div>
        </div>
    `;
}

// Renders one role's block inside a folder — either the assigned account
// (with an inline grade editor + activate/deactivate toggle) or an empty
// state with an "assign an account" shortcut into the modal.
function buildRoleSlot(label, person, roleKey, schoolName) {
    if (!person || !person.name) {
        return `
            <div class="school-role-slot">
                <div class="school-role-slot-header">
                    <span class="school-role-label">${label}</span>
                    <span class="badge badge-empty">Empty</span>
                </div>
                <p class="school-role-empty-text">No account assigned to this role yet.</p>
                <button type="button" class="school-role-assign-btn" data-assign-role="${roleKey}" data-school-name="${escapeHtml(schoolName)}">+ Assign an account</button>
            </div>
        `;
    }

    const isActive = person.active !== false;
    const badgeClass = isActive ? 'badge-completed' : 'badge-rejected';
    const badgeLabel = isActive ? 'Active' : 'Inactive';
    const toggleBtnClass = isActive ? 'btn-danger' : 'btn-success';
    const toggleLabel = isActive ? 'Deactivate' : 'Activate';
    const email = person.email ? `<div class="school-role-email">${escapeHtml(person.email)}</div>` : '';

    return `
        <div class="school-role-slot">
            <div class="school-role-slot-header">
                <span class="school-role-label">${label}</span>
                <span class="badge ${badgeClass}">${badgeLabel}</span>
            </div>
            <div class="school-role-name">${escapeHtml(person.name)}</div>
            ${email}
            <div class="school-role-controls">
                <select class="grade-inline-select" data-account-id="${person.accountId}">
                    ${buildGradeSelectOptions(person.grade || '')}
                </select>
                <button type="button" class="btn btn-secondary btn-sm" data-save-grade data-account-id="${person.accountId}">Save</button>
                <button type="button" class="btn ${toggleBtnClass} btn-sm" data-toggle-active data-account-id="${person.accountId}" data-active="${isActive ? '1' : '0'}">${toggleLabel}</button>
            </div>
        </div>
    `;
}

async function saveInlineGrade(btn) {
    const accountId = btn.getAttribute('data-account-id');
    const select = document.querySelector(`.grade-inline-select[data-account-id="${accountId}"]`);
    if (!accountId || !select) return;

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        const response = await fetch(SCHOOL_STAFF_ENDPOINT, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'updateGrade', accountId, grade: select.value })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to update grade assignment.');
        }
        showSchoolAssignmentAlert('Grade assignment updated.', 'success');
    } catch (error) {
        showSchoolAssignmentAlert(error.message || 'Failed to update grade assignment.', 'error');
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
        expandedSchools.delete(schoolCode);
        showSchoolAssignmentAlert('School access revoked.', 'success');
        await loadSchoolAssignments();
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
