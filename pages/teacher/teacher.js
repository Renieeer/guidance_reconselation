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

    const user = getCurrentUser();
    const teacherSchool = user?.school_attended || '';
    const teacherId = user?.id || null;

    if (!teacherId) {
        console.warn('No teacher id found — cannot load dashboard data');
        loadRecentReferrals([]);
        return;
    }

    // Teachers only ever see their own submitted referrals — same
    // endpoint/params referral-status.js already uses successfully.
    const apiUrl = `/guidancemanagment/api/referral.php?role=teacher&school=${encodeURIComponent(teacherSchool)}&user_id=${encodeURIComponent(teacherId)}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(result => {
            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch referrals');
            }

            const teacherReferrals = result.data || [];

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
        })
        .catch(error => {
            console.error('Error loading teacher dashboard referrals:', error);
            loadRecentReferrals([]);
        });

    // Check for success message from form submission
    const params = new URLSearchParams(window.location.search);
    if (params.get('submitted') === 'true') {
        const successMessage = document.getElementById('successMessage');
        successMessage.textContent = 'Referral form submitted successfully!';
        successMessage.classList.add('show');
        setTimeout(() => successMessage.classList.remove('show'), 3000);
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

    tbody.innerHTML = teacherReferrals.map(referral => `
        <tr>
            <td><strong>${referral.referral_code || referral.id}</strong></td>
            <td>${referral.student_name}</td>
            <td>${referral.grade || 'N/A'}</td>
            <td>${formatDate(referral.date_submitted)}</td>
            <td>${createBadge(referral.status)}</td>
            <td>${referral.stage} / 6</td>
            <td>
                <a href="referral-status.php?id=${referral.referral_code || referral.id}" class="btn btn-sm btn-primary">View</a>
            </td>
        </tr>
    `).join('');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadTeacherDashboard);
