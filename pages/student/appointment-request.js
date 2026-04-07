// Student Appointment Request Script

let currentRequestId = null;
let currentConfirmedId = null;

function initPage() {
    checkAuth('student');
    loadUserInfo();
    setMinDate('preferredDate');
    loadAllAppointments();
    document.getElementById('appointmentRequestForm').addEventListener('submit', submitAppointmentRequest);
}

function setMinDate(elementId) {
    const input = document.getElementById(elementId);
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    input.min = `${year}-${month}-${day}`;
}

function submitAppointmentRequest(e) {
    e.preventDefault();

    const userId = JSON.parse(sessionStorage.getItem('user')).id;
    const studentName = JSON.parse(sessionStorage.getItem('user')).name;

    const request = {
        id: generateId(),
        studentId: userId,
        studentName: studentName,
        preferredDate: document.getElementById('preferredDate').value,
        preferredTime: document.getElementById('preferredTime').value,
        reason: document.getElementById('reason').value,
        description: document.getElementById('description').value,
        status: 'pending', // pending, approved, rejected, proposed_change
        counselorNotes: '',
        proposedDate: null,
        proposedTime: null,
        proposedReason: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    let requests = getData('appointmentRequests') || [];
    requests.push(request);
    saveData('appointmentRequests', requests);

    showAlert('Appointment request submitted successfully!', 'success');
    document.getElementById('appointmentRequestForm').reset();
    setMinDate('preferredDate');
    loadAllAppointments();
}

function loadAllAppointments() {
    const userId = JSON.parse(sessionStorage.getItem('user')).id;
    const requests = getData('appointmentRequests') || [];
    const appointments = getData('appointments') || [];
    
    // Get student's pending/active requests
    const studentRequests = requests.filter(req => req.studentId === userId && req.status !== 'approved');
    
    // Get student's confirmed appointments
    const userAppointments = appointments.filter(a => a.studentId === userId && a.status !== 'cancelled' && a.status !== 'completed');
    
    const tbody = document.getElementById('appointmentsTableBody');
    
    // Combine both arrays with proper status
    const allAppointments = [
        ...studentRequests.map(r => ({
            type: 'request',
            id: r.id,
            date: r.preferredDate,
            time: r.preferredTime,
            reason: r.reason,
            description: r.description,
            status: r.status,
            counselor: '-',
            notes: r.counselorNotes,
            isRequest: true,
            originalData: r
        })),
        ...userAppointments.map(a => ({
            type: 'appointment',
            id: a.id,
            date: a.date,
            time: a.time,
            reason: a.reason,
            description: a.notes,
            status: 'confirmed',
            counselor: a.counselor || '-',
            notes: a.notes,
            isRequest: false,
            originalData: a
        }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (allAppointments.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="6" style="text-align: center; padding: 30px; color: #999;">No appointments yet</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = allAppointments.map(apt => {
        const statusBadge = createStatusBadge(apt.status);
        const reasonText = apt.status === 'proposed_change' ? 
            `${apt.reason} → ${apt.originalData.proposedReason}` : 
            apt.reason;

        return `
            <tr>
                <td>${formatDate(apt.date)}</td>
                <td>${apt.time}</td>
                <td>${capitalizeFirst(reasonText.replace('-', ' '))}</td>
                <td>${apt.counselor}</td>
                <td>${statusBadge}</td>
                <td>
                    ${getActionButtons(apt)}
                </td>
            </tr>
        `;
    }).join('');
}

function getActionButtons(apt) {
    if (apt.isRequest) {
        // For pending requests
        if (apt.status === 'pending') {
            return `<button class="btn btn-sm btn-info" onclick="viewRequest('${apt.id}')"><i class="bi bi-eye"></i> View</button>`;
        } else if (apt.status === 'rejected') {
            return `<button class="btn btn-sm btn-warning" onclick="deleteRequest('${apt.id}')"><i class="bi bi-trash"></i> Delete</button>`;
        } else if (apt.status === 'proposed_change') {
            return `
                <button class="btn btn-sm btn-success" onclick="agreeToProposedChange('${apt.id}')"><i class="bi bi-check-lg"></i> Agree</button>
                <button class="btn btn-sm btn-secondary" onclick="makeCounterProposal('${apt.id}')"><i class="bi bi-arrow-repeat"></i> Counter</button>
            `;
        }
    } else {
        // For confirmed appointments
        const isFuture = new Date(apt.date) > new Date();
        if (isFuture) {
            return `
                <button class="btn btn-sm btn-info" onclick="viewConfirmedAppointment('${apt.id}')"><i class="bi bi-eye"></i> View</button>
                <button class="btn btn-sm btn-warning" onclick="rescheduleAppointment('${apt.id}')"><i class="bi bi-arrow-repeat"></i> Reschedule</button>
            `;
        } else {
            return `<button class="btn btn-sm btn-info" onclick="viewConfirmedAppointment('${apt.id}')"><i class="bi bi-eye"></i> View</button>`;
        }
    }
    return '-';
}

function createStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge" style="background: linear-gradient(135deg, #FFB347 0%, #FFA500 100%); color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px;">⏳ Pending</span>',
        'confirmed': '<span class="badge" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px;">✓ Confirmed</span>',
        'approved': '<span class="badge" style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px;">✓ Approved</span>',
        'rejected': '<span class="badge" style="background: linear-gradient(135deg, #f44336 0%, #da190b 100%); color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px;">✗ Rejected</span>',
        'proposed_change': '<span class="badge" style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px;">📝 Needs Change</span>'
    };
    return badges[status] || status;
}

function viewRequest(requestId) {
    const requests = getData('appointmentRequests') || [];
    const request = requests.find(r => r.id === requestId);

    if (!request) return;

    currentRequestId = requestId;

    let content = `
        <div style="line-height: 1.8;">
            <p><strong>Requested Date:</strong> ${formatDate(request.preferredDate)}</p>
            <p><strong>Requested Time:</strong> ${request.preferredTime}</p>
            <p><strong>Reason:</strong> ${capitalizeFirst(request.reason.replace('-', ' '))}</p>
            <p><strong>Details:</strong> ${request.description || 'No details provided'}</p>
            <hr>
            <p><strong>Status:</strong> ${createStatusBadge(request.status)}</p>
    `;

    if (request.status === 'rejected') {
        content += `
            <hr>
            <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; border-left: 4px solid #f44336;">
                <h4 style="color: #c62828; margin-top: 0;">Decline Reason</h4>
                <p><strong>Message from Counselor:</strong> <em>${request.counselorNotes}</em></p>
                ${request.counselorSuggestion ? `<p><strong>Suggested Next Steps:</strong> <em>${request.counselorSuggestion}</em></p>` : ''}
            </div>
        `;
    } else if (request.counselorNotes && request.status !== 'rejected') {
        content += `<p><strong>Counselor's Note:</strong> <em>${request.counselorNotes}</em></p>`;
    }

    if (request.status === 'proposed_change') {
        content += `
            <hr>
            <h4 style="color: #2196F3;">Proposed Changes:</h4>
            <p><strong>Suggested Date:</strong> ${formatDate(request.proposedDate)}</p>
            <p><strong>Suggested Time:</strong> ${request.proposedTime}</p>
            <p><strong>Reason for Change:</strong> ${request.proposedReason}</p>
        `;
    }

    content += `</div>`;

    document.getElementById('requestModalBody').innerHTML = content;
    document.getElementById('requestModal').style.display = 'flex';
}

function viewConfirmedAppointment(appointmentId) {
    const appointments = getData('appointments') || [];
    const appointment = appointments.find(a => a.id === appointmentId);

    if (!appointment) return;

    const content = `
        <div style="line-height: 1.8;">
            <p><strong>Scheduled Date:</strong> ${formatDate(appointment.date)}</p>
            <p><strong>Time:</strong> ${appointment.time}</p>
            <p><strong>Reason:</strong> ${capitalizeFirst(appointment.reason.replace('-', ' '))}</p>
            <p><strong>Counselor:</strong> ${appointment.counselor || 'TBD'}</p>
            <p><strong>Location:</strong> ${appointment.location || 'TBD'}</p>
            <hr>
            <p><strong>Status:</strong> ${createStatusBadge('confirmed')}</p>
            ${appointment.notes ? `<p><strong>Notes:</strong> <em>${appointment.notes}</em></p>` : ''}
        </div>
    `;

    document.getElementById('requestModalBody').innerHTML = content;
    document.getElementById('requestModal').style.display = 'flex';
}

function agreeToProposedChange(requestId) {
    if (!confirm('Are you sure you want to agree to this proposed appointment time?')) return;

    const requests = getData('appointmentRequests') || [];
    const request = requests.find(r => r.id === requestId);

    if (request) {
        // Create confirmed appointment
        const appointment = {
            id: generateId(),
            studentId: request.studentId,
            studentName: request.studentName,
            requestId: request.id,
            date: request.proposedDate,
            time: request.proposedTime,
            reason: request.proposedReason,
            location: '',
            notes: request.counselorNotes || '',
            status: 'confirmed', // confirmed, completed, cancelled
            createdAt: new Date().toISOString()
        };

        // Mark request as approved
        request.status = 'approved';
        request.updatedAt = new Date().toISOString();

        saveData('appointmentRequests', requests);

        let appointments = getData('appointments') || [];
        appointments.push(appointment);
        saveData('appointments', appointments);

        showAlert('You agreed to the appointment! Added to your schedule.', 'success');
        closeRequestModal();
        loadAllAppointments();
    }
}

function makeCounterProposal(requestId) {
    currentRequestId = requestId;
    const requests = getData('appointmentRequests') || [];
    const request = requests.find(r => r.id === requestId);

    if (request) {
        document.getElementById('editDiscussionDate').value = request.proposedDate;
        document.getElementById('editDiscussionTime').value = request.proposedTime;
        document.getElementById('editDiscussionNotes').value = '';
        closeRequestModal();
        document.getElementById('editDuringDiscussionModal').style.display = 'flex';
    }
}

function submitCounterProposal(e) {
    e.preventDefault();

    const requests = getData('appointmentRequests') || [];
    const request = requests.find(r => r.id === currentRequestId);

    if (request) {
        request.preferredDate = document.getElementById('editDiscussionDate').value;
        request.preferredTime = document.getElementById('editDiscussionTime').value;
        request.status = 'pending'; // Back to pending for counselor review
        request.proposedDate = null;
        request.proposedTime = null;
        request.proposedReason = '';
        request.counselorNotes = `Student counter-proposal: ${document.getElementById('editDiscussionNotes').value}`;
        request.updatedAt = new Date().toISOString();

        saveData('appointmentRequests', requests);
        showAlert('Counter proposal sent to counselor!', 'success');
        closeEditDuringModal();
        loadAllAppointments();
    }
}

function rescheduleAppointment(appointmentId) {
    currentRequestId = appointmentId;
    const appointments = getData('appointments') || [];
    const appt = appointments.find(a => a.id === appointmentId);

    if (appt) {
        document.getElementById('editDiscussionDate').value = appt.date;
        document.getElementById('editDiscussionTime').value = appt.time;
        document.getElementById('editDiscussionNotes').value = '';
        document.getElementById('editDuringDiscussionModal').style.display = 'flex';
    }
}

function submitCounterProposal(e) {
    e.preventDefault();

    const requests = getData('appointmentRequests') || [];
    const request = requests.find(r => r.id === currentRequestId);

    if (request) {
        request.preferredDate = document.getElementById('editDiscussionDate').value;
        request.preferredTime = document.getElementById('editDiscussionTime').value;
        request.status = 'pending';
        request.proposedDate = null;
        request.proposedTime = null;
        request.counselorNotes = `Student counter-proposal: ${document.getElementById('editDiscussionNotes').value}`;
        request.updatedAt = new Date().toISOString();

        saveData('appointmentRequests', requests);
        showAlert('Counter proposal sent to counselor!', 'success');
        closeEditDuringModal();
        loadAllAppointments();
    }
}

function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    const appointments = getData('appointments') || [];
    const appt = appointments.find(a => a.id === appointmentId);

    if (appt) {
        appt.status = 'cancelled';
        saveData('appointments', appointments);
        showAlert('Appointment cancelled!', 'success');
        loadAllAppointments();
    }
}

function deleteRequest(requestId) {
    if (!confirm('Are you sure you want to delete this request?')) return;

    let requests = getData('appointmentRequests') || [];
    requests = requests.filter(r => r.id !== requestId);
    saveData('appointmentRequests', requests);
    showAlert('Request deleted!', 'success');
    loadAllAppointments();
}

function closeRequestModal() {
    document.getElementById('requestModal').style.display = 'none';
    currentRequestId = null;
}

function closeEditDuringModal() {
    document.getElementById('editDuringDiscussionModal').style.display = 'none';
    currentRequestId = null;
    currentConfirmedId = null;
}

// Set up form submission
document.addEventListener('DOMContentLoaded', function() {
    initPage();
    document.getElementById('editDuringDiscussionForm').addEventListener('submit', submitCounterProposal);
});
