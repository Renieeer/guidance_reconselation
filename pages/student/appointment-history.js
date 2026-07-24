// My History (student self-service) — shows the logged-in student's own
// referrals, counseling cases, counseling follow-ups, and online
// appointments as folder-style panels, with client-side filtering.
//
// Unlike the counselor-facing student-history.js this never accepts a
// student_id from the URL or a picker — the id always comes from the
// logged-in session, so a student can only ever load their own records.

let shAllRecords = [];   // normalized flat list across all 4 record types
// Which folder's records are shown in the right-hand content panel — only
// one at a time, picked via the left-hand nav list.
let shActiveFolder = 'referrals';

function esc(value) {
    const div = document.createElement('div');
    div.textContent = value === null || value === undefined ? '' : String(value);
    return div.innerHTML;
}

function shFormatDate(value) {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function shFormatDateTime(value) {
    if (!value) return 'N/A';
    const d = new Date(value.replace ? value.replace(' ', 'T') : value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function shStatusBadgeClass(status) {
    const s = String(status || '').toLowerCase();
    if (['completed', 'approved', 'resolved', 'done', 'closed'].includes(s)) return 'badge-completed';
    if (['in-progress', 'in progress', 'ongoing', 'scheduled'].includes(s)) return 'badge-in-progress';
    if (['rejected', 'cancelled', 'canceled', 'declined', 'denied'].includes(s)) return 'badge-rejected';
    return 'badge-pending';
}

/* Mirrors resolveStudentId() in student-information.js — a logged-in
   student's own identifier can show up under several different keys
   depending on which login path/storage was used, so every plausible
   source is checked rather than assuming one shape. */
function parseStoredJson(storage, key) {
    try {
        return JSON.parse(storage.getItem(key) || '{}');
    } catch (e) {
        return {};
    }
}

function resolveOwnStudentId() {
    const storedUser = parseStoredJson(sessionStorage, 'user');
    const storedUserInfo = parseStoredJson(sessionStorage, 'userInfo');
    const storedCurrentUser = parseStoredJson(localStorage, 'currentUser');

    const candidates = [
        storedUser.studentId, storedUser.StudentId, storedUser.student_id, storedUser.id,
        storedUserInfo.studentId, storedUserInfo.StudentId, storedUserInfo.student_id, storedUserInfo.id,
        storedCurrentUser.studentId, storedCurrentUser.StudentId, storedCurrentUser.student_id, storedCurrentUser.id,
        sessionStorage.getItem('studentId'), sessionStorage.getItem('StudentId')
    ];

    const found = candidates.find(value => String(value ?? '').trim() !== '');
    return found ? String(found).trim() : '';
}

function shInit() {
    initPage();

    const studentId = resolveOwnStudentId();
    if (!studentId) {
        document.getElementById('shEmptyState').innerHTML = `
            <i class="fas fa-triangle-exclamation"></i>
            <h3>Couldn't identify your account</h3>
            <p>Please log out and log back in, then try again.</p>`;
        return;
    }

    ['shSearchText', 'shTypeFilter', 'shStatusFilter', 'shDateFrom', 'shDateTo'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('input', shRenderFolders);
        el.addEventListener('change', shRenderFolders);
    });

    document.getElementById('shClearFilters').addEventListener('click', () => {
        document.getElementById('shSearchText').value = '';
        document.getElementById('shTypeFilter').value = '';
        document.getElementById('shStatusFilter').value = '';
        document.getElementById('shDateFrom').value = '';
        document.getElementById('shDateTo').value = '';
        shRenderFolders();
    });

    document.getElementById('shFolderGrid').addEventListener('click', (e) => {
        const navTab = e.target.closest('.sh-folder-tab[data-folder]');
        if (navTab) {
            shActiveFolder = navTab.getAttribute('data-folder');
            shApplyActiveFolder();
            return;
        }
        const fileRow = e.target.closest('.sh-file-row');
        if (fileRow) {
            fileRow.closest('.sh-file').classList.toggle('open');
        }
    });

    shLoadHistory(studentId);
}

function shLoadHistory(studentId) {
    document.getElementById('shLoadingState').style.display = 'block';

    fetch(`/guidancemanagment/api/student-history.php?student_id=${encodeURIComponent(studentId)}`)
        .then(res => res.json())
        .then(result => {
            document.getElementById('shLoadingState').style.display = 'none';
            if (!result.success) {
                document.getElementById('shEmptyState').style.display = 'block';
                document.getElementById('shEmptyState').innerHTML = `
                    <i class="fas fa-triangle-exclamation"></i>
                    <h3>Couldn't load your history</h3>
                    <p>${esc(result.message || 'Unknown error')}</p>`;
                return;
            }

            document.getElementById('shEmptyState').style.display = 'none';
            const counts = result.counts || {};
            // Default to the first folder (in display order) that actually
            // has records, so a student with e.g. zero referrals but real
            // counseling history doesn't land on an empty panel.
            const folderOrder = ['referrals', 'counseling', 'follow_ups', 'appointments'];
            shActiveFolder = folderOrder.find(t => (counts[t] || 0) > 0) || 'referrals';
            shBuildNormalizedRecords(result.data || {});
            shRenderStudentHeader(result.student, counts);
            shPopulateStatusFilter();
            document.getElementById('shFolderGrid').style.display = 'grid';
            document.getElementById('shFilterCard').style.display = 'block';
            shRenderFolders();
        })
        .catch(err => {
            console.error('Error loading history:', err);
            document.getElementById('shLoadingState').style.display = 'none';
            document.getElementById('shEmptyState').style.display = 'block';
            document.getElementById('shEmptyState').innerHTML = `
                <i class="fas fa-triangle-exclamation"></i>
                <h3>Couldn't load your history</h3>
                <p>${esc(err.message || err)}</p>`;
        });
}

function shRenderStudentHeader(student, counts) {
    const card = document.getElementById('shStudentHeaderCard');
    card.style.display = 'block';

    const name = student.name || 'My Records';
    const initials = name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'S';
    document.getElementById('shAvatar').textContent = initials;
    document.getElementById('shStudentName').textContent = name;

    // Grade values in this DB mix legacy numeric codes (e.g. "1" meaning
    // Grade 7) with real grade numbers (e.g. "10") — normalizeGradeNumber
    // (from utils.js, mirrors api/grade-scope.php) resolves both the same
    // way the rest of the app does instead of printing the raw code.
    const normalizedGrade = normalizeGradeNumber(student.grade);
    const gradeLabel = normalizedGrade ? `Grade ${normalizedGrade}` : (student.grade ? String(student.grade) : 'Grade N/A');
    const subParts = [gradeLabel, student.section || null].filter(Boolean);
    document.getElementById('shStudentSub').textContent = subParts.join(' · ');

    const chipDefs = [
        { key: 'referrals', label: 'Referrals', icon: 'fa-file-alt' },
        { key: 'counseling', label: 'Counseling', icon: 'fa-comments' },
        { key: 'follow_ups', label: 'Follow-Ups', icon: 'fa-calendar-check' },
        { key: 'appointments', label: 'Appointments', icon: 'fa-calendar-day' }
    ];
    document.getElementById('shStatChips').innerHTML = chipDefs.map(c => `
        <div class="sh-stat-chip"><i class="fas ${c.icon}"></i> ${c.label} <span class="sh-stat-count">${counts[c.key] || 0}</span></div>
    `).join('');
}

/* Flattens the four record arrays into one normalized list — each entry
   carries a searchable blob and a single sortable date — so filtering
   (text/type/status/date range) is one pass instead of four near-duplicate
   ones per folder. */
function shBuildNormalizedRecords(data) {
    shAllRecords = [];

    (data.referrals || []).forEach(r => {
        shAllRecords.push({
            type: 'referrals',
            status: r.status || 'pending',
            date: r.date_submitted,
            search: [r.referral_reason, r.description, r.intervention_attempts, r.observed_behaviors, r.teacher_name, r.referral_code].join(' ').toLowerCase(),
            raw: r
        });
    });

    (data.counseling || []).forEach(c => {
        shAllRecords.push({
            type: 'counseling',
            status: c.status || 'pending',
            date: c.case_date || c.created_at,
            search: [c.case_title, c.case_summary, c.case_objective, c.first_action, c.category_name, c.counselor_name].join(' ').toLowerCase(),
            raw: c
        });
    });

    (data.follow_ups || []).forEach(f => {
        shAllRecords.push({
            type: 'follow_ups',
            status: 'completed',
            date: f.follow_up_date || f.created_at,
            search: [f.category_name, f.note, f.case_title, f.counselor_name].join(' ').toLowerCase(),
            raw: f
        });
    });

    (data.appointments || []).forEach(a => {
        shAllRecords.push({
            type: 'appointments',
            status: a.status || 'pending',
            date: a.preferred_date,
            search: [a.reason, a.notes, a.counselor_notes].join(' ').toLowerCase(),
            raw: a
        });
    });
}

function shPopulateStatusFilter() {
    const select = document.getElementById('shStatusFilter');
    const current = select.value;
    const statuses = Array.from(new Set(shAllRecords.map(r => String(r.status || '').trim()).filter(Boolean)));
    statuses.sort();
    select.innerHTML = '<option value="">All Statuses</option>' + statuses.map(s => `<option value="${esc(s)}">${esc(s.charAt(0).toUpperCase() + s.slice(1))}</option>`).join('');
    if (statuses.includes(current)) select.value = current;
}

function shApplyActiveFolder() {
    const titles = {
        referrals: 'Referrals',
        counseling: 'Counseling Sessions',
        follow_ups: 'Counseling Appointment Span',
        appointments: 'Online Appointments'
    };
    document.querySelectorAll('.sh-folder-tab[data-folder]').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-folder') === shActiveFolder);
    });
    document.querySelectorAll('.sh-folder-body').forEach(body => {
        body.classList.toggle('active', body.id === `shBody-${shActiveFolder}`);
    });
    const titleEl = document.getElementById('shActiveFolderTitle');
    if (titleEl) titleEl.textContent = titles[shActiveFolder] || '';
}

function shGetFilters() {
    return {
        text: document.getElementById('shSearchText').value.trim().toLowerCase(),
        type: document.getElementById('shTypeFilter').value,
        status: document.getElementById('shStatusFilter').value.toLowerCase(),
        from: document.getElementById('shDateFrom').value,
        to: document.getElementById('shDateTo').value
    };
}

function shRecordMatches(record, filters) {
    if (filters.type && record.type !== filters.type) return false;
    if (filters.status && String(record.status || '').toLowerCase() !== filters.status) return false;
    if (filters.text && !record.search.includes(filters.text)) return false;
    if (filters.from || filters.to) {
        if (!record.date) return false;
        const recordDate = String(record.date).slice(0, 10);
        if (filters.from && recordDate < filters.from) return false;
        if (filters.to && recordDate > filters.to) return false;
    }
    return true;
}

function shHasActiveFilters(filters) {
    return Boolean(filters.text || filters.type || filters.status || filters.from || filters.to);
}

function shRenderFolders() {
    const filters = shGetFilters();

    const grouped = { referrals: [], counseling: [], follow_ups: [], appointments: [] };
    let totalMatches = 0;
    shAllRecords.forEach(r => {
        if (shRecordMatches(r, filters)) {
            grouped[r.type].push(r);
            totalMatches++;
        }
    });

    document.getElementById('shResultCount').innerHTML = `Showing <strong>${totalMatches}</strong> of <strong>${shAllRecords.length}</strong> records`;

    // When a specific record type is chosen, hide the other nav tabs and
    // switch the content panel to it — the fastest path to the records
    // being looked for. Otherwise leave the active tab alone so changing
    // other filters (search text, dates) doesn't jump the panel around.
    const visibleTypes = ['referrals', 'counseling', 'follow_ups', 'appointments'].filter(t => !filters.type || filters.type === t);
    document.querySelectorAll('.sh-folder-tab[data-folder]').forEach(tab => {
        tab.classList.toggle('sh-folder-hidden', !visibleTypes.includes(tab.getAttribute('data-folder')));
    });
    if (filters.type) {
        shActiveFolder = filters.type;
    } else if (!visibleTypes.includes(shActiveFolder)) {
        shActiveFolder = visibleTypes[0];
    }

    document.getElementById('shCount-referrals').textContent = grouped.referrals.length;
    document.getElementById('shCount-counseling').textContent = grouped.counseling.length;
    document.getElementById('shCount-follow_ups').textContent = grouped.follow_ups.length;
    document.getElementById('shCount-appointments').textContent = grouped.appointments.length;

    const hasActiveFilters = shHasActiveFilters(filters);
    shRenderReferralFolder(grouped.referrals, hasActiveFilters);
    shRenderCounselingFolder(grouped.counseling, hasActiveFilters);
    shRenderFollowUpFolder(grouped.follow_ups, hasActiveFilters);
    shRenderAppointmentFolder(grouped.appointments, hasActiveFilters);

    shApplyActiveFolder();
}

function shEmptyFolderHtml(noun, hasActiveFilters) {
    const message = hasActiveFilters
        ? `No ${noun} match the current filters.`
        : `No ${noun} recorded yet.`;
    return `<div class="sh-folder-empty">${esc(message)}</div>`;
}

function shRenderReferralFolder(records, hasActiveFilters) {
    const body = document.getElementById('shBody-referrals');
    if (records.length === 0) {
        body.innerHTML = shEmptyFolderHtml('referrals', hasActiveFilters);
        return;
    }
    body.innerHTML = records.map(({ raw: r }) => {
        const screeningsHtml = (r.screenings || []).length === 0 ? '' : `
            <div class="sh-subheading">Screening Notes (${r.screenings.length})</div>
            <div class="sh-mini-list">
                ${r.screenings.map(s => `
                    <div class="sh-mini-item">
                        <div class="sh-mini-item-head"><span>${esc(s.risk_level || 'Risk not set')}</span><span>${esc(shFormatDateTime(s.created_at))}</span></div>
                        ${s.interview_notes ? `<div><strong>Interview:</strong> ${esc(s.interview_notes)}</div>` : ''}
                        ${s.observations ? `<div><strong>Observations:</strong> ${esc(s.observations)}</div>` : ''}
                        <div style="color:var(--text-light);margin-top:2px;">by ${esc(s.counselor_name || 'N/A')}</div>
                    </div>
                `).join('')}
            </div>`;

        return `
        <div class="sh-file">
            <div class="sh-file-row">
                <i class="fas fa-file-alt sh-file-icon"></i>
                <div class="sh-file-main">
                    <div class="sh-file-title">${esc(r.referral_reason || 'Referral')} ${r.referral_code ? `<span style="color:var(--text-light);font-weight:400;">(${esc(r.referral_code)})</span>` : ''}</div>
                    <div class="sh-file-meta">
                        <span><i class="bi bi-calendar3"></i> ${esc(shFormatDate(r.date_submitted))}</span>
                        <span>Stage ${esc(r.stage)}/6</span>
                        <span class="badge ${shStatusBadgeClass(r.status)}">${esc(r.status)}</span>
                        <span style="text-transform:capitalize;">${esc(r.urgency)} urgency</span>
                    </div>
                </div>
                <i class="fas fa-chevron-right sh-file-chevron"></i>
            </div>
            <div class="sh-file-detail">
                <div class="sh-detail-row"><div class="sh-detail-label">Description</div><div class="sh-detail-value">${esc(r.description) || '—'}</div></div>
                <div class="sh-detail-row"><div class="sh-detail-label">Interventions Tried</div><div class="sh-detail-value">${esc(r.intervention_attempts) || '—'}</div></div>
                <div class="sh-detail-row"><div class="sh-detail-label">Observed Behaviors</div><div class="sh-detail-value">${esc(r.observed_behaviors) || '—'}</div></div>
                <div class="sh-detail-row"><div class="sh-detail-label">Referred By</div><div class="sh-detail-value">${esc(r.teacher_name) || '—'}</div></div>
                <div class="sh-detail-row"><div class="sh-detail-label">Last Updated</div><div class="sh-detail-value">${esc(shFormatDateTime(r.updated_at))}</div></div>
                ${screeningsHtml}
            </div>
        </div>`;
    }).join('');
}

function shRenderCounselingFolder(records, hasActiveFilters) {
    const body = document.getElementById('shBody-counseling');
    if (records.length === 0) {
        body.innerHTML = shEmptyFolderHtml('counseling sessions', hasActiveFilters);
        return;
    }
    body.innerHTML = records.map(({ raw: c }) => {
        const detail = c.student_detail || {};
        const hasDetail = detail && (detail.scenario_id || detail.action || detail.reason);
        return `
        <div class="sh-file">
            <div class="sh-file-row">
                <i class="fas fa-comments sh-file-icon"></i>
                <div class="sh-file-main">
                    <div class="sh-file-title">${esc(c.case_title || c.section_name || 'Counseling Case')}</div>
                    <div class="sh-file-meta">
                        <span><i class="bi bi-calendar3"></i> ${esc(shFormatDate(c.case_date))}</span>
                        ${c.category_name ? `<span>${esc(c.category_name)}</span>` : ''}
                        <span class="badge ${shStatusBadgeClass(c.status)}">${esc(c.status)}</span>
                    </div>
                </div>
                <i class="fas fa-chevron-right sh-file-chevron"></i>
            </div>
            <div class="sh-file-detail">
                <div class="sh-detail-row"><div class="sh-detail-label">Summary</div><div class="sh-detail-value">${esc(c.case_summary) || '—'}</div></div>
                <div class="sh-detail-row"><div class="sh-detail-label">Objective</div><div class="sh-detail-value">${esc(c.case_objective) || '—'}</div></div>
                <div class="sh-detail-row"><div class="sh-detail-label">First Action Taken</div><div class="sh-detail-value">${esc(c.first_action) || '—'}</div></div>
                <div class="sh-detail-row"><div class="sh-detail-label">Counselor</div><div class="sh-detail-value">${esc(c.counselor_name) || '—'}</div></div>
                <div class="sh-detail-row"><div class="sh-detail-label">Your Role</div><div class="sh-detail-value">${esc(c.student_role) || '—'}</div></div>
                ${hasDetail ? `
                <div class="sh-detail-row"><div class="sh-detail-label">Scenario</div><div class="sh-detail-value">${esc(detail.scenario_id) || '—'}</div></div>
                <div class="sh-detail-row"><div class="sh-detail-label">Action</div><div class="sh-detail-value">${esc(detail.action) || '—'}</div></div>
                <div class="sh-detail-row"><div class="sh-detail-label">Reason</div><div class="sh-detail-value">${esc(detail.reason) || '—'}</div></div>
                ` : ''}
                <div class="sh-detail-row"><div class="sh-detail-label">Recorded</div><div class="sh-detail-value">${esc(shFormatDateTime(c.created_at))}</div></div>
            </div>
        </div>`;
    }).join('');
}

function shRenderFollowUpFolder(records, hasActiveFilters) {
    const body = document.getElementById('shBody-follow_ups');
    if (records.length === 0) {
        body.innerHTML = shEmptyFolderHtml('follow-up appointments', hasActiveFilters);
        return;
    }
    body.innerHTML = records.map(({ raw: f }) => `
        <div class="sh-file">
            <div class="sh-file-row">
                <i class="fas fa-calendar-check sh-file-icon"></i>
                <div class="sh-file-main">
                    <div class="sh-file-title">${esc(f.category_name || f.case_title || 'Follow-up Session')}</div>
                    <div class="sh-file-meta">
                        <span><i class="bi bi-calendar3"></i> ${esc(shFormatDate(f.follow_up_date))}</span>
                        <span>${esc(f.counselor_name || 'N/A')}</span>
                    </div>
                </div>
                <i class="fas fa-chevron-right sh-file-chevron"></i>
            </div>
            <div class="sh-file-detail">
                <div class="sh-detail-row"><div class="sh-detail-label">Note</div><div class="sh-detail-value">${esc(f.note) || '—'}</div></div>
                <div class="sh-detail-row"><div class="sh-detail-label">Recorded</div><div class="sh-detail-value">${esc(shFormatDateTime(f.created_at))}</div></div>
            </div>
        </div>`).join('');
}

function shRenderAppointmentFolder(records, hasActiveFilters) {
    const body = document.getElementById('shBody-appointments');
    if (records.length === 0) {
        body.innerHTML = shEmptyFolderHtml('online appointments', hasActiveFilters);
        return;
    }
    body.innerHTML = records.map(({ raw: a }) => `
        <div class="sh-file">
            <div class="sh-file-row">
                <i class="fas fa-calendar-day sh-file-icon"></i>
                <div class="sh-file-main">
                    <div class="sh-file-title">${esc(a.reason || 'Appointment Request')}</div>
                    <div class="sh-file-meta">
                        <span><i class="bi bi-calendar3"></i> ${esc(shFormatDate(a.preferred_date))} ${esc(a.preferred_time || '')}</span>
                        <span class="badge ${shStatusBadgeClass(a.status)}">${esc(a.status)}</span>
                    </div>
                </div>
                <i class="fas fa-chevron-right sh-file-chevron"></i>
            </div>
            <div class="sh-file-detail">
                <div class="sh-detail-row"><div class="sh-detail-label">Your Notes</div><div class="sh-detail-value">${esc(a.notes) || '—'}</div></div>
                <div class="sh-detail-row"><div class="sh-detail-label">Counselor Notes</div><div class="sh-detail-value">${esc(a.counselor_notes) || '—'}</div></div>
                <div class="sh-detail-row"><div class="sh-detail-label">Requested</div><div class="sh-detail-value">${esc(shFormatDateTime(a.created_at))}</div></div>
            </div>
        </div>`).join('');
}

document.addEventListener('DOMContentLoaded', shInit);
