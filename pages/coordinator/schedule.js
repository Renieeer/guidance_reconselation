// Schedule Script

function initSchedulePage() {
    initPage();
    setTodayDate('eventDate');
    loadScheduleEvents();
    document.getElementById('scheduleForm').addEventListener('submit', addScheduleEvent);
}

function addScheduleEvent(e) {
    e.preventDefault();

    const formData = new FormData(document.getElementById('scheduleForm'));
    
    const event = {
        id: generateId(),
        title: formData.get('eventTitle'),
        type: formData.get('eventType'),
        date: formData.get('eventDate'),
        time: formData.get('eventTime'),
        description: formData.get('eventDescription'),
        location: formData.get('eventLocation'),
        createdAt: new Date().toISOString()
    };

    let events = getData('scheduleEvents') || [];
    events.push(event);
    saveData('scheduleEvents', events);

    showAlert('Event added successfully!', 'success');
    document.getElementById('scheduleForm').reset();
    setTodayDate('eventDate');
    loadScheduleEvents();
}

function loadScheduleEvents() {
    const events = getData('scheduleEvents') || [];
    const tbody = document.getElementById('scheduleTableBody');

    if (events.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="6" style="text-align: center; padding: 30px; color: #999;">No scheduled events yet</td>
        </tr>`;
        return;
    }

    // Sort by date
    events.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateA - dateB;
    });

    tbody.innerHTML = events.map(event => `
        <tr>
            <td><strong>${event.title}</strong></td>
            <td>${event.type}</td>
            <td>${formatDate(event.date)}</td>
            <td>${event.time}</td>
            <td>${event.location || '-'}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteEvent('${event.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        let events = getData('scheduleEvents') || [];
        events = events.filter(e => e.id !== eventId);
        saveData('scheduleEvents', events);
        showAlert('Event deleted successfully!', 'success');
        loadScheduleEvents();
    }
}

document.addEventListener('DOMContentLoaded', initSchedulePage);
