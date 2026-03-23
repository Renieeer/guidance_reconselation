// Teacher Referral Status Script

function initReferralStatus() {
    initPage();
    
    const params = new URLSearchParams(window.location.search);
    const referralId = params.get('id');

    if (referralId) {
        loadReferralDetail(referralId);
    } else {
        loadReferralsList();
    }
}

function loadReferralDetail(referralId) {
    const referrals = getData('referrals') || [];
    const referral = referrals.find(r => r.id === referralId);

    if (!referral) {
        document.getElementById('referralDetailContainer').style.display = 'none';
        document.getElementById('referralListContainer').style.display = 'block';
        loadReferralsList();
        return;
    }

    // Show detail container
    document.getElementById('referralDetailContainer').style.display = 'block';
    document.getElementById('referralListContainer').style.display = 'none';

    // Populate details
    document.getElementById('refId').textContent = referral.id;
    document.getElementById('refStudentName').textContent = referral.studentName;
    document.getElementById('refGrade').textContent = referral.grade;
    document.getElementById('refDateSubmitted').textContent = formatDate(referral.dateSubmitted);
    document.getElementById('refUrgency').textContent = referral.urgency;
    document.getElementById('refStatus').innerHTML = createBadge(referral.status);
    document.getElementById('refReason').textContent = referral.referralReason;
    document.getElementById('refDescription').textContent = referral.description;

    // Load stages
    loadStages(referral);
}

function loadStages(referral) {
    const stagesContainer = document.getElementById('stagesContainer');
    
    let html = '<div class="referral-stages">';
    const stages = getAllStages();
    
    stages.forEach(stage => {
        const isActive = stage.id === referral.stage;
        const isCompleted = stage.id < referral.stage;
        const stageClass = isActive ? 'active' : (isCompleted ? 'completed' : '');
        
        html += `<div class="stage ${stageClass}">
                    <div class="stage-circle">${stage.id}</div>
                    <div class="stage-name">${stage.name}</div>
                </div>`;
    });
    
    html += '</div>';

    // Add stage descriptions
    const stageDescriptions = {
        1: 'Your referral has been submitted successfully.',
        2: 'The coordinator is reviewing your referral.',
        3: 'Follow-up information is required from the counselor.',
        4: 'The student is in active counseling.',
        5: 'Ongoing support and monitoring.',
        6: 'The case has been closed.'
    };

    html += `<div style="background: #f9f9f9; padding: 15px; border-radius: 4px; margin-top: 20px;">
                <p><strong>Current Stage:</strong> ${getAllStages()[referral.stage - 1].name}</p>
                <p>${stageDescriptions[referral.stage]}</p>
            </div>`;

    stagesContainer.innerHTML = html;
}

function loadReferralsList() {
    const referrals = getData('referrals') || [];
    const user = getCurrentUser();
    const userReferrals = referrals.filter(r => r.submittedBy === user.email);

    const tbody = document.getElementById('referralListBody');

    if (userReferrals.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="8" style="text-align: center; padding: 30px; color: #999;">
                No referrals found. <a href="referral-form.html">Submit a new referral</a>
            </td>
        </tr>`;
        return;
    }

    tbody.innerHTML = userReferrals.reverse().map(referral => `
        <tr>
            <td><strong>${referral.id}</strong></td>
            <td>${referral.studentName}</td>
            <td>${referral.grade}</td>
            <td>${formatDate(referral.dateSubmitted)}</td>
            <td>${referral.referralReason}</td>
            <td><strong>${referral.stage}/6</strong></td>
            <td>${createBadge(referral.status)}</td>
            <td>
                <a href="?id=${referral.id}" class="btn btn-sm btn-primary">View</a>
            </td>
        </tr>
    `).join('');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initReferralStatus);
