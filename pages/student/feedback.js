// Student Feedback
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
    loadFeedback();
    setupEventListeners();
});

function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        document.getElementById('userName').textContent = user.name || 'Student';
        const initials = user.name.split(' ').map(n => n[0]).join('');
        document.getElementById('userAvatar').textContent = initials.substring(0, 2);
    }
}

function loadFeedback() {
    const feedbacks = JSON.parse(localStorage.getItem('studentFeedback') || '[]');
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const userId = user?.id;
    
    const userFeedback = feedbacks.filter(f => f.studentId === userId);
    const tbody = document.getElementById('feedbackTableBody');
    
    if (userFeedback.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;">No feedback sent yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = userFeedback.map(feedback => `
        <tr>
            <td>${new Date(feedback.dateSent).toLocaleDateString()}</td>
            <td>${feedback.subject}</td>
            <td>${feedback.type}</td>
            <td>
                <span class="badge" style="background: ${feedback.read ? '#10b981' : '#f59e0b'}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.85em;">
                    ${feedback.read ? 'Read' : 'Unread'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editFeedback('${feedback.id}')"><i class="bi bi-pencil"></i> Edit</button>
            </td>
        </tr>
    `).join('');
}

function editFeedback(feedbackId) {
    const feedbacks = JSON.parse(localStorage.getItem('studentFeedback') || '[]');
    const feedback = feedbacks.find(f => f.id === feedbackId);
    
    if (!feedback) return;
    
    document.getElementById('editFeedbackId').value = feedback.id;
    document.getElementById('editSubject').value = feedback.subject;
    document.getElementById('editMessage').value = feedback.message;
    document.getElementById('editType').value = feedback.type;
    
    document.getElementById('editFeedbackModal').style.display = 'flex';
}

function setupEventListeners() {
    // Send new feedback
    document.getElementById('feedbackForm').addEventListener('submit', function(e) {
        e.preventDefault();
        sendFeedback();
    });
    
    // Edit feedback
    document.getElementById('editFeedbackForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveFeedbackChanges();
    });
    
    // Modal controls
    document.getElementById('closeEditModal').addEventListener('click', () => {
        document.getElementById('editFeedbackModal').style.display = 'none';
    });
    
    document.getElementById('cancelEdit').addEventListener('click', () => {
        document.getElementById('editFeedbackModal').style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('editFeedbackModal');
        if (e.target === modal) modal.style.display = 'none';
    });
}

function sendFeedback() {
    const subject = document.getElementById('feedbackSubject').value;
    const message = document.getElementById('feedbackMessage').value;
    const type = document.getElementById('feedbackType').value;
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    const feedback = {
        id: 'FB-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        studentId: user.id,
        studentName: user.name,
        subject: subject,
        message: message,
        type: type,
        dateSent: new Date().toISOString(),
        read: false
    };
    
    let feedbacks = JSON.parse(localStorage.getItem('studentFeedback') || '[]');
    feedbacks.push(feedback);
    localStorage.setItem('studentFeedback', JSON.stringify(feedbacks));
    
    showNotification('Feedback sent successfully!');
    document.getElementById('feedbackForm').reset();
    loadFeedback();
}

function saveFeedbackChanges() {
    const feedbackId = document.getElementById('editFeedbackId').value;
    const subject = document.getElementById('editSubject').value;
    const message = document.getElementById('editMessage').value;
    const type = document.getElementById('editType').value;
    
    let feedbacks = JSON.parse(localStorage.getItem('studentFeedback') || '[]');
    const feedbackIndex = feedbacks.findIndex(f => f.id === feedbackId);
    
    if (feedbackIndex !== -1) {
        feedbacks[feedbackIndex].subject = subject;
        feedbacks[feedbackIndex].message = message;
        feedbacks[feedbackIndex].type = type;
        feedbacks[feedbackIndex].dateEdited = new Date().toISOString();
        
        localStorage.setItem('studentFeedback', JSON.stringify(feedbacks));
        showNotification('Feedback updated successfully!');
        document.getElementById('editFeedbackModal').style.display = 'none';
        loadFeedback();
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 35px rgba(59, 130, 246, 0.32);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
});
