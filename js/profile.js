// "My Profile" page script — shared by every role's pages/<role>/profile.php
// (student, teacher, counselor, coordinator, other-school, sdo). Loaded
// after auth.js and utils.js, the same way dashboard.js etc. are.

function initProfilePage() {
    initPage();
    loadProfile();

    document.getElementById('changePhotoBtn')?.addEventListener('click', () => {
        document.getElementById('avatarInput').click();
    });
    document.getElementById('avatarInput')?.addEventListener('change', onAvatarSelected);
    document.getElementById('removePhotoBtn')?.addEventListener('click', removePhoto);
    document.getElementById('profileForm')?.addEventListener('submit', saveProfileInfo);
}

function getProfileId() {
    const user = getCurrentUser();
    return user ? user.id : null;
}

const PROFILE_ROLE_LABELS = {
    student: 'Student',
    teacher: 'Teacher',
    counselor: 'Counselor',
    coordinator: 'Coordinator',
    'counselor-and-coordinator': 'Counselor & Coordinator',
    sdo: 'SDO',
    admin: 'Administrator'
};

function formatProfileRole(role) {
    return PROFILE_ROLE_LABELS[String(role || '').toLowerCase()] || role || '';
}

function renderAvatarPreview(url) {
    const el = document.getElementById('profileAvatar');
    const removeBtn = document.getElementById('removePhotoBtn');
    if (!el) return;

    if (url) {
        el.innerHTML = `<img src="${url}" alt="">`;
        if (removeBtn) removeBtn.style.display = '';
    } else {
        el.textContent = userInitials(getCurrentUser());
        if (removeBtn) removeBtn.style.display = 'none';
    }
}

function loadProfile() {
    const id = getProfileId();
    if (!id) return;

    fetch(`../../api/profile.php?id=${encodeURIComponent(id)}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(result => {
            if (!result.success || !result.data) {
                throw new Error(result.message || 'Failed to load profile');
            }

            const data = result.data;
            document.getElementById('profileFirstName').value = data.firstName || '';
            document.getElementById('profileLastName').value = data.lastName || '';
            document.getElementById('profileEmail').value = data.email || '';

            const nameEl = document.getElementById('profileName');
            const roleEl = document.getElementById('profileRoleLine');
            if (nameEl) nameEl.textContent = data.name || '';
            if (roleEl) roleEl.textContent = data.school ? `${formatProfileRole(data.role)} · ${data.school}` : formatProfileRole(data.role);

            renderAvatarPreview(data.profileImage ? `../../${data.profileImage}` : null);
            syncStoredUser({
                first_name: data.firstName,
                last_name: data.lastName,
                name: data.name,
                profile_image: data.profileImage || null
            });
        })
        .catch(error => showAlert('Error: ' + error.message, 'error'));
}

// Keeps sessionStorage/localStorage user objects in sync after a profile
// change, so the sidebar avatar/name update immediately without re-login.
function syncStoredUser(patch) {
    ['user', 'userInfo'].forEach(key => {
        const raw = sessionStorage.getItem(key);
        if (!raw) return;
        try {
            const obj = Object.assign(JSON.parse(raw), patch);
            sessionStorage.setItem(key, JSON.stringify(obj));
        } catch (err) { /* ignore malformed storage */ }
    });

    const rawLocal = localStorage.getItem('currentUser');
    if (rawLocal) {
        try {
            const obj = Object.assign(JSON.parse(rawLocal), patch);
            localStorage.setItem('currentUser', JSON.stringify(obj));
        } catch (err) { /* ignore malformed storage */ }
    }

    setUserInfo();
}

function onAvatarSelected(e) {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showAlert('Please choose a JPG, PNG, GIF, or WEBP image.', 'error');
        e.target.value = '';
        return;
    }
    if (file.size > 3 * 1024 * 1024) {
        showAlert('Image is too large. Maximum size is 3 MB.', 'error');
        e.target.value = '';
        return;
    }

    // Instant local preview while the upload is in flight.
    renderAvatarPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append('id', getProfileId());
    formData.append('image', file);

    fetch('../../api/profile.php', { method: 'POST', body: formData })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(result => {
            if (!result.success || !result.data) {
                throw new Error(result.message || 'Failed to upload photo');
            }
            showAlert('Profile photo updated!', 'success');
            renderAvatarPreview(result.data.profileImage ? `../../${result.data.profileImage}` : null);
            syncStoredUser({ profile_image: result.data.profileImage || null });
        })
        .catch(error => {
            showAlert('Error: ' + error.message, 'error');
            loadProfile();
        })
        .finally(() => { e.target.value = ''; });
}

function removePhoto() {
    const id = getProfileId();
    if (!id) return;

    const formData = new FormData();
    formData.append('id', id);
    formData.append('remove_image', '1');

    fetch('../../api/profile.php', { method: 'POST', body: formData })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(result => {
            if (!result.success) throw new Error(result.message || 'Failed to remove photo');
            showAlert('Profile photo removed.', 'success');
            renderAvatarPreview(null);
            syncStoredUser({ profile_image: null });
        })
        .catch(error => showAlert('Error: ' + error.message, 'error'));
}

function saveProfileInfo(e) {
    e.preventDefault();

    const firstName = document.getElementById('profileFirstName').value.trim();
    const lastName = document.getElementById('profileLastName').value.trim();
    const password = document.getElementById('profilePassword').value.trim();
    const passwordConfirm = document.getElementById('profilePasswordConfirm').value.trim();

    if (!firstName || !lastName) {
        showAlert('First name and last name are required', 'error');
        return;
    }

    if (password || passwordConfirm) {
        if (password !== passwordConfirm) {
            showAlert('Passwords do not match', 'error');
            return;
        }
        if (password.length < 6) {
            showAlert('Password must be at least 6 characters', 'error');
            return;
        }
    }

    const formData = new FormData();
    formData.append('id', getProfileId());
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    if (password) {
        formData.append('password', password);
        formData.append('password_confirm', passwordConfirm);
    }

    fetch('../../api/profile.php', { method: 'POST', body: formData })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(result => {
            if (!result.success || !result.data) {
                throw new Error(result.message || 'Failed to save changes');
            }

            showAlert('Profile updated successfully!', 'success');
            document.getElementById('profilePassword').value = '';
            document.getElementById('profilePasswordConfirm').value = '';

            const nameEl = document.getElementById('profileName');
            if (nameEl) nameEl.textContent = result.data.name || '';

            syncStoredUser({
                first_name: result.data.firstName,
                last_name: result.data.lastName,
                name: result.data.name
            });
        })
        .catch(error => showAlert('Error: ' + error.message, 'error'));
}

document.addEventListener('DOMContentLoaded', initProfilePage);
