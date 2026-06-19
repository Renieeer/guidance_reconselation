// SDO Analytics Script

function loadAnalytics() {
    initPage();
    
    const referrals = getData('referrals') || [];

    // Calculate stats by reason
    const byReason = {};
    referrals.forEach(r => {
        byReason[r.referralReason] = (byReason[r.referralReason] || 0) + 1;
    });

    const total = referrals.length;
    const academia = byReason['Academic Concerns'] || 0;
    const behavioral = byReason['Behavioral Issues'] || 0;
    const mental = byReason['Mental Health Concern'] || 0;
    const other = total - academia - behavioral - mental;

    // Populate reason percentages
    document.getElementById('reasonAcademic').textContent = total > 0 ? Math.round((academia / total) * 100) + '%' : '0%';
    document.getElementById('reasonBehavioral').textContent = total > 0 ? Math.round((behavioral / total) * 100) + '%' : '0%';
    document.getElementById('reasonMental').textContent = total > 0 ? Math.round((mental / total) * 100) + '%' : '0%';
    document.getElementById('reasonOther').textContent = total > 0 ? Math.round((other / total) * 100) + '%' : '0%';

    // Status stats
    const sub = referrals.filter(r => r.stage === 1).length;
    const review = referrals.filter(r => r.stage === 2).length;
    const inProcess = referrals.filter(r => r.stage >= 3 && r.stage < 6).length;
    const completed = referrals.filter(r => r.stage === 6).length;

    document.getElementById('statusSub').textContent = sub;
    document.getElementById('statusReview').textContent = review;
    document.getElementById('statusProcess').textContent = inProcess;
    document.getElementById('statusCompleted').textContent = completed;

    document.getElementById('monthlyAvg').textContent = Math.ceil(total / 12) + ' referrals/month';
    document.getElementById('avgResTime').textContent = '15-30 days';

    // Load comparative analytics
    loadComparativeAnalytics();
}

function loadComparativeAnalytics() {
    const districts = [
        'District 1', 'District 2', 'District 3', 'District 4', 'District 5',
        'District 6', 'District 7', 'District 8', 'District 9', 'District 10', 'District 11'
    ];

    const tbody = document.getElementById('analyticsTableBody');
    
    tbody.innerHTML = districts.map((district, idx) => {
        const schoolCount = Math.floor(Math.random() * 15) + 5;
        const teachers = schoolCount * 8;
        const coordinators = schoolCount * 1;
        const counselors = schoolCount * 2;
        const referrals = Math.floor(Math.random() * 100) + 20;
        const resolution = Math.floor(Math.random() * 40) + 50;
        const performance = resolution > 65 ? 'Excellent' : (resolution > 50 ? 'Good' : 'Needs Improvement');

        return `
            <tr>
                <td><strong>${district}</strong></td>
                <td>${schoolCount}</td>
                <td>${teachers}</td>
                <td>${coordinators}</td>
                <td>${counselors}</td>
                <td>${referrals}</td>
                <td>${resolution}%</td>
                <td>${createBadge(performance === 'Excellent' ? 'completed' : (performance === 'Good' ? 'in-progress' : 'pending'))}</td>
            </tr>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', loadAnalytics);

