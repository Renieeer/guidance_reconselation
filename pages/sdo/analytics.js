// SDO Analytics Script

function loadAnalytics() {
    initPage();

    // No role param: falls through to an unfiltered query, which is what
    // SDO/division-level oversight wants — every referral, every school.
    fetch('../../api/referral.php')
        .then(response => response.json())
        .then(result => {
            if (!result.success) {
                throw new Error(result.message || 'Failed to load referrals');
            }
            renderAnalytics(result.data || []);
        })
        .catch(error => {
            console.error('Error loading SDO analytics:', error);
            ['statusSub', 'statusReview', 'statusProcess', 'statusCompleted', 'monthlyAvg', 'avgResTime']
                .forEach(id => { document.getElementById(id).textContent = '—'; });
        });

    // Load comparative analytics
    loadComparativeAnalytics();
}

function renderAnalytics(referrals) {
    // NOTE: reasonAcademic/Behavioral/Mental/Other are intentionally left
    // alone (not written here) — referral_reason is free text typed by the
    // referring teacher, there's no fixed category on the referral itself,
    // so it can't be bucketed into those 4 labels by exact match against
    // real data without either a controlled category field on the referral
    // form or a mapping decision. See the same note in counselor/analytics.js.

    const total = referrals.length;

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

    const resolutionDays = referrals
        .filter(r => r.stage === 6 && r.date_submitted && r.updated_at)
        .map(r => Math.max(0, Math.floor((new Date(r.updated_at) - new Date(r.date_submitted)) / (1000 * 60 * 60 * 24))));
    document.getElementById('avgResTime').textContent = resolutionDays.length > 0
        ? Math.round(resolutionDays.reduce((sum, d) => sum + d, 0) / resolutionDays.length) + ' days'
        : 'N/A';
}

// Real per-district rollup from api/case-report.php (schools grouped by
// schools.district, staff headcounts from users_tables, referral/resolution
// counts from the referral table — all joined on school name). Schools
// without a district assigned yet (the common starting state) show up under
// a single real "Unassigned" row instead of being split into fake districts.
function loadComparativeAnalytics() {
    const tbody = document.getElementById('analyticsTableBody');

    fetch('../../api/case-report.php?action=district_summary')
        .then(response => response.json())
        .then(result => {
            if (!result.success) {
                throw new Error(result.message || 'Failed to load district summary');
            }
            renderComparativeAnalytics(result.districts || []);
        })
        .catch(error => {
            console.error('Error loading comparative analytics:', error);
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Unable to load district data.</td></tr>';
        });
}

function renderComparativeAnalytics(districts) {
    const tbody = document.getElementById('analyticsTableBody');

    if (districts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No schools found.</td></tr>';
        return;
    }

    tbody.innerHTML = districts.map(row => {
        const resolution = row.referralCount > 0 ? Math.round((row.resolvedCount / row.referralCount) * 100) : 0;
        const performance = resolution > 65 ? 'Excellent' : (resolution > 50 ? 'Good' : 'Needs Improvement');

        return `
            <tr>
                <td><strong>${escapeHtml(row.district)}</strong></td>
                <td>${row.schoolCount}</td>
                <td>${row.teacherCount}</td>
                <td>${row.coordinatorCount}</td>
                <td>${row.counselorCount}</td>
                <td>${row.referralCount}</td>
                <td>${resolution}%</td>
                <td>${createBadge(performance === 'Excellent' ? 'completed' : (performance === 'Good' ? 'in-progress' : 'pending'))}</td>
            </tr>
        `;
    }).join('');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', loadAnalytics);

