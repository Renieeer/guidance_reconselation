// Analytics Script (Combined Coordinator & Counselor)

function loadAnalytics() {
    initPage();
    const referrals = getData('referrals') || [];

    // Calculate analytics
    const total = referrals.length;
    const closed = referrals.filter(r => r.stage === 6).length;
    const completionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    // Calculate average processing time
    const avgProcessTime = calculateAverageProcessTime(referrals);

    // Update stats
    document.getElementById('totalAnalytics').textContent = total;
    document.getElementById('completionRate').textContent = completionRate + '%';
    document.getElementById('avgProcessTime').textContent = avgProcessTime;

    // Load stage distribution
    loadStageDistribution(referrals);

    // Load reason distribution
    loadReasonDistribution(referrals);
}

function calculateAverageProcessTime(referrals) {
    const closedReferrals = referrals.filter(r => r.stage === 6);
    if (closedReferrals.length === 0) return 0;

    const totalDays = closedReferrals.reduce((sum, r) => {
        const submitted = new Date(r.dateSubmitted);
        const closed = new Date(r.closedDate || new Date());
        const days = Math.floor((closed - submitted) / (1000 * 60 * 60 * 24));
        return sum + days;
    }, 0);

    return Math.round(totalDays / closedReferrals.length);
}

function loadStageDistribution(referrals) {
    const stages = {
        'Submitted': referrals.filter(r => r.stage === 1).length,
        'Under Review': referrals.filter(r => r.stage === 2).length,
        'Follow Up': referrals.filter(r => r.stage === 3).length,
        'Counseling': referrals.filter(r => r.stage === 4).length,
        'In Progress': referrals.filter(r => r.stage === 5).length,
        'Closed': referrals.filter(r => r.stage === 6).length
    };

    const total = referrals.length;
    const tbody = document.getElementById('stageTableBody');

    tbody.innerHTML = Object.entries(stages).map(([stage, count]) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        return `
            <tr>
                <td><strong>${stage}</strong></td>
                <td>${count}</td>
                <td>${percentage}%</td>
            </tr>
        `;
    }).join('');
}

function loadReasonDistribution(referrals) {
    const reasons = {};

    referrals.forEach(r => {
        const reason = r.referralReason || 'Unknown';
        reasons[reason] = (reasons[reason] || 0) + 1;
    });

    const reasonChart = document.getElementById('reasonChart');
    reasonChart.innerHTML = `<div style="padding: 20px;">
        ${Object.entries(reasons).map(([reason, count]) => `
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${reason}</span>
                    <strong>${count}</strong>
                </div>
                <div style="background-color: #e0e0e0; height: 20px; border-radius: 4px; overflow: hidden;">
                    <div style="background-color: #4a90e2; height: 100%; width: ${(count / referrals.length) * 100}%;"></div>
                </div>
            </div>
        `).join('')}
    </div>`;
}

// Logout functionality
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});
