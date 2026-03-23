// Coordinator Referrals Management Script

let currentReferral = null;
let allReferrals = [];

function initReferralsPage() {
    initPage();
    
    const params = new URLSearchParams(window.location.search);
    const referralId = params.get('id');

    allReferrals = getData('referrals') || [];

    if (referralId) {
        loadReferralDetail(referralId);
    } else {
        loadReferralsList();
    }

    // Setup filter listeners
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('urgencyFilter').addEventListener('change', applyFilters);
    document.getElementById('stageFilter').addEventListener('change', applyFilters);
}

function loadReferralDetail(referralId) {
    currentReferral = allReferrals.find(r => r.id === referralId);

    if (!currentReferral) {
        backToList();
        return;
    }

    document.getElementById('referralDetailView').style.display = 'block';
    document.getElementById('referralListView').style.display = 'none';

    // Populate details
    document.getElementById('detailRefId').textContent = currentReferral.id;
    document.getElementById('detailStudentName').textContent = currentReferral.studentName;
    document.getElementById('detailStudentId').textContent = currentReferral.studentId;
    document.getElementById('detailGrade').textContent = currentReferral.grade;
    document.getElementById('detailAge').textContent = currentReferral.age;
    document.getElementById('detailGender').textContent = currentReferral.gender;
    document.getElementById('detailSubmittedBy').textContent = currentReferral.submittedByName;
    document.getElementById('detailDateSubmitted').textContent = formatDate(currentReferral.dateSubmitted);
    document.getElementById('detailUrgency').textContent = currentReferral.urgency;
    document.getElementById('detailStatus').innerHTML = createBadge(getStatusLabel(currentReferral.stage));
    document.getElementById('detailStage').textContent = `${currentReferral.stage}/6`;
    document.getElementById('detailReason').textContent = currentReferral.referralReason;
    document.getElementById('detailDescription').textContent = currentReferral.description;
    document.getElementById('detailIntervention').textContent = currentReferral.interventionAttempts || 'Not provided';
    document.getElementById('detailBehaviors').textContent = currentReferral.observedBehaviors || 'Not provided';
    document.getElementById('detailParent').textContent = currentReferral.parentGuardian;
    document.getElementById('detailContactNum').textContent = currentReferral.parentContact;
    document.getElementById('detailContactEmail').textContent = currentReferral.parentEmail || 'Not provided';
    document.getElementById('detailFamilyBg').textContent = currentReferral.familyBackground || 'Not provided';

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

    currentReferral.stage = newStage;
    currentReferral.status = newStage === 6 ? 'completed' : (newStage === 1 || newStage === 2 ? 'pending' : 'in-progress');

    // Save to localStorage
    const index = allReferrals.findIndex(r => r.id === currentReferral.id);
    if (index !== -1) {
        allReferrals[index] = currentReferral;
        saveData('referrals', allReferrals);
    }

    closeModal('updateStageModal');
    showAlert('Referral stage updated successfully!', 'success');
    
    // Reload detail view
    loadReferralDetail(currentReferral.id);
}

function openRejectModal() {
    if (confirm('Are you sure you want to reject this referral? This action cannot be undone.')) {
        currentReferral.status = 'rejected';
        currentReferral.stage = 6;
        
        const index = allReferrals.findIndex(r => r.id === currentReferral.id);
        if (index !== -1) {
            allReferrals[index] = currentReferral;
            saveData('referrals', allReferrals);
        }

        showAlert('Referral rejected successfully!', 'success');
        backToList();
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
            <td><strong>${referral.id}</strong></td>
            <td>${referral.studentName}</td>
            <td>${referral.grade}</td>
            <td>${referral.referralReason}</td>
            <td>${referral.submittedByName}</td>
            <td>${formatDate(referral.dateSubmitted)}</td>
            <td>${referral.urgency}</td>
            <td>${referral.stage}/6</td>
            <td>${createBadge(getStatusLabel(referral.stage))}</td>
            <td>
                <a href="?id=${referral.id}" class="btn btn-sm btn-primary">Review</a>
            </td>
        </tr>
    `).join('');
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
            <td><strong>${referral.id}</strong></td>
            <td>${referral.studentName}</td>
            <td>${referral.grade}</td>
            <td>${referral.referralReason}</td>
            <td>${referral.submittedByName}</td>
            <td>${formatDate(referral.dateSubmitted)}</td>
            <td>${referral.urgency}</td>
            <td>${referral.stage}/6</td>
            <td>${createBadge(getStatusLabel(referral.stage))}</td>
            <td>
                <a href="?id=${referral.id}" class="btn btn-sm btn-primary">Review</a>
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
