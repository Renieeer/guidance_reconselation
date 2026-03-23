// Student Schedule
document.addEventListener('DOMContentLoaded', function() {
    checkAuth('student');
    loadUserInfo();
    loadCalendar();
    setupEventListeners();
});

function loadUserInfo() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = user.name || 'Student';
        const initials = user.name.split(' ').map(n => n[0]).join('');
        document.getElementById('userAvatar').textContent = initials.substring(0, 2);
    }
}

function loadCalendar() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const userId = user?.id;
    const appointments = getData('appointments') || [];
    
    const userAppts = appointments.filter(a => a.studentId === userId);
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    let html = `<h3>${new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>`;
    html += '<table style="width: 100%; border-collapse: collapse; margin-top: 16px;"><tr>';
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        html += `<th style="padding: 8px; text-align: center; font-weight: 600; color: #0f172a; border-bottom: 2px solid #e2e8f0;">${day}</th>`;
    });
    html += '</tr><tr>';
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        html += '<td style="padding: 12px; text-align: center; background: #f8f9fa;"></td>';
    }
    
    // Days of month
    let dayCount = firstDay;
    for (let day = 1; day <= daysInMonth; day++) {
        if (dayCount % 7 === 0 && dayCount !== 0) {
            html += '</tr><tr>';
        }
        
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasAppt = userAppts.some(a => a.date.includes(dateStr));
        const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
        
        const bgColor = isToday ? '#dbeafe' : (hasAppt ? '#dcfce7' : '#ffffff');
        const borderColor = hasAppt ? '#10b981' : (isToday ? '#3b82f6' : '#e2e8f0');
        
        html += `<td style="padding: 12px; text-align: center; border: 2px solid ${borderColor}; background: ${bgColor}; cursor: pointer; border-radius: 6px; font-weight: ${hasAppt ? '700' : '400'};">
            ${day}${hasAppt ? '<span style="display: block; font-size: 0.7em; color: #10b981; margin-top: 4px;">•</span>' : ''}
        </td>`;
        dayCount++;
    }
    
    html += '</tr></table>';
    document.getElementById('calendar').innerHTML = html;
}

function getStatusColor(status) {
    const colors = {
        'Pending': '#f59e0b',
        'Approved': '#10b981',
        'Scheduled': '#3b82f6',
        'Completed': '#8b5cf6',
        'Cancelled': '#ef4444'
    };
    return colors[status] || '#6b7280';
}

function viewAppointment(appointmentId) {
    const appointments = getData('appointments') || [];
    const appt = appointments.find(a => a.id === appointmentId);
    
    if (!appt) return;
    
    document.getElementById('appointmentDate').value = formatDate(appt.date);
    document.getElementById('appointmentTime').value = appt.time;
    document.getElementById('appointmentCounselor').value = 'Counselor';
    document.getElementById('appointmentLocation').value = appt.location || 'TBD';
    document.getElementById('appointmentStatus').value = appt.status;
    document.getElementById('appointmentNotes').value = appt.notes || 'No notes';
    
    document.getElementById('appointmentModal').style.display = 'flex';
}

function setupEventListeners() {
    document.getElementById('closeAppointmentModal').addEventListener('click', () => {
        document.getElementById('appointmentModal').style.display = 'none';
    });
    
    document.getElementById('closeAppointmentBtn').addEventListener('click', () => {
        document.getElementById('appointmentModal').style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('appointmentModal');
        if (e.target === modal) modal.style.display = 'none';
    });
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    sessionStorage.removeItem('user');
    window.location.href = '../../index.html';
});
