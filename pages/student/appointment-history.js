// Student Appointment History
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
    loadAppointmentHistory();
    setupEventListeners();
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

function loadAppointmentHistory() {
    const history = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const userId = user?.id;
    
    const studentHistory = history.filter(h => h.studentId === userId);
    const tbody = document.getElementById('historyTableBody');
    
    if (studentHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #999;">No appointment history yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = studentHistory.map(appointment => `
        <tr>
            <td>${new Date(appointment.date).toLocaleDateString()}</td>
            <td>${appointment.time}</td>
            <td>${appointment.counselor}</td>
            <td>${appointment.type || 'General'}</td>
            <td>
                <span class="badge" style="background: #10b981; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.85em;">
                    Completed
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewAppointment('${appointment.id}')">View</button>
            </td>
        </tr>
    `).join('');
}

function viewAppointment(appointmentId) {
    const history = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
    const appointment = history.find(a => a.id === appointmentId);
    
    if (!appointment) return;
    
    document.getElementById('appointmentDate').value = new Date(appointment.date).toLocaleDateString();
    document.getElementById('appointmentTime').value = appointment.time;
    document.getElementById('appointmentCounselor').value = appointment.counselor;
    document.getElementById('appointmentType').value = appointment.type || 'General';
    document.getElementById('appointmentStatus').value = 'Completed';
    document.getElementById('appointmentNotes').value = appointment.notes || 'No notes available';
    
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
    localStorage.removeItem('currentUser');
    window.location.href = '../../index.php';
});
