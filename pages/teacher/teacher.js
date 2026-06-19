// Teacher Dashboard Script

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

function loadTeacherDashboard() {
    initPage();
    initSidebarActive();
    const referrals = getData('referrals') || [];
    const user = getCurrentUser();

    // Filter referrals by current teacher
    const teacherReferrals = referrals.filter(r => r.submittedBy === user.email);

    // Calculate statistics
    const total = teacherReferrals.length;
    const pending = teacherReferrals.filter(r => r.stage === 1 || r.stage === 2).length;
    const approved = teacherReferrals.filter(r => r.stage >= 3 && r.stage < 6).length;
    const closed = teacherReferrals.filter(r => r.stage === 6).length;

    // Update stats
    document.getElementById('totalReferrals').textContent = total;
    document.getElementById('pendingReferrals').textContent = pending;
    document.getElementById('approvedReferrals').textContent = approved;
    document.getElementById('closedReferrals').textContent = closed;

    // Load recent referrals
    loadRecentReferrals(teacherReferrals);

    // Check for success message from form submission
    const params = new URLSearchParams(window.location.search);
    if (params.get('submitted') === 'true') {
        document.getElementById('successMessage').textContent = 'Referral form submitted successfully!';
        document.getElementById('successMessage').style.display = 'block';
    }
}

function loadRecentReferrals(teacherReferrals) {
    const tbody = document.getElementById('referralsTableBody');
    
    if (teacherReferrals.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="7" style="text-align: center; color: #999; padding: 30px;">
                No referrals yet. <a href="referral-form.php">Submit one now</a>
            </td>
        </tr>`;
        return;
    }

    tbody.innerHTML = teacherReferrals.reverse().map(referral => `
        <tr>
            <td><strong>${referral.id}</strong></td>
            <td>${referral.studentName}</td>
            <td>${referral.grade}</td>
            <td>${formatDate(referral.dateSubmitted)}</td>
            <td>${createBadge(getStatusLabel(referral.stage))}</td>
            <td>${referral.stage} / 6</td>
            <td>
                <a href="referral-status.php?id=${referral.id}" class="btn btn-sm btn-primary">View</a>
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
document.addEventListener('DOMContentLoaded', loadTeacherDashboard);

