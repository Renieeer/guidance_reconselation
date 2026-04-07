// Counselor Referral Status Script

let allReferrals = [];
let currentReferral = null;

function loadReferralStatus() {
    initPage();
    
    const params = new URLSearchParams(window.location.search);
    const referralId = params.get('id');

    // Fetch referrals from database
    fetchCounselorReferrals()
        .then(() => {
            if (referralId) {
                const referral = allReferrals.find(r => r.id === parseInt(referralId) || r.referral_code === referralId);
                if (referral) {
                    loadDetailView(referral);
                } else {
                    loadListView();
                }
            } else {
                loadListView();
            }

            document.getElementById('stageFilter').addEventListener('change', applyStageFilter);
        })
        .catch(error => {
            console.error('Error loading referrals:', error);
            showAlert('Error loading referrals. Please try again.', 'error');
        });
}

function fetchCounselorReferrals() {
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo')) || {};
    const userSchool = userInfo.school || '';
    
    const apiUrl = `/guidancemanagment/api/referral.php?role=counselor&school=${encodeURIComponent(userSchool)}`;
    
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

function loadDetailView(referral) {
    currentReferral = referral;

    document.getElementById('detailView').style.display = 'block';
    document.getElementById('listView').style.display = 'none';

    // Load details - use snake_case keys from database
    document.getElementById('detRefId').textContent = referral.referral_code || referral.id;
    document.getElementById('detStudentName').textContent = referral.student_name;
    document.getElementById('detStudentGradeSection').textContent = (referral.grade || 'N/A') + ' - ' + (referral.section || 'N/A');
    document.getElementById('detReason').textContent = referral.referral_reason;
    document.getElementById('detDateSubmitted').textContent = formatDate(referral.date_submitted);
    document.getElementById('detUrgency').textContent = referral.urgency || 'normal';
    document.getElementById('detStatus').innerHTML = createBadge(getStatusLabel(referral.stage));
    document.getElementById('detStage').textContent = referral.stage + '/6';

    // Load stages
    const stageContainer = document.getElementById('detailStagesContainer');
    stageContainer.innerHTML = createStageIndicator(referral.stage);

    // Show follow-up form for stage 3
    const followUpSection = document.getElementById('followUpFormSection');
    if (referral.stage === 3) {
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
    const newStatus = newStage === 6 ? 'completed' : 'in-progress';

    // Update to database
    const apiUrl = `/guidancemanagment/api/update-referral.php`;
    
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            referral_id: currentReferral.id,
            stage: newStage,
            status: newStatus
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            currentReferral = result.referral;
            showAlert(`Referral advanced to stage ${newStage}!`, 'success');
            loadDetailView(currentReferral);
        } else {
            showAlert(result.message || 'Error advancing stage', 'error');
        }
    })
    .catch(error => {
        console.error('Error advancing stage:', error);
        showAlert('Error advancing stage. Please try again.', 'error');
    });
}

function closeCase() {
    if (confirm('Are you sure you want to close this case?')) {
        const apiUrl = `/guidancemanagment/api/update-referral.php`;
        
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                referral_id: currentReferral.id,
                stage: 6,
                status: 'completed'
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                currentReferral = result.referral;
                showAlert('Case closed successfully!', 'success');
                setTimeout(() => backToList(), 1500);
            } else {
                showAlert(result.message || 'Error closing case', 'error');
            }
        })
        .catch(error => {
            console.error('Error closing case:', error);
            showAlert('Error closing case. Please try again.', 'error');
        });
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

    if (allReferrals.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="9" style="text-align: center; padding: 30px; color: #999;">No referrals found for your school</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = allReferrals.map(referral => `
        <tr>
            <td><strong>${referral.referral_code || referral.id}</strong></td>
            <td>${referral.student_name}</td>
            <td>${referral.grade || 'N/A'}</td>
            <td>${referral.referral_reason}</td>
            <td>${formatDate(referral.date_submitted)}</td>
            <td>${referral.urgency || 'normal'}</td>
            <td>${referral.stage}/6</td>
            <td>${createBadge(getStatusLabel(referral.stage))}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="selectReferral(${referral.id})">View</button>
            </td>
        </tr>
    `).join('');
}

function selectReferral(referralId) {
    const referral = allReferrals.find(r => r.id === referralId);
    if (referral) {
        window.history.pushState({}, '', `?id=${referral.referral_code || referralId}`);
        loadDetailView(referral);
    }
}

function applyStageFilter() {
    const stage = document.getElementById('stageFilter').value;
    const tbody = document.getElementById('referralsTableBody');

    // Filter by stage if selected
    let filtered = allReferrals;
    if (stage) {
        filtered = allReferrals.filter(r => r.stage === parseInt(stage));
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="9" style="text-align: center; padding: 30px; color: #999;">No referrals found</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(referral => `
        <tr>
            <td><strong>${referral.referral_code || referral.id}</strong></td>
            <td>${referral.student_name}</td>
            <td>${referral.grade || 'N/A'}</td>
            <td>${referral.referral_reason}</td>
            <td>${formatDate(referral.date_submitted)}</td>
            <td>${referral.urgency || 'normal'}</td>
            <td>${referral.stage}/6</td>
            <td>${createBadge(getStatusLabel(referral.stage))}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="selectReferral(${referral.id})">View</button>
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
