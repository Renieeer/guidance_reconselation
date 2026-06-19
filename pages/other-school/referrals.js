// Referrals Management Script (Combined Coordinator & Counselor)

let allReferrals = [];

function loadReferrals() {
    initPage();
    
    // Fetch referrals from database
    fetchReferrals()
        .then(() => {
            displayReferrals(allReferrals);
            setupFilters();
        })
        .catch(error => {
            console.error('Error loading referrals:', error);
            showAlert('Error loading referrals. Please try again.', 'error');
        });
}

function fetchReferrals() {
    // Get user school using robust multi-source logic
    const getUserSchool = () => {
        try {
            const raw = sessionStorage.getItem('userInfo') || sessionStorage.getItem('user') || localStorage.getItem('currentUser') || localStorage.getItem('teacherSchool');
            if (!raw) return '';
            let parsed = null;
            try { parsed = JSON.parse(raw); } catch (e) { parsed = raw; }
            if (parsed && typeof parsed === 'object') {
                return parsed.school_attended || parsed.school || '';
            }
            return '';
        } catch (e) {
            return '';
        }
    };
    const userSchool = getUserSchool();
    
    // Get referrals for this school
    const apiUrl = `/guidancemanagment/api/referral.php?school=${encodeURIComponent(userSchool)}`;
    
    return fetch(apiUrl)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                allReferrals = result.data || [];
            } else {
                throw new Error(result.message || 'Failed to fetch referrals');
            }
        });
}

function displayReferrals(referrals) {
    const tbody = document.getElementById('referralsBody');

    if (referrals.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="7" style="text-align: center; padding: 30px; color: #999;">No referrals found</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = referrals.map(referral => `
        <tr>
            <td><strong>${referral.referral_code || referral.id}</strong></td>
            <td>${referral.student_name}</td>
            <td>${referral.referral_reason}</td>
            <td>${referral.teacher_name || 'N/A'}</td>
            <td>${formatDate(referral.date_submitted)}</td>
            <td>${createBadge(getStatusLabel(referral.stage))}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewReferral(${referral.id})">Review</button>
                <button class="btn btn-sm btn-secondary" onclick="assignReferral(${referral.id})">Assign</button>
            </td>
        </tr>
    `).join('');
}

function viewReferral(referralId) {
    const referral = allReferrals.find(r => r.id === referralId);
    if (referral) {
        window.location.href = `referrals.php?id=${referral.referral_code || referralId}`;
    }
}

function setupFilters() {
    const filterStage = document.getElementById('filterStage');
    const searchBox = document.getElementById('searchBox');

    filterStage?.addEventListener('change', applyFilters);
    searchBox?.addEventListener('input', applyFilters);
}

function applyFilters() {
    const filterStage = document.getElementById('filterStage').value;
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();

    let filtered = allReferrals;

    if (filterStage) {
        filtered = filtered.filter(r => r.stage == filterStage);
    }

    if (searchTerm) {
        filtered = filtered.filter(r => 
            (r.student_name || '').toLowerCase().includes(searchTerm) || 
            (r.referral_code || r.id).toString().toLowerCase().includes(searchTerm)
        );
    }

    displayReferrals(filtered);
}

function assignReferral(referralId) {
    const referral = allReferrals.find(r => r.id === referralId);
    if (referral && referral.stage < 6) {
        const apiUrl = `/guidancemanagment/api/update-referral.php`;
        
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                referral_id: referralId,
                stage: referral.stage + 1,
                status: referral.stage + 1 === 6 ? 'completed' : 'in-progress'
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showAlert('Referral assigned successfully', 'success');
                loadReferrals();
            } else {
                showAlert(result.message || 'Error assigning referral', 'error');
            }
        })
        .catch(error => {
            console.error('Error assigning referral:', error);
            showAlert('Error assigning referral. Please try again.', 'error');
        });
    }
}

function getStatusLabel(stage) {
    const labels = {
        1: 'pending',
        2: 'pending',
        3: 'processing',
        4: 'processing',
        5: 'processing',
        6: 'completed'
    };
    return labels[stage] || 'unknown';
}

// Logout functionality
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

