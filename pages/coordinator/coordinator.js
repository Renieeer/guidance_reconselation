// Coordinator Dashboard Script

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

function loadCoordinatorDashboard() {
    initPage();
    initSidebarActive();
    const referrals = getData('referrals') || [];

    // Calculate statistics
    const total = referrals.length;
    const pending = referrals.filter(r => r.stage === 1 || r.stage === 2).length;
    const active = referrals.filter(r => r.stage >= 3 && r.stage < 6).length;
    const closed = referrals.filter(r => r.stage === 6).length;

    // Update stats
    document.getElementById('totalReferrals').textContent = total;
    document.getElementById('pendingReferrals').textContent = pending;
    document.getElementById('activeCases').textContent = active;
    document.getElementById('closedCases').textContent = closed;

    // Update stage distribution
    document.getElementById('stageSub').textContent = referrals.filter(r => r.stage === 1).length;
    document.getElementById('stageReview').textContent = referrals.filter(r => r.stage === 2).length;
    document.getElementById('stageFollowUp').textContent = referrals.filter(r => r.stage === 3).length;
    document.getElementById('stageCounseling').textContent = referrals.filter(r => r.stage === 4).length;
    document.getElementById('stageProgress').textContent = referrals.filter(r => r.stage === 5).length;
    document.getElementById('stageClosed').textContent = referrals.filter(r => r.stage === 6).length;

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
            <td>${referral.submittedByName}</td>
            <td>${createBadge(getStatusLabel(referral.stage))}</td>
            <td>
                <a href="referrals.php?id=${referral.id}" class="btn btn-sm btn-primary">Review</a>
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadCoordinatorDashboard);

