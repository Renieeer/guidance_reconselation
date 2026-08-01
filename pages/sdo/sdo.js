// SDO Dashboard Script

// Initialize sidebar active state based on current page
function initSidebarActive() {
    // Get the current page filename
    const url = window.location.href;
    const currentFile = url.substring(url.lastIndexOf('/') + 1);
    
    // Get all sidebar menu links
    const menuLinks = document.querySelectorAll('.sidebar-menu a');
    
    // Remove active class from all and add to current page
    menuLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        
        // Match current file with link href
        if (href && url.includes(href)) {
            link.classList.add('active');
        }
    });
}

const districts = [
    'District 1', 'District 2', 'District 3', 'District 4', 'District 5',
    'District 6', 'District 7', 'District 8', 'District 9', 'District 10', 'District 11'
];

let sdoReferrals = [];
let sdoSchoolCount = 0;

function loadSDODashboard() {
    initPage();
    initSidebarActive();

    Promise.all([
        // No role param: falls through to an unfiltered query, which is
        // what SDO/division-level oversight actually wants — every
        // referral across every school, not scoped to one.
        fetch('../../api/referral.php').then(res => res.json()),
        fetch('../../api/school-config.php').then(res => res.json())
    ])
        .then(([referralResult, schoolResult]) => {
            if (!referralResult.success) {
                throw new Error(referralResult.message || 'Failed to load referrals');
            }
            sdoReferrals = referralResult.data || [];
            sdoSchoolCount = schoolResult.success ? (schoolResult.schools || []).length : 0;

            renderOverallStats();
            loadDistrictSummary();
        })
        .catch(error => {
            console.error('Error loading SDO dashboard:', error);
            ['totalReferrals', 'activeCases', 'resolutionRate', 'schoolsReporting']
                .forEach(id => { document.getElementById(id).textContent = '—'; });
        });

    // Setup district filter
    document.getElementById('districtFilter').addEventListener('change', loadDistrictSummary);
}

function renderOverallStats() {
    const total = sdoReferrals.length;
    const active = sdoReferrals.filter(r => r.stage >= 3 && r.stage < 6).length;
    const completed = sdoReferrals.filter(r => r.stage === 6).length;
    const resolutionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const schoolsReporting = new Set(
        sdoReferrals.map(r => r.school_attended || r.student_school).filter(Boolean)
    ).size;

    document.getElementById('totalReferrals').textContent = total;
    document.getElementById('activeCases').textContent = active;
    document.getElementById('resolutionRate').textContent = resolutionRate + '%';
    document.getElementById('schoolsReporting').textContent = schoolsReporting;
}

// There's no district-to-school assignment anywhere in this app (schools
// aren't grouped by district in the database), so — same approach as
// pages/sdo/district-report-cases.js — every district row shows the same
// real, division-wide totals rather than fabricated per-district numbers.
function loadDistrictSummary() {
    const tbody = document.getElementById('districtTableBody');

    const total = sdoReferrals.length;
    const active = sdoReferrals.filter(r => r.stage >= 3 && r.stage < 6).length;
    const completed = sdoReferrals.filter(r => r.stage === 6).length;

    const resolutionDays = sdoReferrals
        .filter(r => r.stage === 6 && r.date_submitted && r.updated_at)
        .map(r => (new Date(r.updated_at) - new Date(r.date_submitted)) / (1000 * 60 * 60 * 24))
        .filter(days => Number.isFinite(days) && days >= 0);
    const avgTime = resolutionDays.length > 0
        ? Math.round(resolutionDays.reduce((sum, d) => sum + d, 0) / resolutionDays.length) + ' days'
        : 'N/A';

    const resolutionRate = total > 0 ? (completed / total) * 100 : 0;
    const status = total === 0 ? 'Good' : (resolutionRate >= 70 ? 'Good' : 'Attention Needed');

    tbody.innerHTML = districts.map(district => `
        <tr>
            <td><strong>${district}</strong></td>
            <td>${sdoSchoolCount}</td>
            <td>${total}</td>
            <td>${active}</td>
            <td>${completed}</td>
            <td>${avgTime}</td>
            <td>${createBadge(status === 'Good' ? 'completed' : 'pending')}</td>
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', loadSDODashboard);

