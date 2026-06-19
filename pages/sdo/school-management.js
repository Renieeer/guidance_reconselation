const SCHOOL_STAFF_ENDPOINT = 'http://localhost/guidancemanagment/api/sdo-school-staff.php';

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

    toggleAssignmentFields();
    loadSchoolAssignments();
}

function toggleAssignmentFields() {
    const assignType = document.getElementById('assignType')?.value || '';

    const showCoordinator = assignType === 'coordinator' || assignType === 'both';
    const showCounselor = assignType === 'counselor' || assignType === 'both';

    const coordinatorFields = document.getElementById('coordinatorFields');
    const counselorFields = document.getElementById('counselorFields');

    if (coordinatorFields) {
        coordinatorFields.style.display = showCoordinator ? 'block' : 'none';
    }

    if (counselorFields) {
        counselorFields.style.display = showCounselor ? 'block' : 'none';
    }

    setRoleFieldsRequired('coordinator', showCoordinator);
    setRoleFieldsRequired('counselor', showCounselor);
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
}

function getRolePayload(rolePrefix) {
    return {
        firstName: document.getElementById(`${rolePrefix}FirstName`)?.value.trim() || '',
        lastName: document.getElementById(`${rolePrefix}LastName`)?.value.trim() || '',
        email: document.getElementById(`${rolePrefix}Email`)?.value.trim() || '',
        password: document.getElementById(`${rolePrefix}Password`)?.value || ''
    };
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
            counselor: getRolePayload('counselor')
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
        document.getElementById('schoolAssignmentForm').reset();
        toggleAssignmentFields();
        await loadSchoolAssignments();
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
    const tbody = document.getElementById('schoolAssignmentTableBody');
    if (!tbody) {
        return;
    }

    tbody.innerHTML = '<tr><td colspan="4" class="text-center p-5 text-muted">Loading school assignments...</td></tr>';

    try {
        const response = await fetch(SCHOOL_STAFF_ENDPOINT);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to load school assignments.');
        }

        const assignments = data.assignments || [];
        if (!assignments.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-5 text-muted">No school assignments yet.</td></tr>';
            return;
        }

        tbody.innerHTML = assignments.map(item => `
            <tr>
                <td><strong>${escapeHtml(item.schoolName)}</strong></td>
                <td>${renderPersonCell(item.coordinator)}</td>
                <td>${renderPersonCell(item.counselor)}</td>
                <td>${item.totalAssigned}</td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center p-5 text-danger">${escapeHtml(error.message || 'Unable to load school assignments.')}</td></tr>`;
    }
}

function renderPersonCell(person) {
    if (!person || !person.name) {
        return '<span class="text-muted">Not assigned</span>';
    }

    const email = person.email ? `<br><small class="text-muted">${escapeHtml(person.email)}</small>` : '';
    return `${escapeHtml(person.name)}${email}`;
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

