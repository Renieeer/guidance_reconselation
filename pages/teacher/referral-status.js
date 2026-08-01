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
    const apiUrl = `../../api/referral.php?role=teacher&school=${encodeURIComponent(teacherSchool)}&user_id=${teacherId}`;
    
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

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
}

// Must match ACKNOWLEDGEMENT_CHECKLIST_ITEMS in pages/counselor/referral-status.js
const ACKNOWLEDGEMENT_CHECKLIST_ITEMS = [
    { key: 'closed_intake', label: 'Closed at Intake Interview' },
    { key: 'for_counseling', label: 'For Counseling' },
    { key: 'sessions_ongoing', label: 'Counseling Sessions are on-going' },
    { key: 'parent_conference', label: 'Parent/Guardian Conference Conducted' },
    { key: 'sessions_completed', label: 'Sessions Completed / Case Terminated' },
    { key: 'no_show', label: 'Student did not show up' },
    { key: 'under_monitoring', label: 'Under Monitoring' }
];

// This form is filled out once by the counselor after counseling ends
// (pages/counselor/referral-status.js, stage 6) — the teacher only ever
// sees a read-only receipt of what was actually saved, never a blank
// fillable form of their own.
function generateAcknowledgementForm(referral) {
    const formDiv = document.getElementById('acknowledgementForm');
    formDiv.innerHTML = '<p class="text-muted" style="text-align:center;padding:30px;">Loading acknowledgement…</p>';

    fetch(`../../api/referral-acknowledgement.php?referral_id=${referral.id}`)
        .then(response => response.json())
        .then(result => {
            if (!result.success) throw new Error(result.message || 'Failed to load acknowledgement');
            renderAcknowledgementReadOnly(referral, result.data);
        })
        .catch(error => {
            console.error('Error loading acknowledgement:', error);
            formDiv.innerHTML = `<p class="text-danger" style="text-align:center;padding:30px;">Couldn't load the acknowledgement form: ${escapeHtml(error.message)}</p>`;
        });
}

function renderAcknowledgementReadOnly(referral, ack) {
    const formDiv = document.getElementById('acknowledgementForm');
    const studentName = escapeHtml(referral.student_name);

    if (!ack) {
        formDiv.innerHTML = `
            <div class="referral-sheet">
                <div class="referral-sheet-title">Counseling Referral Acknowledgement Form</div>
                <div class="referral-sheet-section" style="text-align:center;color:var(--text-light);">
                    <i class="bi bi-hourglass-split" style="font-size:28px;display:block;margin-bottom:10px;"></i>
                    Your counselor hasn't completed this acknowledgement yet.<br>
                    It will appear here once counseling for <strong>${studentName}</strong> has ended.
                </div>
            </div>
        `;
        return;
    }

    const checklist = ack.checklist || {};
    const savedDate = formatDate(ack.updated_at || ack.created_at);

    const html = `
        <div class="referral-sheet">
            <div class="referral-sheet-title">Counseling Referral Acknowledgement Form</div>
            <div class="referral-sheet-intro">Completed by your counselor — read only</div>

            <div class="referral-table-row">
                <div class="referral-label">To</div>
                <div class="referral-field">${studentName}</div>
            </div>
            <div class="referral-table-row">
                <div class="referral-label">Referring Person / Unit</div>
                <div class="referral-field">Teacher</div>
            </div>
            <div class="referral-table-row">
                <div class="referral-label">Designation / Department</div>
                <div class="referral-field">Teaching Staff</div>
            </div>

            <div class="referral-sheet-section">
                This is to confirm that <strong>${studentName}</strong>, whom you referred to us on
                <strong>${escapeHtml(formatDate(referral.date_submitted))}</strong>, has started his/her session
                and is being attended by <strong>${escapeHtml(ack.attended_by) || '—'}</strong>
            </div>

            <div class="referral-sheet-section">
                <div class="referral-checklist-heading">Status of the case at hand</div>
                <div class="referral-checklist">
                    ${ACKNOWLEDGEMENT_CHECKLIST_ITEMS.map(item => `
                        <label class="referral-checklist-item">
                            <input type="checkbox" disabled ${checklist[item.key] ? 'checked' : ''}>
                            <span>${escapeHtml(item.label)}</span>
                        </label>
                    `).join('')}
                    <label class="referral-checklist-item">
                        <input type="checkbox" disabled>
                        <span>Number of follow-ups made by the Counselor: <strong>${escapeHtml(ack.follow_up_count) || '—'}</strong></span>
                    </label>
                    <label class="referral-checklist-item">
                        <input type="checkbox" disabled>
                        <span>Referred to <strong>${escapeHtml(ack.referred_to) || '—'}</strong></span>
                    </label>
                </div>
            </div>

            <div class="referral-sheet-thanks">
                <p>Thank you.</p>
                <p>Always for the welfare of students,</p>
            </div>

            <div class="referral-sheet-signature">
                <p class="referral-signature-title">Attending Guidance Counselor</p>
                <div class="referral-signature-line"></div>
                <p class="referral-signature-date">${escapeHtml(ack.counselor_name) || ''}</p>
                <p class="referral-signature-date">Date: <strong>${savedDate}</strong></p>
            </div>
        </div>
    `;

    formDiv.innerHTML = html;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initReferralStatus);

