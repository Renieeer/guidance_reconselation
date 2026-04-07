// Teacher Referral Status Script

function initReferralStatus() {
    initPage();
    
    const params = new URLSearchParams(window.location.search);
    const referralId = params.get('id');

    // Fetch teacher's referrals from database
    fetchTeacherReferrals()
        .then(() => {
            if (referralId) {
                const referral = document.allReferralsData.find(r => r.id === parseInt(referralId) || r.referral_code === referralId);
                if (referral) {
                    loadReferralDetail(referral);
                } else {
                    loadReferralsList();
                }
            } else {
                loadReferralsList();
            }
        })
        .catch(error => {
            console.error('Error loading referrals:', error);
            showAlert('Error loading referrals. Please try again.', 'error');
        });
}

function fetchTeacherReferrals() {
    const user = getCurrentUser();
    const teacherSchool = user?.school_attended || '';
    const teacherId = user?.id || null;
    
    // Teachers can only see their own referrals
    const apiUrl = `/guidancemanagment/api/referral.php?role=teacher&school=${encodeURIComponent(teacherSchool)}&user_id=${teacherId}`;
    
    return fetch(apiUrl)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                document.allReferralsData = result.data || [];
            } else {
                throw new Error(result.message || 'Failed to fetch referrals');
            }
        });
}

function loadReferralDetail(referral) {
    // Show detail container
    document.getElementById('referralDetailContainer').style.display = 'block';
    document.getElementById('referralListContainer').style.display = 'none';

    // Populate details - use snake_case keys from database
    document.getElementById('refId').textContent = referral.referral_code || referral.id;
    document.getElementById('refStudentName').textContent = referral.student_name;
    document.getElementById('refGrade').textContent = referral.grade || 'N/A';
    document.getElementById('refDateSubmitted').textContent = formatDate(referral.date_submitted);
    document.getElementById('refUrgency').textContent = referral.urgency || 'normal';
    document.getElementById('refStatus').innerHTML = createBadge(referral.status);
    document.getElementById('refReason').textContent = referral.referral_reason;
    document.getElementById('refDescription').textContent = referral.description || 'No description provided';

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
    const referrals = document.allReferralsData || [];
    const tbody = document.getElementById('referralListBody');

    if (referrals.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="8" style="text-align: center; padding: 30px; color: #999;">
                No referrals found. <a href="referral-form.php">Submit a new referral</a>
            </td>
        </tr>`;
        return;
    }

    tbody.innerHTML = referrals.reverse().map(referral => `
        <tr>
            <td><strong>${referral.referral_code || referral.id}</strong></td>
            <td>${referral.student_name}</td>
            <td>${referral.grade || 'N/A'}</td>
            <td>${formatDate(referral.date_submitted)}</td>
            <td>${referral.referral_reason}</td>
            <td><strong>${referral.stage}/6</strong></td>
            <td>${createBadge(referral.status)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="selectReferral(${referral.id})">View</button>
            </td>
        </tr>
    `).join('');
}

function selectReferral(referralId) {
    const referral = (document.allReferralsData || []).find(r => r.id === referralId);
    if (referral) {
        window.history.pushState({}, '', `?id=${referral.referral_code || referralId}`);
        loadReferralDetail(referral);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initReferralStatus);
