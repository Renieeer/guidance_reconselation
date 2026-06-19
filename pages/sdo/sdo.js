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

function loadSDODashboard() {
    initPage();
    initSidebarActive();
    const referrals = getData('referrals') || [];

    // Calculate overall stats
    const total = referrals.length;
    const active = referrals.filter(r => r.stage >= 3 && r.stage < 6).length;
    const completed = referrals.filter(r => r.stage === 6).length;
    const resolutionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('totalReferrals').textContent = total;
    document.getElementById('activeCases').textContent = active;
    document.getElementById('resolutionRate').textContent = resolutionRate + '%';
    document.getElementById('schoolsReporting').textContent = 11; // All 11 districts

    // Load district summary
    loadDistrictSummary();

    // Setup district filter
    document.getElementById('districtFilter').addEventListener('change', loadDistrictSummary);
}

function loadDistrictSummary() {
    const tbody = document.getElementById('districtTableBody');
    
    const districtStats = districts.map(district => {
        // Simulated data per district (in real app, this would be filtered by actual district)
        const schoolCount = Math.floor(Math.random() * 15) + 5;
        const referralCount = Math.floor(Math.random() * 100) + 10;
        const activeCount = Math.floor(referralCount * 0.4);
        const completedCount = Math.floor(referralCount * 0.3);
        const avgTime = Math.floor(Math.random() * 30) + 15 + ' days';
        const status = Math.random() > 0.2 ? 'Good' : 'Attention Needed';

        return { district, schoolCount, referralCount, activeCount, completedCount, avgTime, status };
    });

    tbody.innerHTML = districtStats.map(stat => `
        <tr>
            <td><strong>${stat.district}</strong></td>
            <td>${stat.schoolCount}</td>
            <td>${stat.referralCount}</td>
            <td>${stat.activeCount}</td>
            <td>${stat.completedCount}</td>
            <td>${stat.avgTime}</td>
            <td>${createBadge(stat.status === 'Good' ? 'completed' : 'pending')}</td>
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', loadSDODashboard);

