// Coordinator Referrals Management Script

let currentReferral = null;
let allReferrals = [];

function initReferralsPage() {
    initPage();
    
    const params = new URLSearchParams(window.location.search);
    const referralId = params.get('id');

    // Fetch referrals from database
    fetchCoordinatorReferrals()
        .then(() => {
            if (referralId) {
                const referral = allReferrals.find(r => r.id === parseInt(referralId) || r.referral_code === referralId);
                if (referral) {
                    loadReferralDetail(referral);
                } else {
                    loadReferralsList();
                }
            } else {
                loadReferralsList();
            }

            // Setup filter listeners
            document.getElementById('statusFilter').addEventListener('change', applyFilters);
            document.getElementById('urgencyFilter').addEventListener('change', applyFilters);
            document.getElementById('stageFilter').addEventListener('change', applyFilters);
        })
        .catch(error => {
            console.error('Error loading referrals:', error);
            showAlert('Error loading referrals. Please try again.', 'error');
        });
}

function fetchCoordinatorReferrals() {
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo')) || {};
    const userSchool = userInfo.school || '';
    
    // Coordinators can see all referrals from their school
    const apiUrl = `/guidancemanagment/api/referral.php?role=coordinator&school=${encodeURIComponent(userSchool)}`;
    
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

function loadReferralDetail(referral) {
    currentReferral = referral;

    document.getElementById('referralDetailView').style.display = 'block';
    document.getElementById('referralListView').style.display = 'none';

    // Populate details - use snake_case keys from database
    document.getElementById('detailRefId').textContent = referral.referral_code || referral.id;
    document.getElementById('detailStudentName').textContent = referral.student_name;
    document.getElementById('detailStudentId').textContent = referral.student_id || 'N/A';
    document.getElementById('detailGrade').textContent = referral.grade || 'N/A';
    document.getElementById('detailAge').textContent = referral.age || 'N/A';
    document.getElementById('detailGender').textContent = referral.gender || 'N/A';
    document.getElementById('detailSubmittedBy').textContent = referral.teacher_name || 'Unknown';
    document.getElementById('detailDateSubmitted').textContent = formatDate(referral.date_submitted);
    document.getElementById('detailUrgency').textContent = referral.urgency || 'normal';
    document.getElementById('detailStatus').innerHTML = createBadge(getStatusLabel(referral.stage));
    document.getElementById('detailStage').textContent = `${referral.stage}/6`;
    document.getElementById('detailReason').textContent = referral.referral_reason;
    document.getElementById('detailDescription').textContent = referral.description || 'Not provided';
    document.getElementById('detailIntervention').textContent = referral.intervention_attempts || 'Not provided';
    document.getElementById('detailBehaviors').textContent = referral.observed_behaviors || 'Not provided';
    document.getElementById('detailParent').textContent = referral.parent_guardian || 'Not provided';
    document.getElementById('detailContactNum').textContent = referral.parent_contact || 'Not provided';
    document.getElementById('detailContactEmail').textContent = referral.parent_email || 'Not provided';
    document.getElementById('detailFamilyBg').textContent = referral.family_background || 'Not provided';

    // Load stage progress
    loadStageProgress();

    // Load coordinator actions
    loadCoordinatorActions();
}

function loadStageProgress() {
    const container = document.getElementById('stageProgressContainer');
    container.innerHTML = createStageIndicator(currentReferral.stage);
}

function loadCoordinatorActions() {
    const container = document.getElementById('coordinatorActionsContainer');
    let html = '';

    if (currentReferral.stage < 6) {
        html += `<button class="btn btn-primary" onclick="openUpdateStageModal()">Update Stage</button>`;
    }

    if (currentReferral.stage === 6) {
        html += `<p style="color: #999; font-style: italic;">This case is closed. No further actions available.</p>`;
    } else {
        html += `<button class="btn btn-secondary" style="margin-left: 10px;" onclick="openRejectModal()">Reject Referral</button>`;
    }

    container.innerHTML = html;
}

function openUpdateStageModal() {
    document.getElementById('newStage').value = currentReferral.stage;
    openModal('updateStageModal');
}

function saveStageUpdate() {
    const newStage = parseInt(document.getElementById('newStage').value);
    const notes = document.getElementById('stageNotes').value;

    const apiUrl = `/guidancemanagment/api/update-referral.php`;
    
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            referral_id: currentReferral.id,
            stage: newStage,
            status: newStage === 6 ? 'completed' : (newStage === 1 || newStage === 2 ? 'pending' : 'in-progress')
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            currentReferral = result.referral;
            closeModal('updateStageModal');
            showAlert('Referral stage updated successfully!', 'success');
            loadReferralDetail(currentReferral);
        } else {
            showAlert(result.message || 'Error updating stage', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating stage:', error);
        showAlert('Error updating stage. Please try again.', 'error');
    });
}

function openRejectModal() {
    if (confirm('Are you sure you want to reject this referral? This action cannot be undone.')) {
        const apiUrl = `/guidancemanagment/api/update-referral.php`;
        
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                referral_id: currentReferral.id,
                stage: 6,
                status: 'rejected'
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showAlert('Referral rejected successfully!', 'success');
                setTimeout(() => backToList(), 1500);
            } else {
                showAlert(result.message || 'Error rejecting referral', 'error');
            }
        })
        .catch(error => {
            console.error('Error rejecting referral:', error);
            showAlert('Error rejecting referral. Please try again.', 'error');
        });
    }
}

function backToList() {
    document.getElementById('referralDetailView').style.display = 'none';
    document.getElementById('referralListView').style.display = 'block';
    window.history.pushState({}, '', '?');
    loadReferralsList();
}

function loadReferralsList() {
    const tbody = document.getElementById('referralsTableBody');

    if (allReferrals.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="10" style="text-align: center; padding: 30px; color: #999;">No referrals found</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = allReferrals.map(referral => `
        <tr>
            <td><strong>${referral.referral_code || referral.id}</strong></td>
            <td>${referral.student_name}</td>
            <td>${referral.grade || 'N/A'}</td>
            <td>${referral.referral_reason}</td>
            <td>${referral.teacher_name || 'Unknown'}</td>
            <td>${formatDate(referral.date_submitted)}</td>
            <td>${referral.urgency || 'normal'}</td>
            <td>${referral.stage}/6</td>
            <td>${createBadge(getStatusLabel(referral.stage))}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="selectReferral(${referral.id})">Review</button>
            </td>
        </tr>
    `).join('');
}

function selectReferral(referralId) {
    const referral = allReferrals.find(r => r.id === referralId);
    if (referral) {
        window.history.pushState({}, '', `?id=${referral.referral_code || referralId}`);
        loadReferralDetail(referral);
    }
}

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const urgencyFilter = document.getElementById('urgencyFilter').value;
    const stageFilter = document.getElementById('stageFilter').value;

    let filtered = allReferrals;

    if (statusFilter) {
        filtered = filtered.filter(r => getStatusLabel(r.stage) === statusFilter);
    }

    if (urgencyFilter) {
        filtered = filtered.filter(r => r.urgency === urgencyFilter);
    }

    if (stageFilter) {
        filtered = filtered.filter(r => r.stage === parseInt(stageFilter));
    }

    const tbody = document.getElementById('referralsTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="10" style="text-align: center; padding: 30px; color: #999;">No referrals found</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(referral => `
        <tr>
            <td><strong>${referral.referral_code || referral.id}</strong></td>
            <td>${referral.student_name}</td>
            <td>${referral.grade || 'N/A'}</td>
            <td>${referral.referral_reason}</td>
            <td>${referral.teacher_name || 'Unknown'}</td>
            <td>${formatDate(referral.date_submitted)}</td>
            <td>${referral.urgency || 'normal'}</td>
            <td>${referral.stage}/6</td>
            <td>${createBadge(getStatusLabel(referral.stage))}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="selectReferral(${referral.id})">Review</button>
            </td>
        </tr>
    `).join('');
}

function clearFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('urgencyFilter').value = '';
    document.getElementById('stageFilter').value = '';
    loadReferralsList();
}

function getStatusLabel(stage) {
    const labels = {
        1: 'pending',
        2: 'pending',
        3: 'in-progress',
        4: 'in-progress',
        5: 'in-progress',
        6: 'completed'
    };
    return labels[stage] || 'pending';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initReferralsPage);
