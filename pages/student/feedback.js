// Student Feedback — targets a specific counseling session, appointment,
// or calendar event the student was actually involved in. Backed by
// api/feedback.php (real DB table), not localStorage.

const FEEDBACK_TYPE_LABELS = {
    counseling_case: 'Counseling Session',
    appointment: 'Appointment',
    event: 'Calendar Event'
};

// Maps a subject_type to the key that API's ?action=options response uses
// for that bucket.
const FEEDBACK_OPTIONS_KEY = {
    counseling_case: 'counseling_cases',
    appointment: 'appointments',
    event: 'events'
};

const FEEDBACK_TYPE_ICONS = {
    counseling_case: 'bi-people',
    appointment: 'bi-calendar-check',
    event: 'bi-calendar-event'
};

let feedbackOptions = { counseling_cases: [], appointments: [], events: [] };
let feedbackHistory = [];
let openFeedbackId = null;

document.addEventListener('DOMContentLoaded', function() {
    initPage();
    loadOptions();
    loadFeedback();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('feedbackForm').addEventListener('submit', function(e) {
        e.preventDefault();
        sendFeedback();
    });

    document.getElementById('feedbackSubjectType').addEventListener('change', populateSubjectIdOptions);

    document.getElementById('openFeedbackFormBtn').addEventListener('click', openFeedbackForm);
    document.getElementById('cancelFeedbackFormBtn').addEventListener('click', hideFeedbackForm);

    document.getElementById('backToList').addEventListener('click', backToList);

    document.getElementById('threadReplyForm').addEventListener('submit', function(e) {
        e.preventDefault();
        sendReply();
    });

    document.getElementById('threadReplyInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendReply();
        }
    });
}

function backToList() {
    document.getElementById('feedbackMessenger').classList.remove('is-showing-thread');
}

function openFeedbackForm() {
    const wrapper = document.getElementById('feedbackFormWrapper');
    wrapper.style.display = 'block';
    wrapper.classList.add('case-form-enter');
    document.getElementById('openFeedbackFormBtn').style.display = 'none';
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideFeedbackForm() {
    const wrapper = document.getElementById('feedbackFormWrapper');
    wrapper.style.display = 'none';
    wrapper.classList.remove('case-form-enter');
    document.getElementById('openFeedbackFormBtn').style.display = '';
}

async function loadOptions() {
    const user = getCurrentUser();
    if (!user) return;

    const school = user.school_attended || user.school || '';

    try {
        const response = await fetch(`../../api/feedback.php?action=options&student_id=${encodeURIComponent(user.id)}&school=${encodeURIComponent(school)}`);
        const data = await response.json();
        if (data.success) {
            feedbackOptions = data.data;
        }
    } catch (error) {
        showAlert('Could not load your counseling sessions/appointments/events: ' + error.message, 'error');
    }

    const typeSelect = document.getElementById('feedbackSubjectType');
    let anyAvailable = false;
    Array.from(typeSelect.options).forEach(option => {
        const subjectType = option.value;
        if (!subjectType) return;
        const key = FEEDBACK_OPTIONS_KEY[subjectType];
        const hasItems = (feedbackOptions[key] || []).length > 0;
        option.disabled = !hasItems;
        const baseLabel = FEEDBACK_TYPE_LABELS[subjectType];
        option.textContent = hasItems ? baseLabel : `${baseLabel} (none yet)`;
        if (hasItems) anyAvailable = true;
    });

    document.getElementById('feedbackForm').style.display = anyAvailable ? '' : 'none';
    document.getElementById('feedbackEmptyState').style.display = anyAvailable ? 'none' : '';
}

function populateSubjectIdOptions() {
    const subjectType = document.getElementById('feedbackSubjectType').value;
    const idSelect = document.getElementById('feedbackSubjectId');
    idSelect.innerHTML = '';

    if (!subjectType) {
        idSelect.disabled = true;
        idSelect.innerHTML = '<option value="">Select a category first</option>';
        return;
    }

    const items = feedbackOptions[FEEDBACK_OPTIONS_KEY[subjectType]] || [];
    if (items.length === 0) {
        idSelect.disabled = true;
        idSelect.innerHTML = '<option value="">No records found</option>';
        return;
    }

    idSelect.disabled = false;
    idSelect.innerHTML = '<option value="">Select one</option>' +
        items.map(item => `<option value="${escapeAttr(item.subject_id)}">${escapeHtml(item.label)}</option>`).join('');
}

async function sendFeedback() {
    const user = getCurrentUser();
    const subjectType = document.getElementById('feedbackSubjectType').value;
    const subjectId = document.getElementById('feedbackSubjectId').value;
    const message = document.getElementById('feedbackMessage').value.trim();
    const feedbackType = document.getElementById('feedbackType').value;

    if (!subjectType || !subjectId) {
        showAlert('Please select what this feedback is about.', 'error');
        return;
    }
    if (!message || !feedbackType) {
        showAlert('Please fill in all required fields.', 'error');
        return;
    }

    try {
        const response = await fetch('../../api/feedback.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: user.id,
                student_name: user.name,
                school: user.school_attended || user.school || '',
                subject_type: subjectType,
                subject_id: subjectId,
                feedback_type: feedbackType,
                message: message
            })
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to send feedback');
        }

        showAlert('Feedback sent successfully!');
        document.getElementById('feedbackForm').reset();
        populateSubjectIdOptions();
        hideFeedbackForm();
        loadFeedback();
    } catch (error) {
        showAlert(error.message || 'Failed to send feedback', 'error');
    }
}

async function loadFeedback() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        const response = await fetch(`../../api/feedback.php?action=list&student_id=${encodeURIComponent(user.id)}`);
        const data = await response.json();
        feedbackHistory = data.success ? data.data : [];
    } catch (error) {
        showAlert('Could not load your feedback history: ' + error.message, 'error');
        feedbackHistory = [];
    }

    renderConversationList();
}

function renderConversationList() {
    const container = document.getElementById('conversationListItems');

    if (feedbackHistory.length === 0) {
        container.innerHTML = '<div class="feedback-conversation-list-empty">No feedback sent yet</div>';
        return;
    }

    container.innerHTML = feedbackHistory.map(f => {
        const isActive = f.id === openFeedbackId;
        // 'replied' = staff sent the latest message — that's what's new
        // for the student to read (opposite of the staff-side unread rule).
        const isUnread = f.status === 'replied';
        const preview = f.last_message || f.message;
        const icon = FEEDBACK_TYPE_ICONS[f.subject_type] || 'bi-chat-dots';
        return `
            <div class="conversation-item ${isActive ? 'is-active' : ''} ${isUnread ? 'is-unread' : ''}" onclick="selectConversation('${f.id}')">
                <div class="conversation-avatar"><i class="bi ${icon}"></i></div>
                <div class="conversation-info">
                    <div class="conversation-top-row">
                        <span class="conversation-name">${escapeHtml(f.subject_label)}</span>
                        <span class="conversation-time">${formatConversationTime(f.last_activity_at)}</span>
                    </div>
                    <div class="conversation-subject">${escapeHtml(FEEDBACK_TYPE_LABELS[f.subject_type] || f.subject_type)}</div>
                    <div class="conversation-preview">${escapeHtml(preview)}</div>
                </div>
                ${isUnread ? '<span class="conversation-unread-dot"></span>' : ''}
            </div>
        `;
    }).join('');
}

async function selectConversation(feedbackId) {
    openFeedbackId = feedbackId;
    renderConversationList();

    document.getElementById('conversationEmpty').style.display = 'none';
    document.getElementById('conversationActive').classList.add('show');
    document.getElementById('feedbackMessenger').classList.add('is-showing-thread');
    document.getElementById('threadMessages').innerHTML = '';
    document.getElementById('threadReplyInput').value = '';

    await loadThread();
}

function formatConversationTime(dateStr) {
    const date = new Date(dateStr);
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function loadThread() {
    const user = getCurrentUser();
    if (!user || !openFeedbackId) return;

    try {
        const response = await fetch(`../../api/feedback-replies.php?feedback_id=${encodeURIComponent(openFeedbackId)}&student_id=${encodeURIComponent(user.id)}`);
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to load conversation');
        }
        renderThread(data.data.feedback, data.data.messages);
    } catch (error) {
        showAlert(error.message || 'Failed to load conversation', 'error');
    }
}

function renderThread(feedback, messages) {
    const user = getCurrentUser();

    document.getElementById('threadSubjectLabel').textContent =
        `${FEEDBACK_TYPE_LABELS[feedback.subject_type] || feedback.subject_type} — ${feedback.subject_label}`;
    document.getElementById('threadMeta').textContent = feedback.feedback_type;

    const openingBubble = {
        sender_account_id: feedback.student_account_id,
        sender_name: feedback.student_name,
        message: feedback.message,
        created_at: feedback.created_at
    };
    const allMessages = [openingBubble, ...messages];

    const container = document.getElementById('threadMessages');
    container.innerHTML = allMessages.map(m => {
        const mine = Number(m.sender_account_id) === Number(user.id);
        return `
            <div class="chat-bubble ${mine ? 'chat-bubble-mine' : 'chat-bubble-theirs'}">
                <span class="chat-bubble-meta">${escapeHtml(m.sender_name)} · ${formatDate(m.created_at)}</span>
                <div class="chat-bubble-text">${escapeHtml(m.message)}</div>
            </div>
        `;
    }).join('');
    container.scrollTop = container.scrollHeight;
}

async function sendReply() {
    const user = getCurrentUser();
    const input = document.getElementById('threadReplyInput');
    const message = input.value.trim();
    if (!message || !openFeedbackId) return;

    try {
        const response = await fetch('../../api/feedback-replies.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                feedback_id: openFeedbackId,
                sender_role: 'student',
                sender_account_id: user.id,
                sender_name: user.name,
                message: message,
                student_id: user.id
            })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to send reply');
        }

        input.value = '';
        await loadThread();
        loadFeedback();
    } catch (error) {
        showAlert(error.message || 'Failed to send reply', 'error');
    }
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
}

function escapeAttr(value) {
    return String(value ?? '').replace(/"/g, '&quot;');
}
