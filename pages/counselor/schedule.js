// Counselor Schedule Script

let currentEditingAppointmentId = null;

function initSchedulePage() {
    initPage();
    loadAppointmentRequests();
    document.getElementById('editAppointmentForm').addEventListener('submit', submitEditAppointment);
    document.getElementById('declineAppointmentForm').addEventListener('submit', submitDeclineAppointment);
}

// ===== APPOINTMENT REQUESTS MANAGEMENT =====
function loadAppointmentRequests() {
    const requests = getData('appointmentRequests') || [];
    const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'proposed_change');
    
    const tbody = document.getElementById('appointmentRequestsBody');

    if (pendingRequests.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="6" style="text-align: center; padding: 30px; color: #999;">No appointment requests received</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = pendingRequests.map(request => {
        const statusBadge = request.status === 'proposed_change' 
            ? '<span class="badge" style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px;">📝 Needs Change</span>'
            : '<span class="badge" style="background: linear-gradient(135deg, #FFB347 0%, #FFA500 100%); color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px;">⏳ Pending</span>';

        return `
            <tr>
                <td><strong>${request.studentName}</strong></td>
                <td>${formatDate(request.preferredDate)}</td>
                <td>${request.preferredTime}</td>
                <td>${capitalizeFirst(request.reason.replace('-', ' '))}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewRequestDetails('${request.id}')"><i class="bi bi-eye"></i> View</button>
                    <button class="btn btn-sm btn-success" onclick="approveAppointment('${request.id}')"><i class="bi bi-check-lg"></i> Approve</button>
                    <button class="btn btn-sm btn-warning" onclick="proposeChanges('${request.id}')"><i class="bi bi-pencil"></i> Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="rejectRequest('${request.id}')"><i class="bi bi-x-lg"></i> Reject</button>
                </td>
            </tr>
        `;
    }).join('');
}

function viewRequestDetails(requestId) {
    const requests = getData('appointmentRequests') || [];
    const request = requests.find(r => r.id === requestId);

    if (!request) return;

    let content = `
        <div style="line-height: 1.8;">
            <h3>${request.studentName}</h3>
            <hr>
            <p><strong>Requested Date:</strong> ${formatDate(request.preferredDate)}</p>
            <p><strong>Requested Time:</strong> ${request.preferredTime}</p>
            <p><strong>Reason:</strong> ${capitalizeFirst(request.reason.replace('-', ' '))}</p>
            <p><strong>Details:</strong> ${request.description || 'No additional details'}</p>
            <p><strong>Status:</strong> ${request.status === 'proposed_change' ? '📝 Needs Change' : '⏳ Pending'}</p>
    `;

    if (request.counselorNotes) {
        content += `<p><strong>Notes:</strong> <em>${request.counselorNotes}</em></p>`;
    }

    if (request.status === 'proposed_change') {
        content += `
            <hr>
            <h4 style="color: #2196F3;">Student's Counter Proposal:</h4>
            <p><strong>Preferred Date:</strong> ${formatDate(request.preferredDate)}</p>
            <p><strong>Preferred Time:</strong> ${request.preferredTime}</p>
            <p><strong>Message:</strong> ${request.counselorNotes || 'No message provided'}</p>
        `;
    }

    content += `</div>`;

    document.getElementById('requestModalBody').innerHTML = content;
    document.getElementById('requestModal').style.display = 'flex';
}

function approveAppointment(requestId) {
    const requests = getData('appointmentRequests') || [];
    const request = requests.find(r => r.id === requestId);

    if (!request) return;

    // Create confirmed appointment directly
    const appointment = {
        id: generateId(),
        studentId: request.studentId,
        studentName: request.studentName,
        requestId: request.id,
        date: request.preferredDate,
        time: request.preferredTime,
        reason: request.reason,
        location: 'Counseling Office',
        notes: '',
        status: 'confirmed',
        createdAt: new Date().toISOString()
    };

    request.status = 'approved';
    request.updatedAt = new Date().toISOString();

    saveData('appointmentRequests', requests);

    let appointments = getData('appointments') || [];
    appointments.push(appointment);
    saveData('appointments', appointments);

    showAlert(`Appointment for ${request.studentName} approved!`, 'success');
    loadAppointmentRequests();
}

function proposeChanges(requestId) {
    const requests = getData('appointmentRequests') || [];
    const request = requests.find(r => r.id === requestId);

    if (!request) return;

    currentEditingAppointmentId = requestId;

    document.getElementById('editStudentName').value = request.studentName;
    document.getElementById('editAppointmentDate').value = request.preferredDate;
    document.getElementById('editAppointmentTime').value = request.preferredTime;
    document.getElementById('editAppointmentLocation').value = 'Counseling Office';
    document.getElementById('editAppointmentNotes').value = 'Counselor update';

    document.getElementById('editAppointmentModal').style.display = 'flex';
}

function submitEditAppointment(e) {
    e.preventDefault();

    const requests = getData('appointmentRequests') || [];
    const request = requests.find(r => r.id === currentEditingAppointmentId);

    if (request) {
        request.proposedDate = document.getElementById('editAppointmentDate').value;
        request.proposedTime = document.getElementById('editAppointmentTime').value;
        request.proposedReason = request.reason; // Keep same reason
        request.status = 'proposed_change'; // Mark as needing student's decision
        request.counselorNotes = document.getElementById('editAppointmentNotes').value;
        request.updatedAt = new Date().toISOString();

        saveData('appointmentRequests', requests);
        showAlert(`Proposed change sent to ${request.studentName}!`, 'success');
        closeEditModal();
        loadAppointmentRequests();
    }
}

function rejectRequest(requestId) {
    const requests = getData('appointmentRequests') || [];
    const request = requests.find(r => r.id === requestId);

    if (!request) return;

    currentEditingAppointmentId = requestId;
    document.getElementById('declineStudentName').value = request.studentName;
    document.getElementById('declineReason').value = '';
    document.getElementById('suggestAlternative').value = '';

    document.getElementById('declineAppointmentModal').style.display = 'flex';
}

function submitDeclineAppointment(e) {
    e.preventDefault();

    const requests = getData('appointmentRequests') || [];
    const request = requests.find(r => r.id === currentEditingAppointmentId);

    if (request) {
        request.status = 'rejected';
        request.counselorNotes = document.getElementById('declineReason').value;
        
        // Store alternative suggestion if provided
        const suggestion = document.getElementById('suggestAlternative').value;
        if (suggestion) {
            request.counselorSuggestion = suggestion;
        }
        
        request.updatedAt = new Date().toISOString();

        saveData('appointmentRequests', requests);
        showAlert(`Request from ${request.studentName} has been declined!`, 'success');
        closeDeclineModal();
        loadAppointmentRequests();
    }
}

function closeDeclineModal() {
    document.getElementById('declineAppointmentModal').style.display = 'none';
    currentEditingAppointmentId = null;
}

function closeEditModal() {
    document.getElementById('editAppointmentModal').style.display = 'none';
    currentEditingAppointmentId = null;
}

function closeRequestModal() {
    document.getElementById('requestModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', initSchedulePage);
