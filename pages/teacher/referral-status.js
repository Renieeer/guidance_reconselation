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

    // Load stages and handle conditional visibility
    loadStages(referral);
    
    // Show/hide referral information section based on stage
    // Hide while counseling is in progress (stages 1-5)
    const referralInfoSection = document.getElementById('referralInfoSection');
    if (referral.stage >= 4 && referral.stage < 6) {
        referralInfoSection.style.display = 'none';
    } else if (referral.stage === 6) {
        referralInfoSection.style.display = 'none'; // Hide info when showing acknowledgement
    } else {
        referralInfoSection.style.display = 'block'; // Show for stages 1-3
    }
    
    // Show acknowledgement form only when stage 6 (counseling complete/closed)
    const acknowledgementSection = document.getElementById('acknowledgementSection');
    if (referral.stage === 6) {
        acknowledgementSection.style.display = 'block';
        generateAcknowledgementForm(referral);
    } else {
        acknowledgementSection.style.display = 'none';
    }
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

function generateAcknowledgementForm(referral) {
    const formDiv = document.getElementById('acknowledgementForm');
    
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const html = `
        <div class="referral-sheet">
            <h3 class="referral-sheet-title">COUNSELING REFERRAL ACKNOWLEDGEMENT FORM</h3>
            
            <div class="referral-sheet-intro">
                <table border="1" cellpadding="8" width="100%" style="border-collapse: collapse; font-size: 14px;">
                    <tr>
                        <td colspan="2" style="font-weight: bold; background-color: #f0f0f0;">
                            To: <span style="margin-left: 20px;">${referral.student_name}</span>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" style="font-weight: bold; background-color: #f0f0f0;">
                            Referring Person / Unit: <span style="margin-left: 20px;">Teacher</span>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" style="font-weight: bold; background-color: #f0f0f0;">
                            Designation/Department: <span style="margin-left: 20px;">Teaching Staff</span>
                        </td>
                    </tr>
                </table>
            </div>

            <div style="margin-top: 20px; padding: 15px; border: 1px solid #999;">
                <p style="line-height: 1.8; font-size: 14px;">
                    This is to confirm that <strong>${referral.student_name}</strong> whom you referred to us on 
                    <strong>${formatDate(referral.date_submitted)}</strong> has started his/her session<br/>
                    and is being attended by <strong>__________________________</strong>
                </p>
            </div>

            <div style="margin-top: 20px; padding: 15px; border: 1px solid #999;">
                <p style="font-weight: bold; margin-bottom: 10px;">Kindly refer to the checklist below on the status of the case at hand:</p>
                
                <div style="margin-left: 20px; line-height: 1.8; font-size: 14px;">
                    <label style="display: block; margin-bottom: 8px;">
                        <input type="checkbox"> Closed at Intake Interview
                    </label>
                    <label style="display: block; margin-bottom: 8px;">
                        <input type="checkbox"> For Counseling
                    </label>
                    <label style="display: block; margin-bottom: 8px;">
                        <input type="checkbox"> Counseling Sessions are on-going
                    </label>
                    <label style="display: block; margin-bottom: 8px;">
                        <input type="checkbox"> Parent/Guardian Conference Conducted
                    </label>
                    <label style="display: block; margin-bottom: 8px;">
                        <input type="checkbox"> Sessions Completed / Case Terminated
                    </label>
                    <label style="display: block; margin-bottom: 8px;">
                        <input type="checkbox"> Student did not show up
                    </label>
                    <label style="display: block; margin-bottom: 8px;">
                        <input type="checkbox"> Under Monitoring
                    </label>
                    <label style="display: block; margin-bottom: 8px;">
                        <input type="checkbox"> Number of follow-ups made by the Counselor: __________
                    </label>
                    <label style="display: block; margin-bottom: 8px;">
                        <input type="checkbox"> Referred to __________________________
                    </label>
                </div>
            </div>

            <div style="margin-top: 30px; padding: 15px; text-align: center; font-style: italic; line-height: 1.6; font-size: 14px;">
                <p>Thank you.</p>
                <p>Always for the welfare of students,</p>
            </div>

            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #999;">
                <p style="margin-bottom: 8px; font-weight: bold;">Attending Guidance Counselor</p>
                <p style="margin-top: 40px;">_________________________________</p>
                <p style="margin-top: 20px;">Date: <strong>${formattedDate}</strong></p>
            </div>
        </div>
    `;
    
    formDiv.innerHTML = html;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initReferralStatus);

