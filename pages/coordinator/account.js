// Account Settings Script

function initAccountPage() {
    initPage();
    const user = getCurrentUser();

    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('fullName').value = user.name;
    document.getElementById('email').value = user.email;

    document.getElementById('profileForm').addEventListener('submit', saveProfile);
    document.getElementById('passwordForm').addEventListener('submit', changePassword);
    document.getElementById('preferencesForm').addEventListener('submit', savePreferences);
}

function saveProfile(e) {
    e.preventDefault();
    showAlert('Profile updated successfully!', 'success');
}

function changePassword(e) {
    e.preventDefault();
    
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    if (newPass !== confirmPass) {
        showAlert('Passwords do not match!', 'error');
        return;
    }

    if (newPass.length < 6) {
        showAlert('Password must be at least 6 characters!', 'error');
        return;
    }

    showAlert('Password changed successfully!', 'success');
    document.getElementById('passwordForm').reset();
}

function savePreferences(e) {
    e.preventDefault();
    showAlert('Preferences saved successfully!', 'success');
}

document.addEventListener('DOMContentLoaded', initAccountPage);
