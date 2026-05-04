
const dashboardRoutes = {
    student: 'pages/student/dashboard.php',
    teacher: 'pages/teacher/dashboard.php',
    coordinator: 'pages/coordinator/dashboard.php',
    counselor: 'pages/counselor/dashboard.php',
    'counselor-and-coordinator': 'pages/other-school/dashboard.php',
    admin: 'pages/sdo/dashboard.php',
    sdo: 'pages/sdo/dashboard.php'
};



document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    // Validate
    if (!email || !password) {
        showError('Please fill all fields');
        return;
    }

    // Clear all previous user data before logging in
    clearAllUserData();

    // Disable submit button to prevent multiple submissions
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
        // Try database login first
        const response = await fetch('http://localhost/guidancemanagment/api/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (data.success) {
            // Clear any previous user data
            clearAllUserData();
            
            // Store session with new user data
            const userData = {
                email: data.user.email,
                role: data.user.role || data.user.user_type,
                name: data.user.name || `${data.user.firstName} ${data.user.lastName}`,
                id: data.user.id,
                first_name: data.user.firstName,
                last_name: data.user.lastName,
                user_type: data.user.role || data.user.user_type,
                school_attended: data.user.school || 'Unknown'
            };
            
            // Store in sessionStorage for current session
            sessionStorage.setItem('user', JSON.stringify(userData));
            // Optional: Store in localStorage for persistence across tabs
            localStorage.setItem('currentUser', JSON.stringify(userData));

            // Redirect to dashboard based on role
            const targetRoute = dashboardRoutes[userData.role];
            if (!targetRoute) {
                showError('Your account role has no dashboard route configured.');
                return;
            }

            window.location.href = targetRoute;
        } else {
            showError(data.message || 'Invalid email or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Login failed: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});;

function showError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 5000);
    }
}

// Check if user is logged in
function checkAuth() {
    const user = sessionStorage.getItem('userInfo') || sessionStorage.getItem('user');
    if (!user) {
        window.location.href = '../../index.php';
    }
    return JSON.parse(user);
}

// Clear all user data from both sessionStorage and localStorage
function clearAllUserData() {
    // Remove from sessionStorage
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userInfo');
    sessionStorage.removeItem('studentId');
    sessionStorage.removeItem('userName');
    
    // Remove from localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('teacherSchool');
    localStorage.removeItem('referrals');
    localStorage.removeItem('appointments');
    localStorage.removeItem('appointmentHistory');
    
    // Clear any form data
    sessionStorage.removeItem('formData');
    localStorage.removeItem('formData');
    
    console.log('All user data cleared');
}

// Logout function
function logout() {
    clearAllUserData();
    // Call logout.php if you want server-side logout
    try {
        fetch('http://localhost/guidancemanagment/api/logout.php', {
            method: 'POST'
        }).catch(() => {
            // Ignore errors, just proceed to logout
        });
    } catch (e) {
        // Ignore
    }
    window.location.href = '../../index.php';
}

// Toggle password visibility
document.getElementById('togglePassword')?.addEventListener('click', function(e) {
    e.preventDefault();
    const passwordInput = document.getElementById('password');
    const icon = this.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
    }
});

// Get current user
function getCurrentUser() {
    const user = sessionStorage.getItem('userInfo') || sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}
