// Counselor Referral Status Script

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
    
    const apiUrl = `../../api/referral.php?role=counselor&school=${encodeURIComponent(userSchool)}&grade_scope=${encodeURIComponent(getCurrentGradeScope())}`;
    
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


// ── Walk-in referral creation — lets the counselor log a referral
// directly for a student who comes to the guidance office in person,
// instead of only ever viewing referrals a teacher already submitted.
// Reuses api/referral.php's existing POST handler (no role check there),
// just with the logged-in staff member's own identity as the referrer.
function initWalkInReferralForm() {
    document.getElementById('openReferralFormBtn').addEventListener('click', openReferralForm);
    document.getElementById('cancelReferralFormBtn').addEventListener('click', hideReferralForm);
    document.getElementById('newReferralForm').addEventListener('submit', submitWalkInReferral);
    setupWalkInStudentSearch();
}

function openReferralForm() {
    const wrapper = document.getElementById('referralFormWrapper');
    wrapper.style.display = 'block';
    wrapper.classList.add('case-form-enter');
    document.getElementById('openReferralFormBtn').style.display = 'none';
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideReferralForm() {
    const wrapper = document.getElementById('referralFormWrapper');
    wrapper.style.display = 'none';
    wrapper.classList.remove('case-form-enter');
    document.getElementById('openReferralFormBtn').style.display = '';
}

function getWalkInUserSchool() {
    try {
        const raw = sessionStorage.getItem('userInfo') || sessionStorage.getItem('user') || localStorage.getItem('currentUser') || localStorage.getItem('teacherSchool');
        if (!raw) return '';
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch (e) { parsed = raw; }
        if (parsed && typeof parsed === 'object') return parsed.school_attended || parsed.school || '';
        return '';
    } catch (e) {
        return '';
    }
}

// Same autocomplete UX as the teacher's referral form
// (pages/teacher/referral-form.js), restricted to the staff member's own
// school, adapted to this form's element ids.
function setupWalkInStudentSearch() {
    const input = document.getElementById('newRefStudentName');
    const status = document.getElementById('newRefSearchStatus');
    const listEl = document.getElementById('newRefSuggestionList');
    let searchTimeout;

    input.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        document.getElementById('newRefStudentId').value = '';
        const term = this.value.trim();
        status.textContent = '';
        listEl.innerHTML = '';
        if (term.length < 2) return;

        searchTimeout = setTimeout(() => {
            const school = getWalkInUserSchool();
            if (!school) {
                status.textContent = 'No school on file — cannot look up students.';
                status.style.color = '#d9534f';
                return;
            }
            status.textContent = 'Searching school records...';
            status.style.color = '#666';
            fetch(`../../api/get-students.php?school=${encodeURIComponent(school)}&search=${encodeURIComponent(term)}&limit=8`)
                .then(r => r.json())
                .then(result => {
                    listEl.innerHTML = '';
                    if (!result.success || !result.data || result.data.length === 0) {
                        status.textContent = 'No matching student found — you can still type the name manually.';
                        status.style.color = '#d9534f';
                        return;
                    }
                    result.data.forEach(student => {
                        const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
                        const row = document.createElement('div');
                        row.style.cssText = 'padding:8px 10px;cursor:pointer;border-bottom:1px solid #f2f2f2;';
                        row.innerHTML = `<div style="font-weight:600">${escapeHtml(fullName)}</div><div style="font-size:12px;color:#666">${escapeHtml(student.grade_name || '')}</div>`;
                        row.addEventListener('mousedown', (ev) => {
                            ev.preventDefault();
                            input.value = fullName;
                            document.getElementById('newRefStudentId').value = student.id;
                            const gradeEl = document.getElementById('newRefGrade');
                            const gradeLabel = student.grade_name || '';
                            if (gradeLabel && Array.from(gradeEl.options).some(o => o.value === gradeLabel)) {
                                gradeEl.value = gradeLabel;
                            }
                            if (student.age) document.getElementById('newRefAge').value = student.age;
                            const sexValue = student.sex || student.Sex;
                            if (sexValue) {
                                const genderMap = { M: 'Male', F: 'Female', Male: 'Male', Female: 'Female' };
                                document.getElementById('newRefGender').value = genderMap[sexValue] || sexValue;
                            }
                            status.textContent = `Selected: ${fullName}`;
                            status.style.color = 'green';
                            listEl.innerHTML = '';
                        });
                        listEl.appendChild(row);
                    });
                    status.textContent = `Found ${result.data.length} match${result.data.length > 1 ? 'es' : ''}`;
                    status.style.color = 'green';
                })
                .catch(() => {
                    status.textContent = 'Error checking student records.';
                    status.style.color = '#d66';
                });
        }, 300);
    });

    input.addEventListener('blur', () => setTimeout(() => { listEl.innerHTML = ''; }, 200));
}

function submitWalkInReferral(e) {
    e.preventDefault();
    const user = getCurrentUser();
    const school = getWalkInUserSchool();

    const studentName = document.getElementById('newRefStudentName').value.trim();
    const grade = document.getElementById('newRefGrade').value;
    const reason = document.getElementById('newRefReason').value.trim();

    if (!studentName || !grade || !reason) {
        showAlert('Please fill in the student name, grade, and reason for referral.', 'error');
        return;
    }

    const referral = {
        student_name: studentName,
        student_id: document.getElementById('newRefStudentId').value || null,
        grade: grade,
        section: document.getElementById('newRefSection').value.trim(),
        age: document.getElementById('newRefAge').value,
        gender: document.getElementById('newRefGender').value,
        referral_reason: reason,
        description: document.getElementById('newRefDescription').value.trim(),
        intervention_attempts: document.getElementById('newRefIntervention').value.trim(),
        observed_behaviors: document.getElementById('newRefBehaviors').value.trim(),
        parent_guardian: document.getElementById('newRefParentName').value.trim(),
        parent_contact: document.getElementById('newRefParentContact').value.trim(),
        parent_email: document.getElementById('newRefParentEmail').value.trim(),
        family_background: document.getElementById('newRefFamilyBg').value.trim(),
        urgency: document.getElementById('newRefUrgency').value || 'normal',
        teacher_id: user.id || null,
        teacher_name: user.name || user.email,
        teacher_contact: user.contact || '',
        school_attended: school,
        student_school: school,
        stage: 1,
        status: 'pending'
    };

    fetch('../../api/referral.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(referral)
    })
        .then(r => r.json())
        .then(result => {
            if (!result.success) {
                throw new Error(result.message || 'Failed to submit referral');
            }
            showAlert('Referral created successfully.');
            document.getElementById('newReferralForm').reset();
            document.getElementById('newRefStudentId').value = '';
            hideReferralForm();
            fetchCounselorReferrals().then(loadListView);
        })
        .catch(error => {
            showAlert(error.message || 'Failed to submit referral', 'error');
        });
}

document.addEventListener('DOMContentLoaded', initWalkInReferralForm);
