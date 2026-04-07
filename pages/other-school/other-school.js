// Combined Dashboard Script (Coordinator & Counselor)

function loadCombinedDashboard() {
    initPage();
    const referrals = getData('referrals') || [];
    const user = getCurrentUser();

    // Calculate statistics
    const total = referrals.length;
    const pending = referrals.filter(r => r.stage === 1 || r.stage === 2).length;
    const active = referrals.filter(r => r.stage >= 3 && r.stage < 6).length;
    const closed = referrals.filter(r => r.stage === 6).length;
    
    // Count assigned to counseling
    const assignedReferrals = referrals.filter(r => r.stage >= 3);
    const totalStudents = assignedReferrals.length;
    const weekSessions = Math.floor(active / 2) || 0;

    // Update stats
    document.getElementById('totalReferrals').textContent = total;
    document.getElementById('pendingReferrals').textContent = pending;
    document.getElementById('activeCases').textContent = active;
    document.getElementById('closedCases').textContent = closed;
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('weekSessions').textContent = weekSessions;

    // Update stage distribution
    document.getElementById('stageSub').textContent = referrals.filter(r => r.stage === 1).length;
    document.getElementById('stageReview').textContent = referrals.filter(r => r.stage === 2).length;
    document.getElementById('stageFollowUp').textContent = referrals.filter(r => r.stage === 3).length;
    document.getElementById('stageCounseling').textContent = referrals.filter(r => r.stage === 4).length;
    document.getElementById('stageProgress').textContent = referrals.filter(r => r.stage === 5).length;
    document.getElementById('stageClosed').textContent = referrals.filter(r => r.stage === 6).length;

    // Load recent referrals
    loadRecentReferrals(referrals);
}

function loadRecentReferrals(referrals) {
    const tbody = document.getElementById('recentReferralsBody');

    if (referrals.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="6" style="text-align: center; padding: 30px; color: #999;">No referrals yet</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = referrals.reverse().slice(0, 5).map(referral => `
        <tr>
            <td><strong>${referral.id}</strong></td>
            <td>${referral.studentName}</td>
            <td>${referral.referralReason}</td>
            <td>${referral.submittedByName || 'N/A'}</td>
            <td>${createBadge(getStatusLabel(referral.stage))}</td>
            <td>
                <a href="referrals.php?id=${referral.id}" class="btn btn-sm btn-primary">View</a>
            </td>
        </tr>
    `).join('');
}

function getStatusLabel(stage) {
    const labels = {
        1: 'pending',
        2: 'pending',
        3: 'processing',
        4: 'processing',
        5: 'processing',
        6: 'completed'
    };
    return labels[stage] || 'unknown';
}

// Logout functionality
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});
