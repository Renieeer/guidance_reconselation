// Counselor Student Feedback — Messenger-style view of student feedback:
// a conversation list on the left, the active thread on the right.
// Backed by api/feedback.php (?action=staff_list) and
// api/feedback-replies.php (thread fetch + reply post).

const FEEDBACK_TYPE_LABELS = {
    counseling_case: 'Counseling Session',
    appointment: 'Appointment',
    event: 'Calendar Event'
};

let allFeedback = [];
let openFeedbackId = null;

document.addEventListener('DOMContentLoaded', function() {
    initPage();
    loadFeedbackList();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('statusFilter').addEventListener('change', renderConversationList);

    document.getElementById('backToList').addEventListener('click', backToList);

    document.getElementById('threadReplyForm').addEventListener('submit', function(e) {
        e.preventDefault();
        sendReply();
    });

    // Enter sends, Shift+Enter inserts a newline — standard messenger
    // composer behavior.
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

async function loadFeedbackList() {
    const user = getCurrentUser();
    if (!user) return;

    const school = user.school_attended || user.school || '';

    try {
        const response = await fetch(`../../api/feedback.php?action=staff_list&school=${encodeURIComponent(school)}`);
        const data = await response.json();
        allFeedback = data.success ? data.data : [];
    } catch (error) {
        showAlert('Could not load student feedback: ' + error.message, 'error');
        allFeedback = [];
    }

    renderConversationList();
}

function renderConversationList() {
    const container = document.getElementById('conversationListItems');
    const statusFilter = document.getElementById('statusFilter').value;

    const filtered = statusFilter
        ? allFeedback.filter(f => f.status === statusFilter)
        : allFeedback;

    if (filtered.length === 0) {
        container.innerHTML = '<div class="feedback-conversation-list-empty">No feedback found</div>';
        return;
    }

    container.innerHTML = filtered.map(f => {
        const isActive = f.id === openFeedbackId;
        const isUnread = f.status === 'new';
        const preview = f.last_message || f.message;
        return `
            <div class="conversation-item ${isActive ? 'is-active' : ''} ${isUnread ? 'is-unread' : ''}" onclick="selectConversation('${f.id}')">
                <div class="conversation-avatar">${escapeHtml(getInitials(f.student_name))}</div>
                <div class="conversation-info">
                    <div class="conversation-top-row">
                        <span class="conversation-name">${escapeHtml(f.student_name)}</span>
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

async function loadThread() {
    const user = getCurrentUser();
    if (!user || !openFeedbackId) return;

    const school = user.school_attended || user.school || '';

    try {
        const response = await fetch(`../../api/feedback-replies.php?feedback_id=${encodeURIComponent(openFeedbackId)}&school=${encodeURIComponent(school)}`);
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

    document.getElementById('threadSubjectLabel').textContent = feedback.student_name;
    document.getElementById('threadMeta').textContent =
        `${FEEDBACK_TYPE_LABELS[feedback.subject_type] || feedback.subject_type} — ${feedback.subject_label} · ${feedback.feedback_type}`;

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

    const school = user.school_attended || user.school || '';

    try {
        const response = await fetch('../../api/feedback-replies.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                feedback_id: openFeedbackId,
                sender_role: user.role,
                sender_account_id: user.id,
                sender_name: user.name,
                message: message,
                school: school
            })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to send reply');
        }

        input.value = '';
        await loadThread();
        loadFeedbackList();
    } catch (error) {
        showAlert(error.message || 'Failed to send reply', 'error');
    }
}

function getInitials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase();
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

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
}
