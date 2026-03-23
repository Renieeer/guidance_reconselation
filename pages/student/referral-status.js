// Student Referral Status
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
    loadReferrals();
    setupEventListeners();
});

function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        document.getElementById('userName').textContent = user.name || 'Student';
        const initials = user.name.split(' ').map(n => n[0]).join('');
        document.getElementById('userAvatar').textContent = initials.substring(0, 2);
    }
}

function loadReferrals() {
    const referrals = JSON.parse(localStorage.getItem('referrals') || '[]');
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const userId = user?.id;
    
    const studentReferrals = referrals.filter(r => r.studentId === userId);
    const tbody = document.getElementById('referralsTableBody');
    
    if (studentReferrals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;">No referrals yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = studentReferrals.map(referral => `
        <tr>
            <td>${new Date(referral.dateCreated).toLocaleDateString()}</td>
            <td>${referral.reason}</td>
            <td>${referral.submittedByName || referral.submittedBy}</td>
            <td>
                <span class="badge" style="background: ${getStatusColor(referral.status)}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.85em;">
                    ${referral.status}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewReferral('${referral.id}')">View</button>
            </td>
        </tr>
    `).join('');
}

function viewReferral(referralId) {
    const referrals = JSON.parse(localStorage.getItem('referrals') || '[]');
    const referral = referrals.find(r => r.id === referralId);
    
    if (!referral) return;
    
    document.getElementById('referralId').value = referral.id;
    document.getElementById('referralReason').value = referral.reason;
    document.getElementById('referralSubmittedBy').value = referral.submittedByName || referral.submittedBy;
    document.getElementById('referralDate').value = new Date(referral.dateCreated).toLocaleDateString();
    document.getElementById('referralStatus').value = referral.status;
    document.getElementById('referralNotes').value = referral.description || 'No additional notes';
    
    document.getElementById('referralModal').style.display = 'flex';
}

function setupEventListeners() {
    document.getElementById('closeReferralModal').addEventListener('click', () => {
        document.getElementById('referralModal').style.display = 'none';
    });
    
    document.getElementById('closeReferralBtn').addEventListener('click', () => {
        document.getElementById('referralModal').style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('referralModal');
        if (e.target === modal) modal.style.display = 'none';
    });
}

function getStatusColor(status) {
    const colors = {
        'Pending': '#f59e0b',
        'Approved': '#10b981',
        'In Progress': '#3b82f6',
        'Completed': '#8b5cf6',
        'Rejected': '#ef4444'
    };
    return colors[status] || '#6b7280';
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
});
