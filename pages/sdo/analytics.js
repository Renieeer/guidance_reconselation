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
    const inProcess = referrals.filter(r => r.stage >= 3 && r.stage < 7).length;
    const completed = referrals.filter(r => r.stage === 7).length;

    document.getElementById('statusSub').textContent = sub;
    document.getElementById('statusReview').textContent = review;
    document.getElementById('statusProcess').textContent = inProcess;
    document.getElementById('statusCompleted').textContent = completed;

    document.getElementById('monthlyAvg').textContent = Math.ceil(total / 12) + ' referrals/month';

    const resolutionDays = referrals
        .filter(r => r.stage === 7 && r.date_submitted && r.updated_at)
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
// Paginates the district table once it grows past one page — same
// pattern/CSS class (.district-pagination) as school-management.js's
// school folder grid, just applied to a <table> instead of a card grid.
const DISTRICT_ANALYTICS_PAGE_SIZE = 10;
let districtAnalyticsPage = 1;
let districtAnalyticsRows = [];

function loadComparativeAnalytics() {
    const tbody = document.getElementById('analyticsTableBody');

    fetch('../../api/case-report.php?action=district_summary')
        .then(response => response.json())
        .then(result => {
            if (!result.success) {
                throw new Error(result.message || 'Failed to load district summary');
            }
            districtAnalyticsRows = result.districts || [];
            districtAnalyticsPage = 1;
            renderComparativeAnalytics();
        })
        .catch(error => {
            console.error('Error loading comparative analytics:', error);
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Unable to load district data.</td></tr>';
        });
}

function renderComparativeAnalytics() {
    const tbody = document.getElementById('analyticsTableBody');

    if (districtAnalyticsRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No schools found.</td></tr>';
        renderDistrictAnalyticsPagination(1);
        return;
    }

    const totalPages = Math.max(1, Math.ceil(districtAnalyticsRows.length / DISTRICT_ANALYTICS_PAGE_SIZE));
    if (districtAnalyticsPage > totalPages) districtAnalyticsPage = totalPages;
    if (districtAnalyticsPage < 1) districtAnalyticsPage = 1;

    const startIndex = (districtAnalyticsPage - 1) * DISTRICT_ANALYTICS_PAGE_SIZE;
    const pageRows = districtAnalyticsRows.slice(startIndex, startIndex + DISTRICT_ANALYTICS_PAGE_SIZE);

    tbody.innerHTML = pageRows.map(row => {
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

    renderDistrictAnalyticsPagination(totalPages);
}

// Prev/Next controls, only shown once the district list actually spans
// more than one page (10 rows) — a short list never shows this.
function renderDistrictAnalyticsPagination(totalPages) {
    const paginationEl = document.getElementById('districtAnalyticsPagination');
    if (!paginationEl) return;

    if (totalPages <= 1) {
        paginationEl.hidden = true;
        paginationEl.innerHTML = '';
        return;
    }

    paginationEl.hidden = false;
    paginationEl.innerHTML = `
        <button type="button" class="btn btn-secondary btn-sm" id="districtAnalyticsPrevPage" ${districtAnalyticsPage <= 1 ? 'disabled' : ''}><i class="bi bi-chevron-left"></i> Prev</button>
        <span class="district-pagination-label">Page ${districtAnalyticsPage} of ${totalPages}</span>
        <button type="button" class="btn btn-secondary btn-sm" id="districtAnalyticsNextPage" ${districtAnalyticsPage >= totalPages ? 'disabled' : ''}>Next <i class="bi bi-chevron-right"></i></button>
    `;

    document.getElementById('districtAnalyticsPrevPage')?.addEventListener('click', () => {
        if (districtAnalyticsPage > 1) {
            districtAnalyticsPage--;
            renderComparativeAnalytics();
        }
    });
    document.getElementById('districtAnalyticsNextPage')?.addEventListener('click', () => {
        districtAnalyticsPage++;
        renderComparativeAnalytics();
    });
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

