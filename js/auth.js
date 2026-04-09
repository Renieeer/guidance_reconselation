
const dashboardRoutes = {
    student: 'pages/student/dashboard.php',
    teacher: 'pages/teacher/dashboard.php',
    coordinator: 'pages/coordinator/dashboard.php',
    counselor: 'pages/counselor/dashboard.php',
    'counselor-and-coordinator': 'pages/other-school/dashboard.php',
    sdo: 'pages/sdo/dashboard.php'
};

// Demo credentials for fallback login
const demoUsers = {
    'student@school.com': {
        name: 'Demo Student',
        password: 'password123',
        role: 'student',
        id: 'STU001'
    },
    'teacher@school.com': {
        name: 'Demo Teacher',
        password: 'password123',
        role: 'teacher',
        id: 'TCH001'
    },
    'coordinator@school.com': {
        name: 'Demo Coordinator',
        password: 'password123',
        role: 'coordinator',
        id: 'COORD001'
    },
    'counsilor@school.com': {
        name: 'Demo Counselor',
        password: 'password123',
        role: 'counselor',
        id: 'COUN001'
    },
    'otherschool@school.com': {
        name: 'Demo Other School',
        password: 'password123',
        role: 'other-school',
        id: 'OS001'
    },
    'sdo@school.com': {
        name: 'Demo SDO',
        password: 'password123',
        role: 'sdo',
        id: 'SDO001'
    }
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
            window.location.href = dashboardRoutes[userData.role];
        } else {
            // If database login fails, try demo users as fallback
            const user = demoUsers[email];
            if (user && user.password === password) {
                // Demo login
                const userData = {
                    email: email,
                    role: user.role,
                    name: user.name,
                    id: user.id || email.split('@')[0],
                    first_name: user.name.split(' ')[0],
                    last_name: user.name.split(' ')[1] || 'Demo',
                    user_type: user.role,
                    school_attended: 'Demo School'
                };
                
                sessionStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('currentUser', JSON.stringify(userData));

                // Redirect to dashboard
                window.location.href = dashboardRoutes[user.role];
            } else {
                showError('Invalid email or password');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        // Fallback to demo login on network error
        const user = demoUsers[email];
        if (user && user.password === password) {
            const userData = {
                email: email,
                role: user.role,
                name: user.name,
                id: user.id || email.split('@')[0],
                first_name: user.name.split(' ')[0],
                last_name: user.name.split(' ')[1] || 'Demo',
                user_type: user.role,
                school_attended: 'Demo School'
            };
            
            sessionStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('currentUser', JSON.stringify(userData));

            window.location.href = dashboardRoutes[user.role];
        } else {
            showError('Login failed: ' + error.message);
        }
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

// Get current user
function getCurrentUser() {
    const user = sessionStorage.getItem('userInfo') || sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}
