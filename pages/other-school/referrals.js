// Combined Coordinator & Counselor Referral Status Script

let allReferrals = [];
let currentReferral = null;

// Shared with the teacher-facing read-only view in
// pages/teacher/referral-status.js — keep both lists in sync if this
// checklist ever changes.
const ACKNOWLEDGEMENT_CHECKLIST_ITEMS = [
    { key: 'closed_intake', label: 'Closed at Intake Interview' },
    { key: 'for_counseling', label: 'For Counseling' },
    { key: 'sessions_ongoing', label: 'Counseling Sessions are on-going' },
    { key: 'parent_conference', label: 'Parent/Guardian Conference Conducted' },
    { key: 'sessions_completed', label: 'Sessions Completed / Case Terminated' },
    { key: 'no_show', label: 'Student did not show up' },
    { key: 'under_monitoring', label: 'Under Monitoring' }
];

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
            document.getElementById('searchBox').addEventListener('input', applyStageFilter);
        })
        .catch(error => {
            console.error('Error loading referrals:', error);
            showAlert('Error loading referrals. Please try again.', 'error');
        });
}

function fetchCounselorReferrals() {
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
    
    // `role=other-school` is required for the API to apply school/grade
    // scoping at all — without it the request falls through to an
    // unfiltered query (see pages/other-school/referrals.js history).
    const apiUrl = `../../api/referral.php?role=other-school&school=${encodeURIComponent(userSchool)}&grade_scope=${encodeURIComponent(getCurrentGradeScope())}`;
    
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

    // Referral Information
    document.getElementById('detReferralReason').textContent = referral.referral_reason || 'Not provided';
    document.getElementById('detDescription').textContent = referral.description || 'Not provided';
    document.getElementById('detIntervention').textContent = referral.intervention_attempts || 'Not provided';
    document.getElementById('detBehaviors').textContent = referral.observed_behaviors || 'Not provided';

    // Family/Contact Information
    document.getElementById('detParent').textContent = referral.parent_guardian || 'Not provided';
    document.getElementById('detContactNum').textContent = referral.parent_contact || 'Not provided';
    document.getElementById('detContactEmail').textContent = referral.parent_email || 'Not provided';
    document.getElementById('detFamilyBg').textContent = referral.family_background || 'Not provided';

    // Load stages
    const stageContainer = document.getElementById('detailStagesContainer');
    stageContainer.innerHTML = createStageIndicator(referral.stage);

    // Show the Initial Screening interview form for stage 2
    const screeningSection = document.getElementById('screeningFormSection');
    if (referral.stage === 2) {
        screeningSection.style.display = 'block';
        document.getElementById('screeningForm').onsubmit = submitScreeningNotes;
        loadScreeningHistory(referral.id);
    } else {
        screeningSection.style.display = 'none';
    }

    // Show the Parent Consent file upload for stage 3
    const consentSection = document.getElementById('consentSection');
    if (referral.stage === 3) {
        consentSection.style.display = 'block';
        document.getElementById('consentUploadForm').onsubmit = submitConsentUpload;
        loadConsentFiles(referral.id);
    } else {
        consentSection.style.display = 'none';
    }

    // Show the case-closing acknowledgement form for stage 6 — filled out
    // here by the counselor, then shown read-only to the referring teacher.
    const acknowledgementSection = document.getElementById('acknowledgementFormSection');
    if (referral.stage === 6) {
        acknowledgementSection.style.display = 'block';
        renderAcknowledgementChecklist();
        document.getElementById('acknowledgementForm').onsubmit = submitAcknowledgement;
        loadAcknowledgement(referral.id);
    } else {
        acknowledgementSection.style.display = 'none';
    }

    // Stages 1, 4, 5 don't have a dedicated documentation form yet —
    // say so explicitly instead of leaving a blank gap that reads as broken.
    document.getElementById('noStageDocSection').style.display =
        (referral.stage === 2 || referral.stage === 3 || referral.stage === 6) ? 'none' : 'block';

    // Load case actions
    loadCaseActions();
}

function renderAcknowledgementChecklist() {
    const container = document.getElementById('ackChecklist');
    container.innerHTML = ACKNOWLEDGEMENT_CHECKLIST_ITEMS.map(item => `
        <label class="referral-checklist-item">
            <input type="checkbox" name="ackChecklist" value="${item.key}">
            <span>${escapeHtml(item.label)}</span>
        </label>
    `).join('');
}

function loadAcknowledgement(referralId) {
    fetch(`../../api/referral-acknowledgement.php?referral_id=${referralId}`)
        .then(response => response.json())
        .then(result => {
            if (!result.success) throw new Error(result.message || 'Failed to load acknowledgement');

            document.getElementById('acknowledgementForm').reset();
            const data = result.data;
            if (!data) return;

            document.getElementById('ackAttendedBy').value = data.attended_by || '';
            document.getElementById('ackFollowUpCount').value = data.follow_up_count || '';
            document.getElementById('ackReferredTo').value = data.referred_to || '';

            const checklist = data.checklist || {};
            document.querySelectorAll('#ackChecklist input[type="checkbox"]').forEach(cb => {
                cb.checked = Boolean(checklist[cb.value]);
            });
        })
        .catch(error => {
            console.error('Error loading acknowledgement:', error);
        });
}

function submitAcknowledgement(e) {
    e.preventDefault();

    const user = getCurrentUser();
    const attendedBy = document.getElementById('ackAttendedBy').value.trim();
    const followUpCount = document.getElementById('ackFollowUpCount').value.trim();
    const referredTo = document.getElementById('ackReferredTo').value.trim();

    const checklist = {};
    document.querySelectorAll('#ackChecklist input[type="checkbox"]').forEach(cb => {
        checklist[cb.value] = cb.checked;
    });

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    fetch('../../api/referral-acknowledgement.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            referral_id: currentReferral.id,
            counselor_id: user?.id || '',
            counselor_name: user?.name || attendedBy,
            attended_by: attendedBy,
            follow_up_count: followUpCount,
            referred_to: referredTo,
            checklist: checklist
        })
    })
    .then(response => response.json())
    .then(result => {
        if (!result.success) throw new Error(result.message || 'Failed to save acknowledgement');
        showAlert('Acknowledgement saved.', 'success');
    })
    .catch(error => {
        showAlert(error.message || 'Failed to save acknowledgement.', 'error');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

function loadScreeningHistory(referralId) {
    const container = document.getElementById('screeningHistoryList');
    if (!container) return;
    container.innerHTML = '<p class="text-muted">Loading previous screening notes...</p>';

    fetch(`../../api/referral-screening.php?referral_id=${referralId}`)
        .then(response => response.json())
        .then(result => {
            if (!result.success) throw new Error(result.message || 'Failed to load screening notes');
            const rows = result.data || [];
            if (rows.length === 0) {
                container.innerHTML = '<p class="text-muted">No screening notes recorded yet.</p>';
                return;
            }
            container.innerHTML = rows.map(row => `
                <div style="background:#f9fafb; border-radius:8px; padding:12px 14px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <strong>${escapeHtml(row.counselor_name || 'Counselor')}</strong>
                        <small class="text-muted">${formatDate(row.created_at)}</small>
                    </div>
                    ${row.risk_level ? `<div><strong>Risk Level:</strong> ${escapeHtml(row.risk_level)}</div>` : ''}
                    ${row.interview_notes ? `<div><strong>Interview Notes:</strong> ${escapeHtml(row.interview_notes)}</div>` : ''}
                    ${row.observations ? `<div><strong>Observations:</strong> ${escapeHtml(row.observations)}</div>` : ''}
                </div>
            `).join('');
        })
        .catch(error => {
            container.innerHTML = `<p class="text-danger">${escapeHtml(error.message)}</p>`;
        });
}

function submitScreeningNotes(e) {
    e.preventDefault();

    const interviewNotes = document.getElementById('screeningInterview').value.trim();
    const observations = document.getElementById('screeningObservations').value.trim();
    const riskLevel = document.getElementById('screeningRiskLevel').value;

    if (!interviewNotes && !observations) {
        showAlert('Enter interview notes or observations before saving.', 'error');
        return;
    }

    const user = getCurrentUser();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    fetch('../../api/referral-screening.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            referral_id: currentReferral.id,
            counselor_id: user?.id || '',
            counselor_name: user?.name || '',
            interview_notes: interviewNotes,
            observations: observations,
            risk_level: riskLevel
        })
    })
    .then(response => response.json())
    .then(result => {
        if (!result.success) throw new Error(result.message || 'Failed to save screening notes');
        showAlert('Screening notes saved.', 'success');
        document.getElementById('screeningForm').reset();
        loadScreeningHistory(currentReferral.id);
    })
    .catch(error => {
        showAlert(error.message || 'Failed to save screening notes.', 'error');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

function loadConsentFiles(referralId) {
    const container = document.getElementById('consentFileList');
    if (!container) return;
    container.innerHTML = '<p class="text-muted">Loading uploaded files...</p>';

    fetch(`../../api/referral-consent.php?referral_id=${referralId}`)
        .then(response => response.json())
        .then(result => {
            if (!result.success) throw new Error(result.message || 'Failed to load consent files');
            const rows = result.data || [];
            if (rows.length === 0) {
                container.innerHTML = '<p class="text-muted">No consent form uploaded yet.</p>';
                return;
            }
            container.innerHTML = rows.map(row => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#f9fafb; border-radius:8px; padding:10px 14px; margin-bottom:8px;">
                    <div>
                        <a href="${row.url}" target="_blank" rel="noopener"><i class="bi bi-file-earmark-check"></i> ${escapeHtml(row.fileName)}</a>
                        <div><small class="text-muted">${((row.fileSize || 0) / 1024).toFixed(1)} KB • Uploaded by ${escapeHtml(row.uploadedBy || 'Unknown')} on ${formatDate(row.uploadedAt)}</small></div>
                    </div>
                </div>
            `).join('');
        })
        .catch(error => {
            container.innerHTML = `<p class="text-danger">${escapeHtml(error.message)}</p>`;
        });
}

function submitConsentUpload(e) {
    e.preventDefault();

    const fileInput = document.getElementById('consentFile');
    const file = fileInput.files[0];
    if (!file) {
        showAlert('Choose a file to upload.', 'error');
        return;
    }

    const user = getCurrentUser();
    const formData = new FormData();
    formData.append('referral_id', currentReferral.id);
    formData.append('uploaded_by', user?.name || '');
    formData.append('file', file);

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';

    fetch('../../api/referral-consent.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (!result.success) throw new Error(result.message || 'Failed to upload file');
        showAlert('Consent form uploaded.', 'success');
        document.getElementById('consentUploadForm').reset();
        loadConsentFiles(currentReferral.id);
    })
    .catch(error => {
        showAlert(error.message || 'Failed to upload file.', 'error');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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
    const newStage = currentReferral.stage + 1;
    const newStatus = newStage === 6 ? 'completed' : 'in-progress';

    // Update to database
    const apiUrl = `../../api/update-referral.php`;
    
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
        const apiUrl = `../../api/update-referral.php`;
        
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

function renderReferralRows(list) {
    const tbody = document.getElementById('referralsTableBody');

    if (list.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="9" style="text-align: center; padding: 30px; color: #999;">No referrals found</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = list.map(referral => `
        <tr>
            <td><strong>${escapeHtml(referral.referral_code || referral.id)}</strong></td>
            <td>${escapeHtml(referral.student_name)}</td>
            <td>${escapeHtml(referral.grade || 'N/A')}</td>
            <td>${escapeHtml(referral.referral_reason)}</td>
            <td>${formatDate(referral.date_submitted)}</td>
            <td>${escapeHtml(referral.urgency || 'normal')}</td>
            <td>${referral.stage}/6</td>
            <td>${createBadge(getStatusLabel(referral.stage))}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="selectReferral(${referral.id})">View</button>
            </td>
        </tr>
    `).join('');
}

function loadListView() {
    renderReferralRows(allReferrals);
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
    const search = (document.getElementById('searchBox').value || '').trim().toLowerCase();

    let filtered = allReferrals;
    if (stage) {
        filtered = filtered.filter(r => r.stage === parseInt(stage));
    }
    if (search) {
        filtered = filtered.filter(r =>
            String(r.student_name || '').toLowerCase().includes(search) ||
            String(r.referral_code || r.id).toLowerCase().includes(search)
        );
    }

    renderReferralRows(filtered);
}

function clearStageFilter() {
    document.getElementById('stageFilter').value = '';
    document.getElementById('searchBox').value = '';
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

