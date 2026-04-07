// Student Dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
    loadDashboardData();
});

function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        document.getElementById('userName').textContent = user.name || 'Student';
        if (document.getElementById('userRole')) {
            document.getElementById('userRole').textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('-', ' ') : 'Student';
        }
        const initials = user.name.split(' ').map(n => n[0]).join('');
        document.getElementById('userAvatar').textContent = initials.substring(0, 2);
    }
}

function loadDashboardData() {
    const referrals = JSON.parse(localStorage.getItem('referrals') || '[]');
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const studentHistory = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
    
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const userId = user?.id;
    
    const studentReferrals = referrals.filter(r => r.studentId === userId);
    const studentAppointments = appointments.filter(a => a.studentId === userId && new Date(a.date) >= new Date());
    const studentHistoryCount = studentHistory.filter(h => h.studentId === userId).length;
    
    document.getElementById('referralCount').textContent = studentReferrals.length;
    document.getElementById('appointmentCount').textContent = studentAppointments.length;
    document.getElementById('historyCount').textContent = studentHistoryCount;
    
    loadActivityFeed(studentReferrals, studentAppointments);
}

function loadActivityFeed(referrals, appointments) {
    const feed = document.getElementById('activityFeed');
    const activities = [];
    
    referrals.forEach(r => {
        activities.push({
            date: new Date(r.dateCreated),
            type: 'Referral',
            message: `Referral submitted for ${r.reason}`,
            status: r.status
        });
    });
    
    appointments.forEach(a => {
        activities.push({
            date: new Date(a.date),
            type: 'Appointment',
            message: `Appointment scheduled with ${a.counselor}`,
            status: a.status
        });
    });
    
    activities.sort((a, b) => b.date - a.date);
    
    if (activities.length === 0) {
        feed.innerHTML = '<p style="text-align: center; color: #999; padding: 30px;">No recent activity</p>';
        return;
    }
    
    feed.innerHTML = activities.slice(0, 5).map(activity => `
        <div style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${activity.type}</strong>
                <p style="margin: 4px 0; color: #64748b; font-size: 0.9em;">${activity.message}</p>
                <small style="color: #999;">${activity.date.toLocaleDateString()}</small>
            </div>
            <span class="badge" style="background: ${activity.status === 'Pending' ? '#f59e0b' : '#10b981'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em;">${activity.status}</span>
        </div>
    `).join('');
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    window.location.href = '../../index.php';
});
