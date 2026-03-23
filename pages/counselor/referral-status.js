// Counselor Referral Status Script

let allReferrals = [];
let currentReferral = null;

function loadReferralStatus() {
    initPage();
    allReferrals = getData('referrals') || [];

    const params = new URLSearchParams(window.location.search);
    const referralId = params.get('id');

    if (referralId) {
        loadDetailView(referralId);
    } else {
        loadListView();
    }

    document.getElementById('stageFilter').addEventListener('change', applyStageFilter);
}

function loadDetailView(referralId) {
    currentReferral = allReferrals.find(r => r.id === referralId);

    if (!currentReferral) {
        loadListView();
        return;
    }

    document.getElementById('detailView').style.display = 'block';
    document.getElementById('listView').style.display = 'none';

    // Load details
    document.getElementById('detRefId').textContent = currentReferral.id;
    document.getElementById('detStudentName').textContent = currentReferral.studentName;
    document.getElementById('detStudentGradeSection').textContent = currentReferral.grade + ' - ' + currentReferral.section;
    document.getElementById('detReason').textContent = currentReferral.referralReason;
    document.getElementById('detDateSubmitted').textContent = formatDate(currentReferral.dateSubmitted);
    document.getElementById('detUrgency').textContent = currentReferral.urgency;
    document.getElementById('detStatus').innerHTML = createBadge(getStatusLabel(currentReferral.stage));
    document.getElementById('detStage').textContent = currentReferral.stage + '/6';

    // Load stages
    const stageContainer = document.getElementById('detailStagesContainer');
    stageContainer.innerHTML = createStageIndicator(currentReferral.stage);

    // Show follow-up form for stage 3
    const followUpSection = document.getElementById('followUpFormSection');
    if (currentReferral.stage === 3) {
        followUpSection.style.display = 'block';
        document.getElementById('followUpForm').addEventListener('submit', submitFollowUp);
    } else {
        followUpSection.style.display = 'none';
    }

    // Load case actions
    loadCaseActions();
}

function submitFollowUp(e) {
    e.preventDefault();

    const formData = new FormData(document.getElementById('followUpForm'));

    const followUp = {
        id: generateId(),
        observations: formData.get('followUpObservations'),
        interventions: formData.get('followUpInterventions'),
        recommendations: formData.get('followUpRecommendations'),
        submittedAt: new Date().toISOString()
    };

    if (!currentReferral.followUpForms) {
        currentReferral.followUpForms = [];
    }

    currentReferral.followUpForms.push(followUp);

    // Save updated referral
    const index = allReferrals.findIndex(r => r.id === currentReferral.id);
    if (index !== -1) {
        allReferrals[index] = currentReferral;
        saveData('referrals', allReferrals);
    }

    showAlert('Follow-up form submitted successfully! Ready to move to next stage.', 'success');
    document.getElementById('followUpForm').reset();
}

function loadCaseActions() {
    const container = document.getElementById('caseActionsContainer');
    let html = '';

    if (currentReferral.stage < 6) {
        html += `<button class="btn btn-primary" onclick="advanceStage()">Advance to Next Stage</button>`;
    }

    if (currentReferral.stage === 6) {
        html += `<p style="color: #999; font-style: italic;">This case is closed.</p>`;
    }

    html += `<button class="btn btn-secondary" style="margin-left: 10px;" onclick="closeCase()">Close Case</button>`;

    container.innerHTML = html;
}

function advanceStage() {
    if (currentReferral.stage === 3 && (!currentReferral.followUpForms || currentReferral.followUpForms.length === 0)) {
        alert('Please complete the follow-up form before advancing.');
        return;
    }

    const newStage = currentReferral.stage + 1;
    currentReferral.stage = newStage;
    currentReferral.status = newStage === 6 ? 'completed' : 'in-progress';

    const index = allReferrals.findIndex(r => r.id === currentReferral.id);
    if (index !== -1) {
        allReferrals[index] = currentReferral;
        saveData('referrals', allReferrals);
    }

    showAlert(`Referral advanced to stage ${newStage}!`, 'success');
    loadDetailView(currentReferral.id);
}

function closeCase() {
    if (confirm('Are you sure you want to close this case?')) {
        currentReferral.stage = 6;
        currentReferral.status = 'completed';

        const index = allReferrals.findIndex(r => r.id === currentReferral.id);
        if (index !== -1) {
            allReferrals[index] = currentReferral;
            saveData('referrals', allReferrals);
        }

        showAlert('Case closed successfully!', 'success');
        backToList();
    }
}

function backToList() {
    document.getElementById('detailView').style.display = 'none';
    document.getElementById('listView').style.display = 'block';
    window.history.pushState({}, '', '?');
    loadListView();
}

function loadListView() {
    const tbody = document.getElementById('referralsTableBody');

    // Filter to counselor's cases (stage 3+)
    const counselorReferrals = allReferrals.filter(r => r.stage >= 3);

    if (counselorReferrals.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="9" style="text-align: center; padding: 30px; color: #999;">No referrals assigned to you yet</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = counselorReferrals.map(referral => `
        <tr>
            <td><strong>${referral.id}</strong></td>
            <td>${referral.studentName}</td>
            <td>${referral.grade}</td>
            <td>${referral.referralReason}</td>
            <td>${formatDate(referral.dateSubmitted)}</td>
            <td>${referral.urgency}</td>
            <td>${referral.stage}/6</td>
            <td>${createBadge(getStatusLabel(referral.stage))}</td>
            <td>
                <a href="?id=${referral.id}" class="btn btn-sm btn-primary">View</a>
            </td>
        </tr>
    `).join('');
}

function applyStageFilter() {
    const stage = document.getElementById('stageFilter').value;
    const tbody = document.getElementById('referralsTableBody');

    let filtered = allReferrals.filter(r => r.stage >= 3);

    if (stage) {
        filtered = filtered.filter(r => r.stage === parseInt(stage));
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="9" style="text-align: center; padding: 30px; color: #999;">No referrals found</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(referral => `
        <tr>
            <td><strong>${referral.id}</strong></td>
            <td>${referral.studentName}</td>
            <td>${referral.grade}</td>
            <td>${referral.referralReason}</td>
            <td>${formatDate(referral.dateSubmitted)}</td>
            <td>${referral.urgency}</td>
            <td>${referral.stage}/6</td>
            <td>${createBadge(getStatusLabel(referral.stage))}</td>
            <td>
                <a href="?id=${referral.id}" class="btn btn-sm btn-primary">View</a>
            </td>
        </tr>
    `).join('');
}

function clearStageFilter() {
    document.getElementById('stageFilter').value = '';
    loadListView();
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

document.addEventListener('DOMContentLoaded', loadReferralStatus);
