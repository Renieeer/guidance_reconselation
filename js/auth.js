// Mock auth data
const demoUsers = {
    'student@school.com': { password: 'password123', role: 'student', name: 'Juan Dela Cruz', id: 'STU001' },
    'teacher@school.com': { password: 'password123', role: 'teacher', name: 'Ms. Sarah Johnson'},
    'coordinator@school.com': { password: 'password123', role: 'coordinator', name: 'Mr. James Smith' },
    'counselor@school.com': { password: 'password123', role: 'counselor', name: 'Mrs. Maria Garcia' },
    'sdo@school.com': { password: 'password123', role: 'sdo', name: 'Dr. Robert Wilson' }
};

const dashboardRoutes = {
    student: 'pages/student/dashboard.html',
    teacher: 'pages/teacher/dashboard.html',
    coordinator: 'pages/coordinator/dashboard.html',
    counselor: 'pages/counselor/dashboard.html',
    sdo: 'pages/sdo/dashboard.html'
};

document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const errorDiv = document.getElementById('loginError');

    // Validate
    if (!email || !password || !role) {
        showError('Please fill all fields');
        return;
    }

    // Check credentials
    const user = demoUsers[email];
    if (!user || user.password !== password || user.role !== role) {
        showError('Invalid email, password, or role');
        return;
    }

    // Store session in both sessionStorage and localStorage for persistence
    const userData = {
        email: email,
        role: role,
        name: user.name,
        id: user.id || email.split('@')[0]
    };
    
    sessionStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('currentUser', JSON.stringify(userData));

    // Redirect to dashboard
    window.location.href = dashboardRoutes[role];
});

function showError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

// Check if user is logged in
function checkAuth() {
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = '../../index.html';
    }
    return JSON.parse(user);
}

// Logout function
function logout() {
    sessionStorage.removeItem('user');
    window.location.href = '../../index.html';
}

// Get current user
function getCurrentUser() {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}
