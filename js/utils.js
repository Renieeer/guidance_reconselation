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

// Fixed top-right toast, used by pages that call showNotification(message,
// type) directly (e.g. the Documents pages) rather than showAlert(), which
// needs a .page-content container in the DOM to insert into. Reuses the
// same .alert/.alert-{type} CSS so both look identical.
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} show`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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

// Referral stages — mirrors the guidance office's official 6-step intake
// flow (Admission of Case for Referral -> ... -> External Referral).
const referralStages = [
    { id: 1, name: 'Admission of Case', description: 'Case admitted for referral (walk-in, or referred by the adviser, subject teacher, or student).' },
    { id: 2, name: 'Initial Screening', description: 'Initial screening by the counselor — interview, observation, and risk level assessment.' },
    { id: 3, name: 'Parent Consent', description: 'Parent consent obtained for assessment and interventions.' },
    { id: 4, name: 'Assessment Proper', description: 'Assessment proper using tools such as GAD-7, PHQ, Columbia Suicide Severity Rating Scale, HEEADSSS, etc.' },
    { id: 5, name: 'Parent Conference', description: 'Parent conference/discussion — presentation of results and the initial intervention plan.' },
    { id: 6, name: 'External Referral', description: 'External referral, if necessary.' }
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
        logoutBtn.addEventListener('click', requestLogout);
    }
}

// Floating "are you sure?" confirmation shown before any logout button
// actually logs the user out. Builds the dialog on demand and reuses the
// app's existing .modal/.modal-content styling (css/style.css) so it looks
// native wherever it's triggered from, instead of the browser's confirm().
function ensureLogoutConfirmModal() {
    let modal = document.getElementById('logoutConfirmModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'logoutConfirmModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h2>Log Out</h2>
                <button type="button" class="modal-close" id="logoutConfirmClose" aria-label="Cancel">&times;</button>
            </div>
            <div class="modal-body" style="padding: 24px 32px;">
                <p style="margin: 0;">Are you sure you want to log out?</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="logoutConfirmCancel">Cancel</button>
                <button type="button" class="btn btn-danger" id="logoutConfirmOk">Log Out</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const hide = () => modal.classList.remove('show');
    modal.querySelector('#logoutConfirmClose').addEventListener('click', hide);
    modal.querySelector('#logoutConfirmCancel').addEventListener('click', hide);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hide();
    });
    modal.querySelector('#logoutConfirmOk').addEventListener('click', () => {
        hide();
        logout();
    });

    return modal;
}

function requestLogout(e) {
    if (e) e.preventDefault();
    ensureLogoutConfirmModal().classList.add('show');
}

// Set user info in topbar
function setUserInfo() {
    const user = getCurrentUser();
    if (user && user.name) {
        const nameEl = document.getElementById('userName');
        const roleEl = document.getElementById('userRole');
        const avatarEl = document.getElementById('userAvatar');
        
        if (nameEl) nameEl.textContent = user.name;
        if (roleEl && user.role) {
            roleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('-', ' ');
        }
        if (avatarEl && typeof user.name === 'string') {
            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
            avatarEl.textContent = initials || 'U';
        }
    }
}

// Initialize common page features
function initPage() {
    checkAuth();
    setUserInfo();
    initLogout();
}

// ========== GRADE SCOPE ==========
// Mirrors api/grade-scope.php. A staff account's grade scope is a
// comma-separated list of grade numbers (e.g. "7", "11,12", "7,8,9,10")
// stored on the user object as `grade_scope`. Empty/missing means no
// restriction (the account sees every grade at its school), so accounts
// that were never assigned a scope keep working exactly as before.
const GRADE_LEGACY_CODE_MAP = { '1': 7, '2': 8, '3': 9, '4': 10, '5': 11, '6': 12 };

function getCurrentGradeScope() {
    const user = getCurrentUser();
    return (user && user.grade_scope) ? String(user.grade_scope) : '';
}

function gradeScopeToList(scope) {
    return String(scope || '')
        .split(',')
        .map(part => parseInt(part.trim(), 10))
        .filter(num => Number.isInteger(num) && num >= 7 && num <= 12);
}

function normalizeGradeNumber(rawGrade) {
    const raw = String(rawGrade == null ? '' : rawGrade).trim();
    if (!raw) return null;

    if (/^\d+$/.test(raw)) {
        const num = parseInt(raw, 10);
        if (num >= 7 && num <= 12) return num;
        if (GRADE_LEGACY_CODE_MAP[raw] !== undefined) return GRADE_LEGACY_CODE_MAP[raw];
    }

    // Free-text fields (e.g. "Grade 10 - Section Alpha") — pull the first
    // grade-shaped number out of the string rather than requiring an exact match.
    const textMatch = raw.match(/grade\s*(\d{1,2})/i);
    if (textMatch) {
        const num = parseInt(textMatch[1], 10);
        return (num >= 7 && num <= 12) ? num : null;
    }

    return null;
}

// True if `scope` is empty (no restriction) or `rawGrade` normalizes into it.
function gradeMatchesScope(rawGrade, scope) {
    const scopeGrades = gradeScopeToList(scope);
    if (scopeGrades.length === 0) return true;

    const normalized = normalizeGradeNumber(rawGrade);
    return normalized !== null && scopeGrades.includes(normalized);
}

// Human label for a grade scope, e.g. "Grade 8" / "Grades 11-12" / "Grades 7-10".
function gradeScopeLabel(scope) {
    const grades = gradeScopeToList(scope).sort((a, b) => a - b);
    if (grades.length === 0) return '';
    if (grades.length === 1) return `Grade ${grades[0]}`;

    const isConsecutive = grades.every((g, i) => i === 0 || g === grades[i - 1] + 1);
    return isConsecutive
        ? `Grades ${grades[0]}-${grades[grades.length - 1]}`
        : `Grades ${grades.join(', ')}`;
}

// Renders a small "Grade 8 Counselor" / "Coordinator · Grades 7-10" badge
// into the given element (if present). No-op for unassigned accounts so
// schools that don't use per-grade staff splitting see nothing extra.
function renderGradeScopeBadge(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const label = gradeScopeLabel(getCurrentGradeScope());
    if (!label) {
        el.style.display = 'none';
        return;
    }

    const user = getCurrentUser() || {};
    const role = String(user.role || user.user_type || '').toLowerCase();
    const roleLabel = role === 'counselor-and-coordinator' ? 'Coordinator & Counselor' :
        role === 'coordinator' ? 'Coordinator' :
        role === 'counselor' ? 'Counselor' : '';

    el.textContent = roleLabel ? `${roleLabel} · ${label}` : label;
    el.style.display = '';
}

