// Account Management Script for Coordinator

let currentEditingAccountId = null;
let allAccounts = [];

function initAccountPage() {
    initPage();
    loadSchoolAccounts();

    // Setup search
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchAccounts();
        }
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
        'counselor-and-coordinator': 'Other School (Combined)',
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
    if (typeStr === 'counselor-and-coordinator') return 'badge-coordinator';
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

    const apiUrl = `../../api/manage-accounts.php?school=${encodeURIComponent(school)}`;
    
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
            renderAccountsTable(allAccounts);
        })
        .catch(error => {
            console.error('Error loading accounts:', error);
            const tbody = document.getElementById('accountsTableBody');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="5" class="no-accounts"><i class="bi bi-exclamation-triangle"></i> <p>Error: ${error.message}</p></td></tr>`;
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
            renderAccountsTable(allAccounts);
        })
        .catch(error => {
            console.error('Error searching accounts:', error);
            showAlert('Error: ' + error.message, 'error');
        });
}

function renderAccountsTable(accounts) {
    const tbody = document.getElementById('accountsTableBody');
    
    if (!accounts || accounts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="no-accounts"><i class="bi bi-inbox"></i> <p>No accounts found</p></td></tr>`;
        return;
    }

    tbody.innerHTML = accounts.map(account => `
        <tr>
            <td><strong>${account.First_name} ${account.Last_name}</strong></td>
            <td>${account.email}</td>
            <td>
                <span class="user-type-badge ${getUserTypeBadgeClass(account.Type)}">
                    ${formatUserType(account.Type)}
                </span>
            </td>
            <td>${formatDate(account.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="openEditModal(${account.id}, '${account.First_name}', '${account.Last_name}', '${account.email}', '${account.Type}')">
                        <i class="bi bi-pencil-square"></i> Edit
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
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

