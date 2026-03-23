// Analytics Script

function loadAnalytics() {
    initPage();
    
    const referrals = getData('referrals') || [];

    // Calculate statistics by reason
    const byReason = {};
    referrals.forEach(r => {
        byReason[r.referralReason] = (byReason[r.referralReason] || 0) + 1;
    });

    document.getElementById('analyticsAcademic').textContent = byReason['Academic Concerns'] || 0;
    document.getElementById('analyticsBehavioral').textContent = byReason['Behavioral Issues'] || 0;
    document.getElementById('analyticsMental').textContent = byReason['Mental Health Concern'] || 0;
    document.getElementById('analyticsFamily').textContent = byReason['Family Issues'] || 0;
    document.getElementById('analyticsOther').textContent = 
        (byReason['Other'] || 0) + (byReason['Attendance Problems'] || 0) + 
        (byReason['Social/Peer Issues'] || 0) + (byReason['Substance Abuse'] || 0);

    // By stage
    document.getElementById('analyticsSub').textContent = referrals.filter(r => r.stage === 1).length;
    document.getElementById('analyticsReview').textContent = referrals.filter(r => r.stage === 2).length;
    document.getElementById('analyticsProgress').textContent = referrals.filter(r => r.stage === 5).length;
    document.getElementById('analyticsCounseling').textContent = referrals.filter(r => r.stage === 4).length;
    document.getElementById('analyticsClosed').textContent = referrals.filter(r => r.stage === 6).length;

    // By urgency
    document.getElementById('analyticsLow').textContent = referrals.filter(r => r.urgency === 'Low').length;
    document.getElementById('analyticsMedium').textContent = referrals.filter(r => r.urgency === 'Medium').length;
    document.getElementById('analyticsHigh').textContent = referrals.filter(r => r.urgency === 'High').length;
    document.getElementById('analyticsCrisis').textContent = referrals.filter(r => r.urgency === 'Crisis').length;

    // Performance metrics
    const resolved = referrals.filter(r => r.stage === 6).length;
    const total = referrals.length;
    const closure = total > 0 ? Math.round((resolved / total) * 100) : 0;

    document.getElementById('resolved').textContent = resolved;
    document.getElementById('closureRate').textContent = closure + '%';
    document.getElementById('successRate').textContent = 'Tracking';
    document.getElementById('avgTime').textContent = 'Calculating...';

    loadDetailedStats(referrals, total);
}

function loadDetailedStats(referrals, total) {
    const tbody = document.getElementById('statsTableBody');
    
    const stats = [
        { metric: 'Total Referrals', value: total, percentage: 100, trend: '→' },
        { metric: 'Pending Review', value: referrals.filter(r => r.stage <= 2).length, percentage: Math.round((referrals.filter(r => r.stage <= 2).length / total * 100) || 0), trend: '↓' },
        { metric: 'In Counseling Stage', value: referrals.filter(r => r.stage >= 3 && r.stage < 6).length, percentage: Math.round(((referrals.filter(r => r.stage >= 3 && r.stage < 6).length) / total * 100) || 0), trend: '↑' },
        { metric: 'Closed Cases', value: referrals.filter(r => r.stage === 6).length, percentage: Math.round((referrals.filter(r => r.stage === 6).length / total * 100) || 0), trend: '↑' },
        { metric: 'High Urgency Cases', value: referrals.filter(r => r.urgency === 'High' || r.urgency === 'Crisis').length, percentage: Math.round(((referrals.filter(r => r.urgency === 'High' || r.urgency === 'Crisis').length) / total * 100) || 0), trend: '→' }
    ];

    tbody.innerHTML = stats.map(stat => `
        <tr>
            <td><strong>${stat.metric}</strong></td>
            <td>${stat.value}</td>
            <td>${stat.percentage}%</td>
            <td style="text-align: center;">${stat.trend}</td>
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', loadAnalytics);
