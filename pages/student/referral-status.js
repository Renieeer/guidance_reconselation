// Student Referral Status
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
    loadReferrals();
    setupEventListeners();
});

function loadUserInfo() {
    const user = JSON.parse(sessionStorage.getItem('userInfo'));
    if (user) {
        document.getElementById('userName').textContent = user.name || 'Student';        if (document.getElementById('userRole')) {
            document.getElementById('userRole').textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('-', ' ') : 'Student';
        }        const initials = (user.name || '').split(' ').map(n => n[0]).join('');
        document.getElementById('userAvatar').textContent = initials.substring(0, 2);
    }
}

function loadReferrals() {
    const user = JSON.parse(sessionStorage.getItem('userInfo'));
    const userSchool = user?.school_attended || '';
    const studentName = user?.name || '';
    
    if (!studentName) {
        document.getElementById('referralsTableBody').innerHTML = 
            '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;">Unable to load referrals. Please log in again.</td></tr>';
        return;
    }

    // Fetch referrals from database
    const apiUrl = `/guidancemanagment/api/referral.php?role=student&school=${encodeURIComponent(userSchool)}&student_name=${encodeURIComponent(studentName)}`;
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data) {
                displayReferrals(result.data);
            } else {
                throw new Error(result.message || 'Failed to load referrals');
            }
        })
        .catch(error => {
            console.error('Error loading referrals:', error);
            document.getElementById('referralsTableBody').innerHTML = 
                '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;">Error loading referrals. Please try again.</td></tr>';
        });
}

function displayReferrals(referrals) {
    const tbody = document.getElementById('referralsTableBody');
    
    if (referrals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;">No referrals yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = referrals.map(referral => `
        <tr>
            <td>${formatDate(referral.date_submitted)}</td>
            <td>${referral.referral_reason}</td>
            <td>${referral.teacher_name || 'Unknown'}</td>
            <td>
                <span class="badge" style="background: ${getStatusColor(referral.status)}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.85em;">
                    ${referral.status || 'pending'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewReferral(${referral.id})">View</button>
            </td>
        </tr>
    `).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return dateString;
    }
}

function viewReferral(referralId) {
    // This would require fetching single referral details
    // For now, show basic modal with the referral ID
    document.getElementById('referralId').value = referralId;
    document.getElementById('referralModal').style.display = 'flex';
}

function setupEventListeners() {
    const closeBtn = document.getElementById('closeReferralModal');
    const closeBtnAlt = document.getElementById('closeReferralBtn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('referralModal').style.display = 'none';
        });
    }
    
    if (closeBtnAlt) {
        closeBtnAlt.addEventListener('click', () => {
            document.getElementById('referralModal').style.display = 'none';
        });
    }
    
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('referralModal');
        if (e.target === modal) modal.style.display = 'none';
    });
}

function getStatusColor(status) {
    const colors = {
        'pending': '#f59e0b',
        'in-progress': '#3b82f6',
        'completed': '#10b981',
        'rejected': '#ef4444'
    };
    return colors[status?.toLowerCase?.()] || colors[status] || '#6b7280';
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    sessionStorage.removeItem('userInfo');
    localStorage.removeItem('currentUser');
    window.location.href = '../../index.php';
});
