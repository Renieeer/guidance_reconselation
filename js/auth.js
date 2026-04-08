
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
            // Store session
            const userData = {
                email: data.user.email,
                role: data.user.role,
                name: data.user.name,
                id: data.user.id
            };
            
            sessionStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('currentUser', JSON.stringify(userData));

            // Redirect to dashboard based on role
            window.location.href = dashboardRoutes[data.user.role];
        } else {
            // If database login fails, try demo users as fallback
            const user = demoUsers[email];
            if (user && user.password === password) {
                // Demo login
                const userData = {
                    email: email,
                    role: user.role,
                    name: user.name,
                    id: user.id || email.split('@')[0]
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
                id: user.id || email.split('@')[0]
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
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = '../../index.php';
    }
    return JSON.parse(user);
}

// Logout function
function logout() {
    sessionStorage.removeItem('user');
    // Optional: Call logout.php if you want server-side logout
    window.location.href = '../../index.php';
}

// Get current user
function getCurrentUser() {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}
