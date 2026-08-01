// Analytics Script (Combined Coordinator & Counselor)

function loadAnalytics() {
    initPage();

    const user = getCurrentUser();
    const school = (user && user.school_attended) || '';
    // `role=other-school` is required for the API to apply school/grade
    // scoping at all — without it the request falls through to an
    // unfiltered query (see pages/other-school/referrals.js).
    const apiUrl = `../../api/referral.php?role=other-school&school=${encodeURIComponent(school)}&grade_scope=${encodeURIComponent(getCurrentGradeScope())}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(result => {
            if (!result.success) {
                throw new Error(result.message || 'Failed to load referrals');
            }
            renderAnalytics(result.data || []);
        })
        .catch(error => {
            console.error('Error loading analytics:', error);
            document.getElementById('totalAnalytics').textContent = '—';
            document.getElementById('completionRate').textContent = '—';
            document.getElementById('avgProcessTime').textContent = '—';
            loadStageDistribution([]);
            loadReasonDistribution([]);
        });
}

function renderAnalytics(referrals) {
    // Calculate analytics
    const total = referrals.length;
    const closed = referrals.filter(r => r.stage === 6).length;
    const completionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    // Calculate average processing time
    const avgProcessTime = calculateAverageProcessTime(referrals);

    // Update stats
    document.getElementById('totalAnalytics').textContent = total;
    document.getElementById('completionRate').textContent = completionRate + '%';
    document.getElementById('avgProcessTime').textContent = avgProcessTime + (typeof avgProcessTime === 'number' ? ' days' : '');

    // Load stage distribution
    loadStageDistribution(referrals);

    // Load reason distribution
    loadReasonDistribution(referrals);
}

function calculateAverageProcessTime(referrals) {
    const closedReferrals = referrals.filter(r => r.stage === 6 && r.date_submitted && r.updated_at);
    if (closedReferrals.length === 0) return 'N/A';

    const totalDays = closedReferrals.reduce((sum, r) => {
        const submitted = new Date(r.date_submitted);
        const closed = new Date(r.updated_at);
        const days = Math.floor((closed - submitted) / (1000 * 60 * 60 * 24));
        return sum + Math.max(days, 0);
    }, 0);

    return Math.round(totalDays / closedReferrals.length);
}

function loadStageDistribution(referrals) {
    const stages = {
        'Admission of Case': referrals.filter(r => r.stage === 1).length,
        'Initial Screening': referrals.filter(r => r.stage === 2).length,
        'Parent Consent': referrals.filter(r => r.stage === 3).length,
        'Assessment Proper': referrals.filter(r => r.stage === 4).length,
        'Parent Conference': referrals.filter(r => r.stage === 5).length,
        'External Referral': referrals.filter(r => r.stage === 6).length
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
    const reasonChart = document.getElementById('reasonChart');

    if (referrals.length === 0) {
        reasonChart.innerHTML = `<div style="padding: 20px; color: #999;">No referrals yet</div>`;
        return;
    }

    const reasons = {};
    referrals.forEach(r => {
        // Free-text field — grouped by exact text, so near-duplicate
        // phrasing shows as separate entries rather than being merged.
        const reason = (r.referral_reason || '').trim() || 'Unspecified';
        reasons[reason] = (reasons[reason] || 0) + 1;
    });

    reasonChart.innerHTML = `<div style="padding: 20px;">
        ${Object.entries(reasons).map(([reason, count]) => `
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${escapeHtml(reason)}</span>
                    <strong>${count}</strong>
                </div>
                <div style="background-color: #e0e0e0; height: 20px; border-radius: 4px; overflow: hidden;">
                    <div style="background-color: #4a90e2; height: 100%; width: ${(count / referrals.length) * 100}%;"></div>
                </div>
            </div>
        `).join('')}
    </div>`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Logout functionality
document.getElementById('logoutBtn')?.addEventListener('click', requestLogout);

