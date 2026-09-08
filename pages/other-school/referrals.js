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

// Stage 4 (Intervention) activity checklist — shared with the teacher
// -facing read-only view the same way ACKNOWLEDGEMENT_CHECKLIST_ITEMS is.
// "external_referral" is handled specially (see renderInterventionChecklist()
// / toggleExternalReferralForm()) — checking it reveals the Appendix C form
// and gates advancing to Stage 5 until that form is saved.
const INTERVENTION_ACTIVITY_ITEMS = [
    { key: 'psychoeducation', label: 'Psychoeducation' },
    { key: 'mindfulness_relaxation', label: 'Mindfulness and Relaxation Activity' },
    { key: 'psychosocial', label: 'Psychosocial Activity' },
    { key: 'pfa', label: 'PFA (Psychological First Aid) Activity' },
    { key: 'art_expressive', label: 'Art Expressive / Art Activity' },
    { key: 'external_referral', label: 'External Referral (to an outside agency)' }
];

// Whether "External Referral" is currently checked, and whether its
// Appendix C form has been saved — loadCaseActions() reads both to decide
// whether "Advance to Next Stage" is allowed while at Stage 4.
let externalReferralRequired = false;
let externalReferralCompleted = false;

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
    document.getElementById('detStudentName').innerHTML = `${escapeHtml(referral.student_name)} ${referralRoleBadge(referral.referral_role)}`;
    document.getElementById('detStudentGradeSection').textContent = (referral.grade || 'N/A') + ' - ' + (referral.section || 'N/A');
    document.getElementById('detDateSubmitted').textContent = formatDate(referral.date_submitted);
    document.getElementById('detUrgency').textContent = referral.urgency || 'normal';
    document.getElementById('detStatus').innerHTML = createBadge(getStatusLabel(referral.stage));
    document.getElementById('detStage').textContent = referral.stage + '/6';
    document.getElementById('detStageNote').textContent = referral.stage_note ? ` — ${referral.stage_note}` : '';

    // Referral Information
    document.getElementById('detDescription').textContent = referral.description || 'Not provided';
    document.getElementById('detIntervention').textContent = referral.intervention_attempts || 'Not provided';
    document.getElementById('ovReason').textContent = referral.referral_reason || 'Not provided';

    // Referred By (the teacher, not the student's family)
    document.getElementById('detTeacherName').textContent = referral.teacher_name || 'Not provided';
    document.getElementById('detTeacherSchool').textContent = referral.school_attended || 'Not provided';
    document.getElementById('detTeacherContact').textContent = referral.teacher_contact || 'Not provided';

    // Family/Contact Information
    document.getElementById('detParent').textContent = referral.parent_guardian || 'Not provided';
    document.getElementById('detContactNum').textContent = referral.parent_contact || 'Not provided';

    // Load stages
    const stageContainer = document.getElementById('detailStagesContainer');
    stageContainer.innerHTML = createStageIndicator(referral.stage);
    wireStageIndicatorClicks(referral);

    document.getElementById('backToCurrentStageLink').onclick = (e) => {
        e.preventDefault();
        renderStageSection(referral, referral.stage);
    };

    // Show whichever stage's section the referral is actually at — clicking
    // an earlier stage number (wireStageIndicatorClicks) re-runs this with
    // a different viewStage to look back at it without changing the real
    // stage or re-fetching the referral.
    renderStageSection(referral, referral.stage);

    // Load case actions
    loadCaseActions();
}

// Lets the counselor click any stage circle in the progress indicator to
// review what was recorded there, even after the referral has moved past
// it — the circles otherwise only ever reflected (and revealed) whichever
// stage the referral currently sits at.
function wireStageIndicatorClicks(referral) {
    document.querySelectorAll('#detailStagesContainer .stage-circle').forEach(circle => {
        circle.onclick = () => renderStageSection(referral, parseInt(circle.dataset.stage, 10));
    });
}

// Shows the single stage-specific section matching viewStage and hides the
// other five. viewStage is independent of referral.stage — the real stage
// value — so viewing an old stage never mutates the referral or confuses
// loadCaseActions()/advanceStage(), which always key off referral.stage.
function renderStageSection(referral, viewStage) {
    // Show the Interview/Background form for stage 1
    const interviewSection = document.getElementById('interviewFormSection');
    if (viewStage === 1) {
        interviewSection.style.display = 'block';
        document.getElementById('interviewForm').onsubmit = submitInterviewNotes;
        document.getElementById('cancelInterviewEditBtn').onclick = cancelInterviewEdit;
        loadInterviewHistory(referral.id);
    } else {
        interviewSection.style.display = 'none';
    }

    // Show the Initial Risk Assessment completion gate for stage 2
    const screeningSection = document.getElementById('screeningFormSection');
    if (viewStage === 2) {
        screeningSection.style.display = 'block';
        document.getElementById('assessmentUploadForm').onsubmit = submitAssessmentUpload;
        document.getElementById('assessmentCompletedYesBtn').onclick = confirmAssessmentCompleted;
        document.getElementById('assessmentCompletedNoBtn').onclick = () => {
            showAlert('No problem — come back once the student has completed the assessment.', 'info');
        };
        loadAssessmentFiles(referral.id);
    } else {
        screeningSection.style.display = 'none';
    }

    // Show the Parent Call-up/Consent file upload + agreement gate for stage 3
    const consentSection = document.getElementById('consentSection');
    if (viewStage === 3) {
        consentSection.style.display = 'block';
        document.getElementById('consentUploadForm').onsubmit = submitConsentUpload;
        const consentStudentAgreeEl = document.getElementById('consentStudentAgree');
        const consentParentAgreeEl = document.getElementById('consentParentAgree');
        consentStudentAgreeEl.value = '';
        consentParentAgreeEl.value = '';
        consentStudentAgreeEl.classList.remove('field-error');
        consentParentAgreeEl.classList.remove('field-error');
        // Clears the red highlight as soon as an answer is picked, rather
        // than making the counselor click "Continue" again just to see it go away.
        consentStudentAgreeEl.onchange = () => consentStudentAgreeEl.classList.remove('field-error');
        consentParentAgreeEl.onchange = () => consentParentAgreeEl.classList.remove('field-error');
        document.getElementById('consentDecisionSubmitBtn').onclick = confirmConsentDecision;
        loadConsentFiles(referral.id);
    } else {
        consentSection.style.display = 'none';
    }

    // Show the intervention activity checklist for stage 4
    const interventionSection = document.getElementById('interventionFormSection');
    if (viewStage === 4) {
        interventionSection.style.display = 'block';
        // Reset before loading so a previous referral's gate state can
        // never briefly leak into this one while its own data is fetched.
        externalReferralRequired = false;
        externalReferralCompleted = false;
        renderInterventionChecklist();
        document.getElementById('interventionForm').onsubmit = submitIntervention;
        document.getElementById('saveExternalReferralBtn').onclick = saveExternalReferral;
        loadIntervention(referral.id);
    } else {
        interventionSection.style.display = 'none';
    }

    // Show the case-closing acknowledgement form for stage 6 — filled out
    // here by the counselor, then shown read-only to the referring teacher.
    const acknowledgementSection = document.getElementById('acknowledgementFormSection');
    if (viewStage === 6) {
        acknowledgementSection.style.display = 'block';
        renderAcknowledgementChecklist();
        document.getElementById('acknowledgementForm').onsubmit = submitAcknowledgement;
        loadAcknowledgement(referral.id);
    } else {
        acknowledgementSection.style.display = 'none';
    }

    // Stage 5 (Counseling) links out to the standalone Counseling case
    // feature rather than having its own documentation form — see
    // applyReferralPrefill() in counseling.js, which reads the query
    // string this builds to auto-open a pre-filled case for this student.
    const counselingCtaSection = document.getElementById('counselingCtaSection');
    if (viewStage === 5) {
        counselingCtaSection.style.display = 'block';
        document.getElementById('openCounselingCaseBtn').onclick = () => openCounselingCaseForReferral(referral);
        checkExistingCounselingCase(referral);
    } else {
        counselingCtaSection.style.display = 'none';
    }

    const stageViewNote = document.getElementById('stageViewNote');
    if (viewStage !== referral.stage) {
        document.getElementById('stageViewLabel').textContent = `Stage ${viewStage} — ${getStageInfo(viewStage)?.name || ''}`;
        stageViewNote.style.display = 'block';
    } else {
        stageViewNote.style.display = 'none';
    }
}

// counselor_case_scenarios has no referral_id column — cases and referrals
// are separate features — so the link is a one-way handoff via query
// string instead of a real foreign key: counseling.php reads these back in
// applyReferralPrefill() to open a case pre-filled with this student rather
// than making the counselor re-type what's already on the referral.
async function openCounselingCaseForReferral(referral) {
    // Stage 1's Interview/Background note lives in referral_screening, not
    // on the referral row itself, and isn't loaded at all while viewing a
    // Stage 4 referral (loadInterviewHistory() only runs for Stage 1) — so
    // it has to be fetched fresh here rather than read off `referral`.
    let interviewNotes = '';
    try {
        const res = await fetch(`../../api/referral-screening.php?referral_id=${referral.id}&stage=1`);
        const result = await res.json();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            interviewNotes = result.data[0].interview_notes || '';
        }
    } catch (error) {
        // Non-critical — the handoff still works without a pre-filled
        // Notes field, so fail silently rather than surfacing this.
    }

    const params = new URLSearchParams({
        prefill_name: referral.student_name || '',
        prefill_grade: referral.grade || '',
        prefill_section: referral.section || '',
        referral_code: referral.referral_code || String(referral.id || ''),
        referral_intervention: referral.intervention_attempts || '',
        referral_interview: interviewNotes
    });
    window.location.href = `counseling.php?${params.toString()}`;
}

// Cases and referrals aren't linked by a real foreign key — a case created
// from a referral just carries a "(Linked to Referral <code>)" tag appended
// after its Notes (see applyReferralPrefill() in counseling.js). This looks
// for that tag so the referral view can show a counseling case is already
// underway, instead of only being visible from the Counseling page's side.
function checkExistingCounselingCase(referral) {
    const statusEl = document.getElementById('linkedCaseStatus');
    const promptEl = document.getElementById('openCounselingCasePrompt');

    // Reset to the default "no linked case yet" state first — these two
    // elements persist across referrals in this SPA-style detail view, so
    // without this a case found for the previously viewed referral would
    // stay showing after switching to one that has no linked case.
    statusEl.style.display = 'none';
    statusEl.innerHTML = '';
    promptEl.style.display = '';

    const school = referral.school_attended || referral.student_school || '';
    const referralCode = referral.referral_code || String(referral.id || '');
    if (!school || !referralCode) return;

    const marker = `(Linked to Referral ${referralCode})`;

    fetch(`../../api/case-scenario.php?school_attended=${encodeURIComponent(school)}`)
        .then(response => response.json())
        .then(result => {
            if (!result.success) return;
            const linkedCase = (result.data || []).find(c => (c.caseSummary || '').includes(marker));
            if (!linkedCase) return;

            const statusLabel = linkedCase.status === 'closed' ? 'Ended' : 'In progress';
            const statusClass = linkedCase.status === 'closed' ? 'badge-completed' : 'badge-pending';
            statusEl.innerHTML = `
                <div class="bg-light rounded p-3" style="margin-bottom: 16px;">
                    <p style="margin:0 0 8px;"><i class="bi bi-link-45deg"></i> A counseling case is already linked to this referral.</p>
                    <p style="margin:0 0 10px;"><strong>${escapeHtml(linkedCase.id)}</strong> — <span class="badge ${statusClass}">${statusLabel}</span></p>
                    <a href="counseling.php?case_id=${encodeURIComponent(linkedCase.id)}" class="btn btn-secondary btn-sm">
                        <i class="bi bi-box-arrow-up-right"></i> View Counseling Case
                    </a>
                </div>
            `;
            statusEl.style.display = 'block';
            promptEl.style.display = 'none';
        })
        .catch(() => {});
}

function renderInterventionChecklist() {
    const container = document.getElementById('interventionChecklist');
    container.innerHTML = INTERVENTION_ACTIVITY_ITEMS.map(item => `
        <label class="referral-checklist-item">
            <input type="checkbox" name="interventionChecklist" value="${item.key}">
            <span>${escapeHtml(item.label)}</span>
        </label>
    `).join('') + `
        <label class="referral-checklist-item">
            <input type="checkbox" name="interventionChecklist" value="other" id="interventionOtherCheck">
            <span>Other (please specify)</span>
        </label>
    `;

    container.querySelector('input[value="external_referral"]').addEventListener('change', (e) => {
        toggleExternalReferralForm(e.target.checked);
    });

    // "Other" reveals a free-text field when checked — same pattern as the
    // teacher's Reason-for-Referral checklist (referral-form.js), so an
    // activity outside the fixed list isn't silently uncapturable.
    const otherCheck = document.getElementById('interventionOtherCheck');
    const otherText = document.getElementById('interventionOtherText');
    otherCheck.addEventListener('change', () => {
        otherText.style.display = otherCheck.checked ? '' : 'none';
        if (otherCheck.checked) otherText.focus();
    });
}

// Single place that flips the Appendix C form's visibility and updates the
// gate flag — called both from the live checkbox (above) and from
// loadIntervention() when restoring a previously saved checklist, so the
// two never disagree about whether the form should be showing.
function toggleExternalReferralForm(show) {
    externalReferralRequired = show;
    document.getElementById('externalReferralFormSection').style.display = show ? 'block' : 'none';
    loadCaseActions();
}

function loadIntervention(referralId) {
    fetch(`../../api/referral-intervention.php?referral_id=${referralId}`)
        .then(response => response.json())
        .then(result => {
            if (!result.success) throw new Error(result.message || 'Failed to load intervention activities');

            document.getElementById('interventionForm').reset();
            const otherText = document.getElementById('interventionOtherText');
            otherText.value = '';
            otherText.style.display = 'none';

            const data = result.data;
            const checklist = data?.checklist || {};

            if (data) {
                document.getElementById('interventionNotes').value = data.notes || '';
                document.querySelectorAll('#interventionChecklist input[type="checkbox"]').forEach(cb => {
                    cb.checked = Boolean(checklist[cb.value]);
                });
                if (checklist.other) {
                    otherText.value = checklist.other_text || '';
                    otherText.style.display = '';
                }
            }

            toggleExternalReferralForm(Boolean(checklist['external_referral']));
        })
        .catch(error => {
            console.error('Error loading intervention activities:', error);
        });

    loadExternalReferral(referralId);
}

// Populates the Appendix C form from any previously saved record, and sets
// externalReferralCompleted so loadCaseActions() knows whether the Stage
// 4 → 5 gate is satisfied. Called every time Stage 4 loads regardless of
// whether "External Referral" is currently checked, so switching it back on
// later still shows what was saved before.
function loadExternalReferral(referralId) {
    fetch(`../../api/referral-external-referral.php?referral_id=${referralId}`)
        .then(response => response.json())
        .then(result => {
            if (!result.success) throw new Error(result.message || 'Failed to load external referral');

            const data = result.data;
            const savedNote = document.getElementById('externalReferralSavedNote');
            const printBtn = document.getElementById('printExternalReferralBtn');

            const pdfHint = document.getElementById('externalReferralPdfHint');

            if (!data) {
                externalReferralCompleted = false;
                savedNote.style.display = 'none';
                printBtn.style.display = 'none';
                pdfHint.style.display = 'none';
                loadCaseActions();
                return;
            }

            document.getElementById('extRefAgencyName').value = data.agency_name || '';
            document.getElementById('extRefAgencyAddress').value = data.agency_address || '';
            document.getElementById('extRefStudentAddress').value = data.student_address || '';
            document.getElementById('extRefSchoolName').value = data.referring_school || '';
            document.getElementById('extRefSchoolAddress').value = data.school_address || '';
            document.getElementById('extRefCellphone').value = data.cellphone_no || '';
            document.getElementById('extRefLandline').value = data.landline_no || '';
            document.getElementById('extRefContactPerson').value = data.contact_person || '';
            document.getElementById('extRefReason').value = data.reason_for_referral || '';
            document.getElementById('extRefServices').value = data.specific_services || '';

            externalReferralCompleted = true;
            savedNote.style.display = 'block';
            printBtn.style.display = '';
            pdfHint.style.display = '';
            loadCaseActions();
        })
        .catch(error => {
            console.error('Error loading external referral:', error);
        });
}

function saveExternalReferral() {
    const agencyName = document.getElementById('extRefAgencyName').value.trim();
    const reason = document.getElementById('extRefReason').value.trim();
    const services = document.getElementById('extRefServices').value.trim();

    if (!agencyName || !reason || !services) {
        showAlert('Agency, Reason for Referral, and Specific Service/s Requested are required.', 'error');
        return;
    }

    const user = getCurrentUser();
    const btn = document.getElementById('saveExternalReferralBtn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Saving...';

    fetch('../../api/referral-external-referral.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            referral_id: currentReferral.id,
            counselor_id: user?.id || '',
            counselor_name: user?.name || '',
            agency_name: agencyName,
            agency_address: document.getElementById('extRefAgencyAddress').value.trim(),
            student_address: document.getElementById('extRefStudentAddress').value.trim(),
            referring_school: document.getElementById('extRefSchoolName').value.trim(),
            school_address: document.getElementById('extRefSchoolAddress').value.trim(),
            cellphone_no: document.getElementById('extRefCellphone').value.trim(),
            landline_no: document.getElementById('extRefLandline').value.trim(),
            contact_person: document.getElementById('extRefContactPerson').value.trim(),
            reason_for_referral: reason,
            specific_services: services
        })
    })
    .then(response => response.json())
    .then(result => {
        if (!result.success) throw new Error(result.message || 'Failed to save external referral');
        showAlert('External referral saved.', 'success');
        externalReferralCompleted = true;
        document.getElementById('externalReferralSavedNote').style.display = 'block';
        document.getElementById('printExternalReferralBtn').style.display = '';
        document.getElementById('externalReferralPdfHint').style.display = '';
        loadCaseActions();
    })
    .catch(error => {
        showAlert(error.message || 'Failed to save external referral.', 'error');
    })
    .finally(() => {
        btn.disabled = false;
        btn.textContent = originalText;
    });
}

// Fills the hidden Appendix C sheet (see #externalReferralPrintSheet in
// referrals.php and the .er-print-* rules in style.css) from the current
// form fields plus the referral's own student info — Age/Sex come from the
// referral record itself, everything else from the External Referral
// form — then triggers the browser print dialog. The print-external-
// referral body class is what the @media print rules key off to show only
// this sheet and hide the rest of the page.
function printExternalReferral() {
    const referral = currentReferral;

    document.getElementById('printAgencyName').textContent = document.getElementById('extRefAgencyName').value.trim();
    document.getElementById('printAgencyAddress').textContent = document.getElementById('extRefAgencyAddress').value.trim();
    document.getElementById('printStudentName').textContent = referral.student_name || '';
    document.getElementById('printStudentAge').textContent = referral.age || '';
    document.getElementById('printStudentSex').textContent = referral.gender || '';
    document.getElementById('printStudentAddress').textContent = document.getElementById('extRefStudentAddress').value.trim();
    document.getElementById('printReason').textContent = document.getElementById('extRefReason').value.trim();
    document.getElementById('printServices').textContent = document.getElementById('extRefServices').value.trim();

    const schoolName = document.getElementById('extRefSchoolName').value.trim();
    const schoolAddress = document.getElementById('extRefSchoolAddress').value.trim();
    document.getElementById('printFeedbackSchool').textContent = schoolName;
    document.getElementById('printFeedbackAddress').textContent = schoolAddress;
    document.getElementById('printSchoolName').textContent = schoolName;
    document.getElementById('printSchoolAddress').textContent = schoolAddress;

    document.getElementById('printCellphone').textContent = document.getElementById('extRefCellphone').value.trim();
    document.getElementById('printLandline').textContent = document.getElementById('extRefLandline').value.trim();
    document.getElementById('printContactPerson').textContent = document.getElementById('extRefContactPerson').value.trim();
    // printByName/printByDesignation/printDate are left blank on purpose —
    // all three are only ever filled in by hand at the moment of signing
    // the printed copy, never typed in beforehand.

    document.body.classList.add('print-external-referral');
    window.print();
}

window.addEventListener('afterprint', () => {
    document.body.classList.remove('print-external-referral');
});

function submitIntervention(e) {
    e.preventDefault();

    const user = getCurrentUser();
    const notes = document.getElementById('interventionNotes').value.trim();

    const checklist = {};
    document.querySelectorAll('#interventionChecklist input[type="checkbox"]').forEach(cb => {
        checklist[cb.value] = cb.checked;
    });
    if (checklist.other) {
        checklist.other_text = document.getElementById('interventionOtherText').value.trim();
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    fetch('../../api/referral-intervention.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            referral_id: currentReferral.id,
            counselor_id: user?.id || '',
            counselor_name: user?.name || '',
            checklist: checklist,
            notes: notes
        })
    })
    .then(response => response.json())
    .then(result => {
        if (!result.success) throw new Error(result.message || 'Failed to save intervention activities');
        showAlert('Intervention activities saved.', 'success');
    })
    .catch(error => {
        showAlert(error.message || 'Failed to save intervention activities.', 'error');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

function renderAcknowledgementChecklist() {
    const container = document.getElementById('ackChecklist');
    container.innerHTML = ACKNOWLEDGEMENT_CHECKLIST_ITEMS.map(item => `
        <label class="referral-checklist-item">
            <input type="checkbox" name="ackChecklist" value="${item.key}">
            <span>${escapeHtml(item.label)}</span>
        </label>
    `).join('');

    // The case status is one state at a time — checking one option locks
    // the rest until it's unchecked again.
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => syncAckChecklistExclusivity(container));
    });
}

function syncAckChecklistExclusivity(container) {
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    const checkedBox = Array.from(checkboxes).find(cb => cb.checked);
    checkboxes.forEach(cb => {
        cb.disabled = Boolean(checkedBox) && cb !== checkedBox;
    });
}

function loadAcknowledgement(referralId) {
    fetch(`../../api/referral-acknowledgement.php?referral_id=${referralId}`)
        .then(response => response.json())
        .then(result => {
            if (!result.success) throw new Error(result.message || 'Failed to load acknowledgement');

            document.getElementById('acknowledgementForm').reset();
            syncAckChecklistExclusivity(document.getElementById('ackChecklist'));
            const data = result.data;
            if (!data) return;

            document.getElementById('ackAttendedBy').value = data.attended_by || '';

            const checklist = data.checklist || {};
            document.querySelectorAll('#ackChecklist input[type="checkbox"]').forEach(cb => {
                cb.checked = Boolean(checklist[cb.value]);
            });
            syncAckChecklistExclusivity(document.getElementById('ackChecklist'));
        })
        .catch(error => {
            console.error('Error loading acknowledgement:', error);
        });
}

function submitAcknowledgement(e) {
    e.preventDefault();

    const user = getCurrentUser();
    const attendedBy = document.getElementById('ackAttendedBy').value.trim();

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

function loadAssessmentFiles(referralId) {
    const container = document.getElementById('assessmentFileList');
    if (!container) return;
    container.innerHTML = '<p class="text-muted">Loading uploaded documents...</p>';

    fetch(`../../api/referral-assessment.php?referral_id=${referralId}`)
        .then(response => response.json())
        .then(result => {
            if (!result.success) throw new Error(result.message || 'Failed to load assessment documents');
            const rows = result.data || [];
            if (rows.length === 0) {
                container.innerHTML = '<p class="text-muted">No assessment document uploaded yet.</p>';
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

// Same api/referral-screening.php table as the Stage 2 screening notes
// above, just filtered to stage=1 so this list never shows Stage 2's risk
// assessment entries mixed in (see the stage column added there).
//
// Once a note exists, the add form hides and the note shows read-only with
// an Edit button — Stage 1 is meant to hold one revisable note, not a
// growing log the counselor re-fills out every visit. Any older rows from
// before this behavior still display for history; only the latest is
// editable.
let latestInterviewNote = null;
let editingInterviewScreeningId = null;

function loadInterviewHistory(referralId) {
    const container = document.getElementById('interviewHistoryList');
    if (!container) return;
    container.innerHTML = '<p class="text-muted">Loading previous interview notes...</p>';
    latestInterviewNote = null;
    editingInterviewScreeningId = null;

    fetch(`../../api/referral-screening.php?referral_id=${referralId}&stage=1`)
        .then(response => response.json())
        .then(result => {
            if (!result.success) throw new Error(result.message || 'Failed to load interview notes');
            const rows = result.data || [];
            if (rows.length === 0) {
                container.innerHTML = '<p class="text-muted">No interview notes recorded yet.</p>';
                showInterviewForm();
                return;
            }

            latestInterviewNote = rows[0];
            container.innerHTML = rows.map((row, index) => `
                <div style="background:#f9fafb; border-radius:8px; padding:12px 14px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <strong>${escapeHtml(row.counselor_name || 'Counselor')}</strong>
                        <small class="text-muted">${formatDate(row.created_at)}</small>
                    </div>
                    ${row.interview_notes ? `<div>${escapeHtml(row.interview_notes)}</div>` : ''}
                    ${index === 0 ? '<div style="display:flex; justify-content:flex-end; margin-top:8px;"><button type="button" class="btn btn-edit" onclick="editInterviewNotes()">Edit</button></div>' : ''}
                </div>
            `).join('');
            hideInterviewForm();
        })
        .catch(error => {
            container.innerHTML = `<p class="text-danger">${escapeHtml(error.message)}</p>`;
        });
}

function showInterviewForm() {
    document.getElementById('interviewForm').style.display = '';
}

function hideInterviewForm() {
    document.getElementById('interviewForm').style.display = 'none';
}

function editInterviewNotes() {
    if (!latestInterviewNote) return;
    editingInterviewScreeningId = latestInterviewNote.screening_id;
    document.getElementById('interviewNotes').value = latestInterviewNote.interview_notes || '';
    document.getElementById('cancelInterviewEditBtn').style.display = '';
    showInterviewForm();
    document.getElementById('interviewNotes').focus();
}

function cancelInterviewEdit() {
    editingInterviewScreeningId = null;
    document.getElementById('interviewForm').reset();
    document.getElementById('cancelInterviewEditBtn').style.display = 'none';
    hideInterviewForm();
}

function submitInterviewNotes(e) {
    e.preventDefault();

    const interviewNotes = document.getElementById('interviewNotes').value.trim();
    if (!interviewNotes) {
        showAlert('Enter interview / background notes before saving.', 'error');
        return;
    }

    const user = getCurrentUser();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    const isEditing = !!editingInterviewScreeningId;
    const method = isEditing ? 'PUT' : 'POST';
    const body = isEditing
        ? { screening_id: editingInterviewScreeningId, interview_notes: interviewNotes }
        : {
            referral_id: currentReferral.id,
            counselor_id: user?.id || '',
            counselor_name: user?.name || '',
            interview_notes: interviewNotes,
            stage: 1
        };

    fetch('../../api/referral-screening.php', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(result => {
        if (!result.success) throw new Error(result.message || 'Failed to save interview notes');
        showAlert(isEditing ? 'Interview notes updated.' : 'Interview notes saved.', 'success');
        editingInterviewScreeningId = null;
        document.getElementById('cancelInterviewEditBtn').style.display = 'none';
        document.getElementById('interviewForm').reset();
        loadInterviewHistory(currentReferral.id);
    })
    .catch(error => {
        showAlert(error.message || 'Failed to save interview notes.', 'error');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

function submitAssessmentUpload(e) {
    e.preventDefault();

    const fileInput = document.getElementById('assessmentFile');
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

    fetch('../../api/referral-assessment.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (!result.success) throw new Error(result.message || 'Failed to upload file');
        showAlert('Assessment document uploaded.', 'success');
        document.getElementById('assessmentUploadForm').reset();
        loadAssessmentFiles(currentReferral.id);
    })
    .catch(error => {
        showAlert(error.message || 'Failed to upload file.', 'error');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

// The Stage 2 completion gate — a "Yes" answer is itself the advancement
// action (no separate "Advance to Next Stage" click needed), same
// underlying update-referral.php call the generic advanceStage() uses.
function confirmAssessmentCompleted() {
    if (!confirm('Confirm the student has completed the assessment? This will move the referral to Stage 3.')) {
        return;
    }
    setReferralStage(currentReferral.stage + 1, 'Assessment done');
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

// Stages 2 and 3 advance themselves through their own gate (the Stage 2
// completion question, the Stage 3 student/parent agreement question)
// instead of the generic button below — showing that button too would let
// a counselor skip straight past either gate.
const GATED_STAGES = [2, 3];

function loadCaseActions() {
    const container = document.getElementById('caseActionsContainer');
    let html = '';

    // Same idea as GATED_STAGES, but conditional on the checklist rather
    // than the stage alone — Stage 4 only blocks "Advance" when "External
    // Referral" is checked and its Appendix C form hasn't been saved yet.
    const externalReferralBlocking = currentReferral.stage === 4 && externalReferralRequired && !externalReferralCompleted;

    if (currentReferral.stage < 6 && !GATED_STAGES.includes(currentReferral.stage) && !externalReferralBlocking) {
        html += `<button class="btn btn-primary" onclick="advanceStage()">Advance to Next Stage</button>`;
    } else if (externalReferralBlocking) {
        html += `<p class="text-muted" style="font-style: italic;">Complete the External Referral form above before advancing to the next stage.</p>`;
    }

    if (currentReferral.stage === 6) {
        html += `<p style="color: #999; font-style: italic;">This case is closed.</p>`;
    }

    html += `<button class="btn btn-secondary" style="margin-left: 10px;" onclick="closeCase()">Close Case</button>`;

    container.innerHTML = html;
}

// stageNote is a short human-readable record of *why* the referral is at
// the new stage (e.g. "Assessment done", "Both agreed to counseling") — shown next to
// "Current Stage" in the Referral Overview. Omitting it clears any existing
// note, since a note set by a gated stage shouldn't linger after a later,
// ungated advance has moved past it.
function setReferralStage(newStage, stageNote) {
    const newStatus = newStage === 6 ? 'completed' : 'in-progress';
    const user = getCurrentUser();

    fetch('../../api/update-referral.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            referral_id: currentReferral.id,
            stage: newStage,
            status: newStatus,
            stage_note: stageNote || '',
            counselor_id: user?.id || '',
            counselor_name: user?.name || ''
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            currentReferral = result.referral;
            showAlert(`Referral moved to stage ${newStage}.`, 'success');
            loadDetailView(currentReferral);
        } else {
            showAlert(result.message || 'Error updating referral stage', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating referral stage:', error);
        showAlert('Error updating referral stage. Please try again.', 'error');
    });
}

function advanceStage() {
    setReferralStage(currentReferral.stage + 1);
}

// The Stage 3 gate — records whether the student and parent agreed to
// counseling, but no longer branches which stage comes next: everyone goes
// through Stage 4 (Intervention) before Stage 5 (Counseling), agreed or
// not, so the outcome only affects the recorded note.
function confirmConsentDecision() {
    const studentAgreeEl = document.getElementById('consentStudentAgree');
    const parentAgreeEl = document.getElementById('consentParentAgree');
    const studentAgree = studentAgreeEl.value;
    const parentAgree = parentAgreeEl.value;

    studentAgreeEl.classList.toggle('field-error', !studentAgree);
    parentAgreeEl.classList.toggle('field-error', !parentAgree);

    if (!studentAgree || !parentAgree) {
        showAlert('Please answer both questions before continuing.', 'error');
        return;
    }

    const bothAgree = studentAgree === 'yes' && parentAgree === 'yes';
    const stageNote = bothAgree ? 'Both agreed to counseling' : 'Did not agree to counseling';

    if (!confirm('The referral will move to Stage 4 (Intervention). Continue?')) return;
    setReferralStage(4, stageNote);
}

function closeCase() {
    if (confirm('Are you sure you want to close this case?')) {
        const apiUrl = `../../api/update-referral.php`;
        const user = getCurrentUser();

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                referral_id: currentReferral.id,
                stage: 6,
                status: 'completed',
                stage_note: 'Case closed',
                counselor_id: user?.id || '',
                counselor_name: user?.name || ''
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
            <td>${escapeHtml(referral.student_name)} ${referralRoleBadge(referral.referral_role)}</td>
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
                            const computedAge = calculateAge(student.date_of_birth || student.DateOfBirth);
                            document.getElementById('newRefAge').value = computedAge !== '' ? computedAge : (student.age || '');
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
