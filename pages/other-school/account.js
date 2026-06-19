// Account Settings Script (Combined Coordinator & Counselor)

function loadAccountPage() {
    initPage();
    
    const user = getCurrentUser();
    
    // Load current user data
    if (user) {
        document.getElementById('firstName').value = user.firstName || 'Coordinator';
        document.getElementById('lastName').value = user.lastName || 'Counselor';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
    }

    // Setup form handlers
    document.getElementById('profileForm')?.addEventListener('submit', handleProfileUpdate);
    document.getElementById('securityForm')?.addEventListener('submit', handlePasswordChange);
}

function handleProfileUpdate(e) {
    e.preventDefault();

    const updatedUser = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        role: getCurrentUser().role
    };

    // Save to localStorage
    const users = getData('users') || [];
    const userIndex = users.findIndex(u => u.email === getCurrentUser().email);
    
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updatedUser };
        saveData('users', users);
        localStorage.setItem('currentUser', JSON.stringify({ ...getCurrentUser(), ...updatedUser }));
        alert('Profile updated successfully!');
    }
}

function handlePasswordChange(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }

    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
    }

    const user = getCurrentUser();
    const users = getData('users') || [];
    const userIndex = users.findIndex(u => u.email === user.email);

    if (userIndex !== -1 && users[userIndex].password === currentPassword) {
        users[userIndex].password = newPassword;
        saveData('users', users);
        alert('Password changed successfully!');
        document.getElementById('securityForm').reset();
    } else {
        alert('Current password is incorrect!');
    }
}

function savePreferences() {
    const preferences = {
        emailNotifications: document.getElementById('emailNotifications').checked,
        dailyReport: document.getElementById('dailyReport').checked
    };

    const user = getCurrentUser();
    const users = getData('users') || [];
    const userIndex = users.findIndex(u => u.email === user.email);

    if (userIndex !== -1) {
        users[userIndex].preferences = preferences;
        saveData('users', users);
        alert('Preferences saved successfully!');
    }
}

// Logout functionality
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

