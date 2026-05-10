// Student Schedule
const SCHEDULE_API_URL = '/guidancemanagment/api/schedule-events.php';
let currentCalendarDate = new Date();
let scheduleEventsCache = [];
let studentAppointmentRequests = [];

document.addEventListener('DOMContentLoaded', initSchedulePage);

async function initSchedulePage() {
    checkAuth('student');
    loadUserInfo();
    setupCalendarControls();
    await refreshScheduleEventsSafely();
    await loadStudentAppointmentRequests();
    renderAppointmentCalendar();
    setupEventListeners();
    setupAppointmentForm();
}

function getCurrentUser() {
    try {
         const sessionUser = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (sessionUser && Object.keys(sessionUser).length > 0) {
            return sessionUser;
        }
        return JSON.parse(localStorage.getItem('currentUser') || '{}');
    } catch (err) {
        try {
            return JSON.parse(localStorage.getItem('currentUser') || '{}');
        } catch (fallbackErr) {
            return {};
        }
    }
}

function getCurrentSchool() {
    const user = getCurrentUser();
    return user.school || user.school_attended || '';
}

// Expose weekend helpers on window so they're available in runtime evaluations
window.isWeekend = function(dateStr) {
    // dateStr format: YYYY-MM-DD
    const date = new Date((dateStr || '') + 'T00:00:00');
    const dayOfWeek = isNaN(date.getTime()) ? -1 : date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
};

window.getWeekendName = function(dateStr) {
    const date = new Date((dateStr || '') + 'T00:00:00');
    const dayOfWeek = isNaN(date.getTime()) ? -1 : date.getDay();
    return dayOfWeek === 0 ? 'Sunday' : 'Saturday';
};

function getBookedDates() {
    // Return a Set of dates that have scheduled events or appointment requests
    const booked = new Set();
    
    // Add dates with scheduled events
    if (scheduleEventsCache && Array.isArray(scheduleEventsCache)) {
        scheduleEventsCache.forEach(event => {
            if (event.date) {
                // Add start date and all dates in range if multi-day
                const startDate = new Date(event.date);
                const endDate = event.endDate ? new Date(event.endDate) : startDate;
                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    booked.add(dateStr);
                }
            }
        });
    }
    
    // Add dates with student appointment requests
    if (studentAppointmentRequests && Array.isArray(studentAppointmentRequests)) {
        studentAppointmentRequests.forEach(req => {
            if (req.preferred_date) {
                booked.add(req.preferred_date);
            }
        });
    }
    
    return booked;
}

async function refreshScheduleEvents() {
    const school = getCurrentSchool();
    const month = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}`;
    const query = school && school.toLowerCase() !== 'unknown'
        ? `school=${encodeURIComponent(school)}&month=${encodeURIComponent(month)}`
        : `month=${encodeURIComponent(month)}`;
    const response = await fetch(`${SCHEDULE_API_URL}?${query}`);
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load calendar events');
    }

    scheduleEventsCache = Array.isArray(result.data) ? result.data : [];
}
// end of file
// end of file
function loadUserInfo() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.name || 'Student';
        if (document.getElementById('userRole')) {
            document.getElementById('userRole').textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('-', ' ') : 'Student';
        }
        const initials = String(user.name || 'Student').split(' ').map(n => n[0]).join('');
        document.getElementById('userAvatar').textContent = initials.substring(0, 2);
    }
}

function setupCalendarControls() {
    document.getElementById('schedulePrevMonth')?.addEventListener('click', async () => {
        currentCalendarDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1);
        await refreshScheduleEventsSafely();
        renderAppointmentCalendar();
    });

    document.getElementById('scheduleNextMonth')?.addEventListener('click', async () => {
        currentCalendarDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1);
        await refreshScheduleEventsSafely();
        renderAppointmentCalendar();
    });

    document.getElementById('scheduleTodayBtn')?.addEventListener('click', async () => {
        currentCalendarDate = new Date();
        await refreshScheduleEventsSafely();
        renderAppointmentCalendar();
    });
}

async function refreshScheduleEventsSafely() {
    try {
        await refreshScheduleEvents();
    } catch (error) {
        console.error('Error loading schedule events:', error);
        showAlert(error.message || 'Unable to load schedule events', 'error');
    }
}

async function loadStudentAppointmentRequests() {
    try {
        const user = getCurrentUser();
        if (!user || !user.id) {
            studentAppointmentRequests = [];
            return;
        }

        // Fetch all appointment requests and filter by student_id
        const response = await fetch(`/guidancemanagment/api/appointment-request.php?school=${encodeURIComponent(getCurrentSchool())}`);
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            console.log('No appointment requests found');
            studentAppointmentRequests = [];
            return;
        }

        // Filter requests for this student
        studentAppointmentRequests = (result.data || []).filter(req => req.student_id === user.id);
        console.log('Loaded student appointment requests:', studentAppointmentRequests);
    } catch (error) {
        console.error('Error loading student appointment requests:', error);
        studentAppointmentRequests = [];
    }
}

function formatMonthYear(date) {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getEventColor(eventId) {
    const colors = [
        { bg: '#dbeafe', text: '#1d4ed8' },
        { bg: '#dcfce7', text: '#15803d' },
        { bg: '#fef3c7', text: '#b45309' },
        { bg: '#fee2e2', text: '#b91c1c' },
        { bg: '#fecccc', text: '#c2185b' },
        { bg: '#e9d5ff', text: '#7c3aed' },
        { bg: '#cffafe', text: '#0891b2' },
        { bg: '#fce7f3', text: '#be185d' },
        { bg: '#fed7aa', text: '#92400e' },
        { bg: '#d1fae5', text: '#047857' }
    ];
    const hash = (eventId || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}

function getScheduleEvents() {
    return scheduleEventsCache;
}

function getCalendarItems() {
    const user = getCurrentUser();
    const userId = user?.id;
    const appointments = getData('appointments') || [];
    const scheduleEvents = getScheduleEvents();
    const requestsForMonth = studentAppointmentRequests;

    return {
        appointments: appointments.filter(a => a.studentId === userId),
        scheduleEvents,
        appointmentRequests: requestsForMonth
    };
}

function renderAppointmentCalendar() {
    const { appointments, scheduleEvents, appointmentRequests } = getCalendarItems();
    const calendarEl = document.getElementById('scheduleCalendar');
    const monthEl = document.getElementById('scheduleCalendarMonth');
    if (!calendarEl || !monthEl) return;

    const today = new Date();
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const totalCells = 42;

    monthEl.textContent = formatMonthYear(firstDay);

    let html = '';
    html += '<div class="schedule-calendar-grid">';
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        html += `<div class="schedule-calendar-weekday">${day}</div>`;
    });
    
    function extractDatePart(val) {
        if (!val) return '';
        return String(val).split('T')[0].split(' ')[0];
    }

    function isDateInEvent(event, d) {
        const start = extractDatePart(event.date || '');
        const end = extractDatePart(event.endDate || '') || start;
        if (!start) return false;
        return d >= start && d <= end;
    }

    for (let index = 0; index < totalCells; index++) {
        let cellDay = index - startDay + 1;
        let cellMonth = month;
        let cellYear = year;
        let isOutside = false;

        if (index < startDay) {
            cellDay = daysInPrevMonth - startDay + index + 1;
            cellMonth = month - 1;
            if (cellMonth < 0) {
                cellMonth = 11;
                cellYear -= 1;
            }
            isOutside = true;
        } else if (cellDay > daysInMonth) {
            cellDay = cellDay - daysInMonth;
            cellMonth = month + 1;
            if (cellMonth > 11) {
                cellMonth = 0;
                cellYear += 1;
            }
            isOutside = true;
        }

        const dateStr = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(cellDay).padStart(2, '0')}`;
        const hasAppt = appointments.some(a => String(a.date || '').includes(dateStr));
        const hasSchedule = scheduleEvents.some(event => isDateInEvent(event, dateStr));
        const hasRequest = appointmentRequests.some(req => req.preferred_date === dateStr);
        const isToday = cellDay === today.getDate() && cellMonth === today.getMonth() && cellYear === today.getFullYear();
        
        const bgColor = isToday ? '#dbeafe' : ((hasAppt || hasSchedule || hasRequest) ? '#dcfce7' : '#ffffff');
        const borderColor = (hasAppt || hasSchedule || hasRequest) ? '#10b981' : (isToday ? '#3b82f6' : '#e2e8f0');
        const dayEvents = [
            ...appointments.filter(a => String(a.date || '').startsWith(dateStr)).map(a => ({ id: a.id || '', title: a.reason || 'Appointment', type: a.status || 'Pending', description: a.notes || '', start: a.date || '', end: a.endDate || '', isRequest: false })),
            ...scheduleEvents.filter(event => isDateInEvent(event, dateStr)).map(event => ({ id: event.id || '', title: event.title || 'Schedule', type: event.type || 'Event', description: event.description || '', start: event.date || '', end: event.endDate || '', isRequest: false })),
            ...appointmentRequests.filter(req => req.preferred_date === dateStr).map(req => ({ id: req.id || '', title: req.student_name || 'Request', type: 'pending', description: req.reason || '', start: req.preferred_date || '', end: req.preferred_date || '', isRequest: true, requestData: req }))
        ];
        
        html += `<div class="schedule-calendar-day ${isOutside ? 'is-outside' : ''} ${isToday ? 'is-today' : ''}" style="border: 2px solid ${borderColor}; background: ${bgColor}; cursor: pointer; border-radius: 6px;">
            <div class="schedule-day-number" style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:50%; font-weight:700; font-size:13px; margin-bottom:6px; ${isToday ? 'background:#3b82f6; color:white;' : 'background:#f1f5f9; color:#64748b;'}">${cellDay}</div>
            <div class="schedule-event-list">`;

        dayEvents.forEach(item => {
            const itemTitle = escapeHtml(item.title);
            const color = getEventColor(item.id);
            html += `<div class="schedule-event-block" onclick="openViewEventModal('${item.id}')" data-event-id="${item.id}" style="padding: 6px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; line-height: 1.3; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; display: block; background: ${color.bg}; color: ${color.text};">${itemTitle}</div>`;
        });

        html += '</div></div>';
    }
    
    html += '</div>';
    calendarEl.innerHTML = html;
    attachCalendarClickHandlers();
}

function attachCalendarClickHandlers() {
    const container = document.getElementById('scheduleCalendar');
    if (!container) return;
    if (container.dataset.listenerAttached) return;
    container.addEventListener('click', function(e) {
        const chip = e.target.closest('.schedule-event-block');
        if (!chip) return;
        const id = chip.getAttribute('data-event-id');
        if (id) {
            openViewEventModal(id);
            return;
        }
    });
    container.dataset.listenerAttached = '1';
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

    // View event modal listeners
    const viewModal = document.getElementById('viewEventModal');
    const closeViewX = document.getElementById('closeViewEventModal');
    const editBtn = document.getElementById('editEventBtn');
    const seeMoreBtn = document.getElementById('seeMoreDetailsBtn');
    
    if (closeViewX) closeViewX.addEventListener('click', () => { if (viewModal) viewModal.style.display = 'none'; });
    if (viewModal) {
        viewModal.addEventListener('click', (e) => { if (e.target === viewModal) viewModal.style.display = 'none'; });
    }
    if (seeMoreBtn) seeMoreBtn.addEventListener('click', () => { if (viewModal) viewModal.style.display = 'none'; });
    if (editBtn) editBtn.addEventListener('click', editCurrentEvent);

    // Appointment request modal listeners
    const requestModal = document.getElementById('viewAppointmentRequestModal');
    const closeRequestX = document.getElementById('closeAppointmentRequestModal');
    
    if (closeRequestX) closeRequestX.addEventListener('click', () => { if (requestModal) requestModal.style.display = 'none'; });
    if (requestModal) {
        requestModal.addEventListener('click', (e) => { if (e.target === requestModal) requestModal.style.display = 'none'; });
    }
}

let currentViewingEventId = '';

function openViewEventModal(eventId) {
    const appointments = getData('appointments') || [];
    const appt = appointments.find(a => a.id === eventId);
    if (appt) {
        viewAppointment(eventId);
        return;
    }

    // Check if this is an appointment request
    const request = studentAppointmentRequests.find(r => r.id === eventId);
    if (request) {
        openViewAppointmentRequestModal(request);
        return;
    }

    const events = getScheduleEvents();
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;

    currentViewingEventId = ev.id || '';
    
    const start = ev.date || '';
    const end = ev.endDate || '';
    function formatRange(s, e) {
        if (!s) return '';
        if (!e || e === s) return new Date(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        return `${new Date(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${new Date(e).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    }

    document.getElementById('viewEventTitle').textContent = ev.title || 'Event';
    document.getElementById('viewEventRange').textContent = formatRange(start, end);
    document.getElementById('viewEventTime').textContent = ev.allDay ? 'All Day' : (ev.time || '');
    document.getElementById('viewEventDescription').textContent = ev.description || 'No description';

    // Hide Edit button for students (only show for coordinator/counselor)
    const editBtn = document.getElementById('editEventBtn');
    const user = getCurrentUser();
    if (editBtn) {
        const userRole = (user?.role || '').toLowerCase();
        editBtn.style.display = (userRole === 'coordinator' || userRole === 'counselor') ? 'flex' : 'none';
    }

    const viewModal = document.getElementById('viewEventModal');
    if (viewModal) viewModal.style.display = 'flex';
}

function editCurrentEvent() {
    // Placeholder for editing logic - can be expanded later
    const user = getCurrentUser();
    const userRole = (user?.role || '').toLowerCase();
    if (userRole !== 'coordinator' && userRole !== 'counselor') {
        showAlert('You do not have permission to edit events', 'error');
        return;
    }
    showAlert('Edit event: ' + currentViewingEventId, 'info');
}

function openViewAppointmentRequestModal(request) {
    const modal = document.getElementById('viewAppointmentRequestModal');
    if (!modal) return;

    document.getElementById('requestReason').textContent = request.reason ? request.reason.replace(/-/g, ' ') : 'Not specified';
    document.getElementById('requestDateTime').textContent = `${new Date(request.preferred_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at ${request.preferred_time}`;
    
    const statusBadgeMap = {
        'pending': '⏳ Pending',
        'approved': '✓ Approved',
        'proposed_change': '📝 Needs Change',
        'rejected': '✗ Rejected'
    };
    document.getElementById('requestStatus').textContent = statusBadgeMap[request.status] || request.status;

    const notesSection = document.getElementById('requestNotesSection');
    if (request.notes && request.notes.trim()) {
        document.getElementById('requestNotes').textContent = request.notes;
        if (notesSection) notesSection.style.display = 'flex';
    } else {
        if (notesSection) notesSection.style.display = 'none';
    }

    if (modal) modal.style.display = 'flex';
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    sessionStorage.removeItem('user');
    window.location.href = '../../index.php';
});

// ===== APPOINTMENT REQUEST FORM =====
function setupAppointmentForm() {
    const requestBtn = document.getElementById('requestAppointmentBtn');
    const formPanel = document.getElementById('appointmentFormPanel');
    const closeBtn = document.getElementById('closeFormPanel');
    const form = document.getElementById('appointmentRequestForm');
    const dateInput = document.getElementById('appointmentDateInput');

    requestBtn?.addEventListener('click', () => {
        formPanel.style.display = 'block';
        dateInput.focus();
    });

    closeBtn?.addEventListener('click', () => {
        formPanel.style.display = 'none';
    });

    form?.addEventListener('submit', submitAppointmentRequest);
    
    // Add validation for date input using both input and change events for reliability
    const validateDateInput = function() {
        const selectedDate = this.value;
        if (!selectedDate) return;
        
        // Check if weekend
        if (isWeekend(selectedDate)) {
            const dayName = getWeekendName(selectedDate);
            showAlert(`${dayName} is not available. Please select a weekday.`, 'error');
            this.value = '';
            return;
        }
        
        // Check if booked
        const booked = getBookedDates();
        if (booked.has(selectedDate)) {
            showAlert('This date already has scheduled events. Please choose another date.', 'error');
            this.value = '';
            return;
        }
    };
    
    dateInput?.addEventListener('input', validateDateInput);
    dateInput?.addEventListener('change', validateDateInput);
    dateInput?.addEventListener('blur', validateDateInput);
}

function updateDisabledDates() {
    // This function is kept for compatibility but the actual validation
    // is now handled in setupAppointmentForm()
}

async function submitAppointmentRequest(e) {
    e.preventDefault();

    const dateInput = document.getElementById('appointmentDateInput').value;
    const timeInput = document.getElementById('appointmentTimeInput').value;
    const reasonSelect = document.getElementById('appointmentReasonSelect').value;
    const notesInput = document.getElementById('appointmentNotesInput').value;

    if (!dateInput || !timeInput || !reasonSelect) {
        showAlert('Please fill all required fields', 'error');
        return;
    }

    // Check if weekend
    if (isWeekend(dateInput)) {
        const dayName = getWeekendName(dateInput);
        showAlert(`${dayName} is not available. Please select a weekday.`, 'error');
        return;
    }

    // Check if booked
    const booked = getBookedDates();
    if (booked.has(dateInput)) {
        showAlert('This date already has scheduled events. Please choose another date.', 'error');
        return;
    }

    const user = getCurrentUser();
    const appointmentRequest = {
        student_id: user.id,
        student_name: user.name,
        preferred_date: dateInput,
        preferred_time: timeInput,
        reason: reasonSelect,
        notes: notesInput,
        school: getCurrentSchool(),
        status: 'pending'
    };

    try {
        const response = await fetch('http://localhost/guidancemanagment/api/appointment-request.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentRequest)
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to submit appointment request');
        }

        showAlert('Appointment request submitted successfully!', 'success');
        document.getElementById('appointmentRequestForm').reset();
        document.getElementById('appointmentFormPanel').style.display = 'none';
        
        // Refresh calendar to show any updates
        await refreshScheduleEventsSafely();
        renderAppointmentCalendar();
    } catch (error) {
        console.error('Error submitting appointment request:', error);
        showAlert(error.message || 'Failed to submit appointment request', 'error');
    }
}
