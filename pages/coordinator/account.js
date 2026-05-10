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

    const apiUrl = `/guidancemanagment/api/manage-accounts.php?school=${encodeURIComponent(school)}`;
    
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

    let apiUrl = `/guidancemanagment/api/manage-accounts.php?school=${encodeURIComponent(school)}`;
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
    
    document.getElementById('editAccountModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editAccountModal').style.display = 'none';
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

    fetch('/guidancemanagment/api/manage-accounts.php', {
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
