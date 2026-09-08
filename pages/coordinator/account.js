// Account Management Script for Coordinator

let currentEditingAccountId = null;
let allAccounts = [];
// Grade filter + pagination — applied client-side on top of whatever
// loadSchoolAccounts()/searchAccounts() last fetched. 'all' page size
// disables paging entirely.
let currentGradeFilter = '';
let pageSize = 20;
let currentPage = 1;
// Deactivated students are excluded server-side by default (see
// api/manage-accounts.php) — this only decides whether we ask for them.
let showInactive = false;

function initAccountPage() {
    initPage();
    loadSchoolAccounts();

    // Setup search
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchAccounts();
        }
    });

    document.getElementById('gradeFilter').addEventListener('change', (e) => {
        currentGradeFilter = e.target.value;
        currentPage = 1;
        applyFiltersAndRender();
    });

    document.getElementById('showInactiveFilter').addEventListener('change', (e) => {
        showInactive = e.target.checked;
        currentPage = 1;
        searchAccounts();
    });

    document.getElementById('pageSizeFilter').addEventListener('change', (e) => {
        pageSize = e.target.value === 'all' ? Infinity : parseInt(e.target.value, 10);
        currentPage = 1;
        applyFiltersAndRender();
    });

    document.getElementById('accountsPagination').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-page]');
        if (!btn || btn.disabled) return;
        currentPage = btn.getAttribute('data-page') === 'next' ? currentPage + 1 : currentPage - 1;
        applyFiltersAndRender();
    });

    // Setup edit form
    document.getElementById('editAccountForm').addEventListener('submit', saveAccountChanges);

    initIssueCodeModal();
}

// Coordinator-issued teacher access codes — see api/issue-teacher-access-code.php.
// The code is emailed straight to the teacher's inbox. It's only shown here
// as a fallback if that email couldn't be sent (e.g. mail is disabled).
function initIssueCodeModal() {
    const openBtn = document.getElementById('openIssueCodeModalBtn');
    const modal = document.getElementById('issueCodeModal');
    const form = document.getElementById('issueCodeForm');
    const copyBtn = document.getElementById('copyIssueCodeBtn');

    if (!openBtn || !modal || !form) {
        return;
    }

    openBtn.addEventListener('click', () => {
        resetIssueCodeModal();
        modal.classList.add('show');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeIssueCodeModal();
        }
    });

    form.addEventListener('submit', issueTeacherAccessCode);

    copyBtn?.addEventListener('click', () => {
        const codeEl = document.getElementById('issueCodeValue');
        const code = codeEl ? codeEl.textContent : '';
        if (!code) return;
        navigator.clipboard?.writeText(code).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
        }).catch(() => {});
    });
}

function resetIssueCodeModal() {
    const form = document.getElementById('issueCodeForm');
    const errorDiv = document.getElementById('issueCodeError');
    const resultDiv = document.getElementById('issueCodeResult');
    if (form) {
        form.reset();
        form.style.display = 'block';
    }
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
    }
    if (resultDiv) {
        resultDiv.style.display = 'none';
    }
}

function closeIssueCodeModal() {
    document.getElementById('issueCodeModal')?.classList.remove('show');
}

async function issueTeacherAccessCode(e) {
    e.preventDefault();

    const emailInput = document.getElementById('issueCodeEmail');
    const errorDiv = document.getElementById('issueCodeError');
    const submitBtn = document.getElementById('issueCodeSubmitBtn');
    const email = emailInput.value.trim();

    errorDiv.textContent = '';
    errorDiv.classList.remove('show');

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Generating...';

    try {
        const response = await fetch('../../api/issue-teacher-access-code.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to generate access code.');
        }

        document.getElementById('issueCodeForm').style.display = 'none';

        const statusEl = document.getElementById('issueCodeStatus');
        const fallbackEl = document.getElementById('issueCodeFallback');
        if (data.emailSent) {
            statusEl.textContent = `Access code emailed to ${email}.`;
            fallbackEl.style.display = 'none';
        } else {
            statusEl.textContent = "Couldn't email the code — copy it and give it to the teacher directly:";
            document.getElementById('issueCodeValue').textContent = data.code;
            fallbackEl.style.display = 'flex';
        }

        const expiryEl = document.getElementById('issueCodeExpiry');
        if (expiryEl && data.expiresAt) {
            const expiryDate = new Date(data.expiresAt.replace(' ', 'T'));
            expiryEl.textContent = `Expires ${expiryDate.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' })} — single use only.`;
        }
        document.getElementById('issueCodeResult').style.display = 'flex';
    } catch (error) {
        errorDiv.textContent = error.message || 'Network error. Please try again.';
        errorDiv.classList.add('show');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function getCurrentSchool() {
    const user = getCurrentUser();
    if (user.school || user.school_attended) {
        return user.school || user.school_attended;
    }
    
    try {
        const fallback = JSON.parse(localStorage.getItem('currentUser') || '{}');
        return fallback.school || fallback.school_attended || '';
    } catch (err) {
        return '';
    }
}

function formatUserType(type) {
    const typeMap = {
        'student': 'Student',
        'teacher': 'Teacher',
        'counselor': 'Counselor',
        'coordinator': 'Coordinator',
        'sdo': 'SDO',
        'other-school': 'Other School'
    };
    return typeMap[String(type || '').toLowerCase()] || type;
}

function getUserTypeBadgeClass(type) {
    const typeStr = String(type || '').toLowerCase();
    if (typeStr === 'student') return 'badge-student';
    if (typeStr === 'teacher') return 'badge-teacher';
    if (typeStr === 'counselor') return 'badge-counselor';
    if (typeStr === 'coordinator') return 'badge-coordinator';
    return 'badge-student';
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function loadSchoolAccounts() {
    const school = getCurrentSchool();
    
    if (!school) {
        showAlert('School information not found', 'error');
        return;
    }

    let apiUrl = `../../api/manage-accounts.php?school=${encodeURIComponent(school)}`;
    if (showInactive) {
        apiUrl += '&include_inactive=1';
    }

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(result => {
            if (!result.success || !result.data) {
                throw new Error(result.message || 'Failed to load accounts');
            }

            allAccounts = result.data;
            currentPage = 1;
            applyFiltersAndRender();
        })
        .catch(error => {
            console.error('Error loading accounts:', error);
            const tbody = document.getElementById('accountsTableBody');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="7" class="no-accounts"><i class="bi bi-exclamation-triangle"></i> <p>Error: ${error.message}</p></td></tr>`;
            }
        });
}

function searchAccounts() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    const school = getCurrentSchool();

    if (!school) {
        showAlert('School information not found', 'error');
        return;
    }

    let apiUrl = `../../api/manage-accounts.php?school=${encodeURIComponent(school)}`;
    if (searchTerm) {
        apiUrl += `&search=${encodeURIComponent(searchTerm)}`;
    }
    if (showInactive) {
        apiUrl += '&include_inactive=1';
    }

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(result => {
            if (!result.success || !result.data) {
                throw new Error(result.message || 'Failed to search accounts');
            }

            allAccounts = result.data;
            currentPage = 1;
            applyFiltersAndRender();
        })
        .catch(error => {
            console.error('Error searching accounts:', error);
            showAlert('Error: ' + error.message, 'error');
        });
}

// Applies the grade filter (client-side, on top of whatever the last
// fetch returned) and pagination, then renders the current page.
// gradeScopeToList (utils.js) parses a Grade cell whether it's a single
// student grade ("10") or a comma-scoped staff list ("7,8,9,10"), so one
// check covers both — an account matches if the selected grade is
// anywhere in its Grade value.
function applyFiltersAndRender() {
    const filtered = currentGradeFilter
        ? allAccounts.filter(a => gradeScopeToList(a.Grade).includes(parseInt(currentGradeFilter, 10)))
        : allAccounts;

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = pageSize === Infinity ? 0 : (currentPage - 1) * pageSize;
    const endIdx = pageSize === Infinity ? filtered.length : Math.min(startIdx + pageSize, filtered.length);

    renderAccountsTable(filtered.slice(startIdx, endIdx));
    renderPagination(filtered.length, startIdx, endIdx, totalPages);
}

function renderPagination(totalFiltered, startIdx, endIdx, totalPages) {
    const el = document.getElementById('accountsPagination');
    if (!el) return;

    if (totalFiltered === 0 || pageSize === Infinity || totalPages <= 1) {
        el.innerHTML = '';
        return;
    }

    el.innerHTML = `
        <button type="button" class="btn btn-secondary btn-sm" data-page="prev" ${currentPage <= 1 ? 'disabled' : ''}>
            <i class="bi bi-chevron-left"></i> Prev
        </button>
        <span class="accounts-page-info">Showing ${startIdx + 1}&ndash;${endIdx} of ${totalFiltered} &middot; Page ${currentPage} of ${totalPages}</span>
        <button type="button" class="btn btn-secondary btn-sm" data-page="next" ${currentPage >= totalPages ? 'disabled' : ''}>
            Next <i class="bi bi-chevron-right"></i>
        </button>`;
}

function renderAccountsTable(accounts) {
    const tbody = document.getElementById('accountsTableBody');

    if (!accounts || accounts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="no-accounts"><i class="bi bi-inbox"></i> <p>No accounts found</p></td></tr>`;
        return;
    }

    tbody.innerHTML = accounts.map(account => {
        // is_active only applies to student accounts here — staff status is
        // an SDO-only concern (see account-status.php), so anything else
        // always reads as Active on this page.
        const isStudent = String(account.Type || '').toLowerCase() === 'student';
        const isActive = account.is_active !== 0 && account.is_active !== '0';
        const statusBadge = isStudent
            ? `<span class="user-type-badge ${isActive ? 'badge-completed' : 'badge-rejected'}">${isActive ? 'Active' : 'Inactive'}</span>`
            : '&mdash;';
        const toggleBtn = isStudent
            ? `<button class="btn ${isActive ? 'btn-danger' : 'btn-success'} btn-sm" onclick="toggleStudentActive(${account.id}, ${isActive ? 'true' : 'false'})">
                    <i class="bi ${isActive ? 'bi-person-dash' : 'bi-person-check'}"></i> ${isActive ? 'Deactivate' : 'Activate'}
                </button>`
            : '';

        return `
        <tr>
            <td><strong>${account.First_name} ${account.Last_name}</strong></td>
            <td>${account.email}</td>
            <td>
                <span class="user-type-badge ${getUserTypeBadgeClass(account.Type)}">
                    ${formatUserType(account.Type)}
                </span>
            </td>
            <td>${gradeScopeLabel(account.Grade) || '&mdash;'}</td>
            <td>${statusBadge}</td>
            <td>${formatDate(account.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="openEditModal(${account.id}, '${account.First_name}', '${account.Last_name}', '${account.email}', '${account.Type}')">
                        <i class="bi bi-pencil-square"></i> Edit
                    </button>
                    ${toggleBtn}
                </div>
            </td>
        </tr>
    `;
    }).join('');
}

// Coordinator can deactivate a student's account once they've left the
// school (transferred, graduated, dropped out) so it stops showing up in
// this list and can no longer log in (login.php gates on is_active) —
// without deleting the student's history/records. Reactivating brings it
// back into the default (non-"Show inactive") view.
function toggleStudentActive(id, currentlyActive) {
    const nextActive = !currentlyActive;
    const confirmMessage = nextActive
        ? 'Reactivate this student account? They will be able to log in again.'
        : 'Deactivate this student account? They will no longer be able to log in, and the account will be hidden from this list unless "Show inactive students" is checked.';
    if (!window.confirm(confirmMessage)) {
        return;
    }

    const school = getCurrentSchool();

    fetch('../../api/manage-accounts.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setActive', id, active: nextActive, school })
    })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(result => {
            if (!result.success) {
                throw new Error(result.message || 'Failed to update account status');
            }
            showAlert(nextActive ? 'Student account activated.' : 'Student account deactivated.', 'success');
            loadSchoolAccounts();
        })
        .catch(error => {
            console.error('Error toggling account status:', error);
            showAlert('Error: ' + error.message, 'error');
        });
}

function openEditModal(id, firstName, lastName, email, type) {
    currentEditingAccountId = id;
    
    document.getElementById('editFirstName').value = firstName;
    document.getElementById('editLastName').value = lastName;
    document.getElementById('editEmail').value = email;
    document.getElementById('editUserType').value = formatUserType(type);
    document.getElementById('editPassword').value = '';
    document.getElementById('editPasswordConfirm').value = '';
    
    document.getElementById('editAccountModal').classList.add('show');
}

function closeEditModal() {
    document.getElementById('editAccountModal').classList.remove('show');
    currentEditingAccountId = null;
    document.getElementById('editAccountForm').reset();
}

function saveAccountChanges(e) {
    e.preventDefault();
    
    if (!currentEditingAccountId) {
        showAlert('No account selected', 'error');
        return;
    }

    const firstName = document.getElementById('editFirstName').value.trim();
    const lastName = document.getElementById('editLastName').value.trim();
    const password = document.getElementById('editPassword').value.trim();
    const passwordConfirm = document.getElementById('editPasswordConfirm').value.trim();

    if (!firstName || !lastName) {
        showAlert('First name and last name are required', 'error');
        return;
    }

    if (password && passwordConfirm) {
        if (password !== passwordConfirm) {
            showAlert('Passwords do not match', 'error');
            return;
        }
        if (password.length < 6) {
            showAlert('Password must be at least 6 characters', 'error');
            return;
        }
    }

    const school = getCurrentSchool();
    
    const updateData = {
        id: currentEditingAccountId,
        first_name: firstName,
        last_name: lastName,
        school: school,
        password: password || ''
    };

    fetch('../../api/manage-accounts.php', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    })
    .then(result => {
        if (result.success) {
            showAlert('Account updated successfully!', 'success');
            closeEditModal();
            loadSchoolAccounts();
        } else {
            throw new Error(result.message || 'Failed to update account');
        }
    })
    .catch(error => {
        console.error('Error saving account:', error);
        showAlert('Error: ' + error.message, 'error');
    });
}

document.addEventListener('DOMContentLoaded', initAccountPage);

