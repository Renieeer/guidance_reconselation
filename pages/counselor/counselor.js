// Counselor Dashboard Script

function loadCounselorDashboard() {
    initPage();
    const referrals = getData('referrals') || [];
    const user = getCurrentUser();

    // Get counselor's referrals (Stage 4 and 5)
    const assignedReferrals = referrals.filter(r => r.stage >= 3);

    const active = assignedReferrals.filter(r => r.stage >= 4 && r.stage < 6).length;
    const followUps = assignedReferrals.filter(r => r.stage === 3).length;
    const totalStudents = assignedReferrals.length;

    document.getElementById('activeCases').textContent = active;
    document.getElementById('weekSessions').textContent = Math.floor(active / 2) || 0;
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('followUps').textContent = followUps;

    loadRecentReferrals(assignedReferrals);
}

function loadRecentReferrals(referrals) {
    const tbody = document.getElementById('recentReferralsBody');

    if (referrals.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="6" style="text-align: center; padding: 30px; color: #999;">No referrals assigned yet</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = referrals.reverse().slice(0, 5).map(referral => `
        <tr>
            <td><strong>${referral.id}</strong></td>
            <td>${referral.studentName}</td>
            <td>${referral.referralReason}</td>
            <td>${formatDate(referral.dateSubmitted)}</td>
            <td>${createBadge(getStatusLabel(referral.stage))}</td>
            <td>
                <a href="referral-status.php?id=${referral.id}" class="btn btn-sm btn-primary">View</a>
            </td>
        </tr>
    `).join('');
}

function getStatusLabel(stage) {
    const labels = {
        1: 'pending',
        2: 'pending',
        3: 'in-progress',
        4: 'in-progress',
        5: 'in-progress',
        6: 'completed'
    };
    return labels[stage] || 'pending';
}

document.addEventListener('DOMContentLoaded', loadCounselorDashboard);
