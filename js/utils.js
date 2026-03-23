// Utility functions

// Save to localStorage (mock database)
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Get from localStorage
function getData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// Show alert message
function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} show`;
    alert.textContent = message;
    
    const container = document.querySelector('.page-content');
    if (container) {
        container.insertBefore(alert, container.firstChild);
        setTimeout(() => alert.remove(), 3000);
    }
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Generate unique ID
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Open modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// Initialize date input with today's date
function setTodayDate(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        const today = new Date().toISOString().split('T')[0];
        input.value = today;
    }
}

// Validate email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Create Badge HTML
function createBadge(status) {
    const badgeClasses = {
        'pending': 'badge-pending',
        'in-progress': 'badge-in-progress',
        'completed': 'badge-completed',
        'rejected': 'badge-rejected'
    };
    return `<span class="badge ${badgeClasses[status] || 'badge-pending'}">${status}</span>`;
}

// Create action buttons
function createActionButtons(id, canEdit = true, canDelete = true) {
    let html = '';
    if (canEdit) html += `<button class="btn btn-sm btn-primary" onclick="editItem('${id}')">Edit</button>`;
    if (canDelete) html += `<button class="btn btn-sm btn-danger" onclick="deleteItem('${id}')">Delete</button>`;
    return html;
}

// Mock referral stages
const referralStages = [
    { id: 1, name: 'Submitted' },
    { id: 2, name: 'Under Review' },
    { id: 3, name: 'Follow-up Required' },
    { id: 4, name: 'In Counseling' },
    { id: 5, name: 'In Progress' },
    { id: 6, name: 'Closed' }
];

// Get stage info
function getStageInfo(stageId) {
    return referralStages.find(s => s.id === stageId);
}

// Get all stages
function getAllStages() {
    return referralStages;
}

// Create stage indicator HTML
function createStageIndicator(currentStage) {
    let html = '<div class="referral-stages">';
    referralStages.forEach(stage => {
        const isActive = stage.id === currentStage;
        const isCompleted = stage.id < currentStage;
        const stageClass = isActive ? 'active' : (isCompleted ? 'completed' : '');
        html += `<div class="stage ${stageClass}">
                    <div class="stage-circle">${stage.id}</div>
                    <div class="stage-name">${stage.name}</div>
                 </div>`;
    });
    html += '</div>';
    return html;
}

// Initialize sidebar logout
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    }
}

// Set user info in topbar
function setUserInfo() {
    const user = getCurrentUser();
    if (user) {
        const nameEl = document.getElementById('userName');
        const avatarEl = document.getElementById('userAvatar');
        
        if (nameEl) nameEl.textContent = user.name;
        if (avatarEl) {
            const initials = user.name.split(' ').map(n => n[0]).join('');
            avatarEl.textContent = initials;
        }
    }
}

// Initialize common page features
function initPage() {
    checkAuth();
    setUserInfo();
    initLogout();
}
