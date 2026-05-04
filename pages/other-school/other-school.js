// Combined Dashboard Script (Coordinator & Counselor)

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

function loadCombinedDashboard() {
    initPage();
    initSidebarActive();
    const referrals = getData('referrals') || [];

    // Calculate statistics
    const active = referrals.filter(r => r.stage >= 3 && r.stage < 6).length;
    const followUps = referrals.filter(r => r.stage === 3 || r.stage === 5).length;
    
    // Count assigned to counseling
    const assignedReferrals = referrals.filter(r => r.stage >= 3);
    const totalStudents = assignedReferrals.length;
    const weekSessions = Math.floor(active / 2) || 0;

    // Update stats
    document.getElementById('activeCases').textContent = active;
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('weekSessions').textContent = weekSessions;
    document.getElementById('followUps').textContent = followUps;

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
