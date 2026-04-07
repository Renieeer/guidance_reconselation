// Schedule Script (Combined Coordinator & Counselor)

let allAppointments = [];

function loadSchedule() {
    initPage();
    allAppointments = getData('appointments') || [];
    displaySchedule();
    setupAppointmentForm();
}

function displaySchedule() {
    const tbody = document.getElementById('scheduleBody');

    if (allAppointments.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="6" style="text-align: center; padding: 30px; color: #999;">No appointments scheduled</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = allAppointments
        .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
        .map((appt, index) => `
            <tr>
                <td>${formatDate(appt.date)}</td>
                <td>${appt.time}</td>
                <td>${appt.student}</td>
                <td>${appt.type}</td>
                <td><span class="badge badge-info">${appt.status || 'Scheduled'}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editAppointment(${index})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAppointment(${index})">Delete</button>
                </td>
            </tr>
        `).join('');
}

function openAddAppointment() {
    document.getElementById('appointmentModal').style.display = 'block';
}

function closeAddAppointment() {
    document.getElementById('appointmentModal').style.display = 'none';
}

function setupAppointmentForm() {
    const form = document.getElementById('appointmentForm');
    form?.addEventListener('submit', (e) => {
        e.preventDefault();

        const appointment = {
            student: document.getElementById('apptStudent').value,
            date: document.getElementById('apptDate').value,
            time: document.getElementById('apptTime').value,
            type: document.getElementById('apptType').value,
            status: 'Scheduled'
        };

        allAppointments.push(appointment);
        saveData('appointments', allAppointments);

        form.reset();
        closeAddAppointment();
        loadSchedule();
        alert('Appointment added successfully!');
    });
}

function editAppointment(index) {
    const appt = allAppointments[index];
    document.getElementById('apptStudent').value = appt.student;
    document.getElementById('apptDate').value = appt.date;
    document.getElementById('apptTime').value = appt.time;
    document.getElementById('apptType').value = appt.type;

    openAddAppointment();

    // Update form to edit mode
    const form = document.getElementById('appointmentForm');
    const oldSubmit = form.onsubmit;
    form.onsubmit = (e) => {
        e.preventDefault();
        allAppointments[index] = {
            student: document.getElementById('apptStudent').value,
            date: document.getElementById('apptDate').value,
            time: document.getElementById('apptTime').value,
            type: document.getElementById('apptType').value,
            status: allAppointments[index].status
        };
        saveData('appointments', allAppointments);
        form.onsubmit = oldSubmit;
        form.reset();
        closeAddAppointment();
        loadSchedule();
        alert('Appointment updated successfully!');
    };
}

function deleteAppointment(index) {
    if (confirm('Are you sure you want to delete this appointment?')) {
        allAppointments.splice(index, 1);
        saveData('appointments', allAppointments);
        loadSchedule();
    }
}

// Logout functionality
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});
