// My History (student self-service) — shows the logged-in student's own
// referrals, counseling cases, counseling follow-ups, and online
// appointments as folder-style panels, with client-side filtering.
//
// Unlike the counselor-facing student-history.js this never accepts a
// student_id from the URL or a picker — the id always comes from the
// logged-in session, so a student can only ever load their own records.

let shAllRecords = [];   // normalized flat list across all 4 record types

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
            // Folder tabs are shortcuts into the Record Type filter, not
            // separate isolated panels — everything shows together in one
            // timeline, narrowed by whichever filters are active. Clicking
            // an already-selected type toggles it back off.
            const typeSelect = document.getElementById('shTypeFilter');
            const folder = navTab.getAttribute('data-folder');
            typeSelect.value = typeSelect.value === folder ? '' : folder;
            shRenderFolders();
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

    fetch(`../../api/student-history.php?student_id=${encodeURIComponent(studentId)}`)
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

// Folder tabs no longer switch panels — they just highlight to reflect
// whichever Record Type filter is active, and the title reflects it too.
function shApplyActiveFolder() {
    const titles = {
        referrals: 'Referrals',
        counseling: 'Counseling Sessions',
        follow_ups: 'Counseling Appointment Span',
        appointments: 'Online Appointments'
    };
    const typeFilter = document.getElementById('shTypeFilter').value;
    document.querySelectorAll('.sh-folder-tab[data-folder]').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-folder') === typeFilter);
    });
    const titleEl = document.getElementById('shActiveFolderTitle');
    if (titleEl) titleEl.textContent = titles[typeFilter] || 'Recent History';
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

    document.getElementById('shCount-referrals').textContent = grouped.referrals.length;
    document.getElementById('shCount-counseling').textContent = grouped.counseling.length;
    document.getElementById('shCount-follow_ups').textContent = grouped.follow_ups.length;
    document.getElementById('shCount-appointments').textContent = grouped.appointments.length;

    shRenderTimeline(grouped, shHasActiveFilters(filters));
    shApplyActiveFolder();
}

function shEmptyFolderHtml(noun, hasActiveFilters) {
    const message = hasActiveFilters
        ? `No ${noun} match the current filters.`
        : `No ${noun} recorded yet.`;
    return `<div class="sh-folder-empty">${esc(message)}</div>`;
}

function shParseDate(value) {
    if (!value) return null;
    const d = new Date(typeof value === 'string' ? value.replace(' ', 'T') : value);
    return isNaN(d.getTime()) ? null : d;
}

function shTimelineDotColor(status) {
    const cls = shStatusBadgeClass(status);
    if (cls === 'badge-completed') return 'var(--ok)';
    if (cls === 'badge-in-progress') return 'var(--info)';
    if (cls === 'badge-rejected') return 'var(--danger)';
    return 'var(--warn)';
}

function shTimelineGroupLabel(dateObj) {
    const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((startOf(new Date()) - startOf(dateObj)) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
}

const SH_RESOLVED_APPOINTMENT_STATUSES = ['approved', 'declined', 'rejected', 'completed', 'done', 'cancelled', 'canceled'];

/* Builds one timeline entry — same .sh-file/.sh-file-row/.sh-file-detail
   structure the old per-folder cards used, so the existing click-to-expand
   delegation in shInit() keeps working unchanged. Referral/counseling/
   follow-up entries attribute to the staff member who acted (teacher_name /
   counselor_name); appointment requests read as "You" since this is always
   the logged-in student's own history. */
function shBuildTimelineEntry(record) {
    let actorLine = '';
    let dateVal = record.date;
    let detailBody = '';

    if (record.type === 'referrals') {
        const r = record.raw;
        actorLine = `<strong>${esc(r.teacher_name || 'A teacher')}</strong> submitted a referral — <strong>${esc(r.referral_reason || 'Referral')}</strong>${r.referral_code ? ` <span style="color:var(--text-light);font-weight:400;">(${esc(r.referral_code)})</span>` : ''}`;
        dateVal = r.date_submitted;
        detailBody = `
            <div class="sh-detail-row"><div class="sh-detail-label">Description</div><div class="sh-detail-value">${esc(r.description) || '—'}</div></div>
            <div class="sh-detail-row"><div class="sh-detail-label">Interventions Tried</div><div class="sh-detail-value">${esc(r.intervention_attempts) || '—'}</div></div>
            <div class="sh-detail-row"><div class="sh-detail-label">Observed Behaviors</div><div class="sh-detail-value">${esc(r.observed_behaviors) || '—'}</div></div>
            <div class="sh-detail-row"><div class="sh-detail-label">Referred By</div><div class="sh-detail-value">${esc(r.teacher_name) || '—'}</div></div>
            <div class="sh-detail-row"><div class="sh-detail-label">Stage</div><div class="sh-detail-value">${esc(r.stage)}/6</div></div>
            <div class="sh-detail-row"><div class="sh-detail-label">Last Updated</div><div class="sh-detail-value">${esc(shFormatDateTime(r.updated_at))}</div></div>
            ${(r.screenings || []).length === 0 ? '' : `
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
            </div>`}
        `;
    } else if (record.type === 'counseling') {
        const c = record.raw;
        const detail = c.student_detail || {};
        const hasDetail = detail && (detail.scenario_id || detail.action || detail.reason);
        const resolved = ['completed', 'resolved', 'done', 'closed'].includes(String(c.status || '').toLowerCase());
        actorLine = `<strong>${esc(c.counselor_name || 'A counselor')}</strong> ${resolved ? 'resolved counseling case' : 'logged a counseling session'} — <strong>${esc(c.case_title || c.section_name || 'Counseling Case')}</strong>`;
        dateVal = c.created_at || c.case_date;
        detailBody = `
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
        `;
    } else if (record.type === 'follow_ups') {
        const f = record.raw;
        actorLine = `<strong>${esc(f.counselor_name || 'A counselor')}</strong> added a follow-up note — <strong>${esc(f.category_name || f.case_title || 'Follow-up Session')}</strong>`;
        dateVal = f.created_at || f.follow_up_date;
        detailBody = `
            <div class="sh-detail-row"><div class="sh-detail-label">Note</div><div class="sh-detail-value">${esc(f.note) || '—'}</div></div>
            <div class="sh-detail-row"><div class="sh-detail-label">Follow-Up Date</div><div class="sh-detail-value">${esc(shFormatDate(f.follow_up_date))}</div></div>
        `;
    } else if (record.type === 'appointments') {
        const a = record.raw;
        const status = String(a.status || '').toLowerCase();
        const resolved = SH_RESOLVED_APPOINTMENT_STATUSES.includes(status);
        if (resolved) {
            actorLine = `<strong>Counselor</strong> ${esc(status)} your appointment request — <strong>${esc(a.reason || 'Appointment')}</strong>`;
            dateVal = a.updated_at || a.created_at;
        } else {
            actorLine = `<strong>You</strong> requested an appointment — <strong>${esc(a.reason || 'Appointment')}</strong>`;
            dateVal = a.created_at;
        }
        detailBody = `
            <div class="sh-detail-row"><div class="sh-detail-label">Preferred Date</div><div class="sh-detail-value">${esc(shFormatDate(a.preferred_date))} ${esc(a.preferred_time || '')}</div></div>
            <div class="sh-detail-row"><div class="sh-detail-label">Your Notes</div><div class="sh-detail-value">${esc(a.notes) || '—'}</div></div>
            <div class="sh-detail-row"><div class="sh-detail-label">Counselor Notes</div><div class="sh-detail-value">${esc(a.counselor_notes) || '—'}</div></div>
            <div class="sh-detail-row"><div class="sh-detail-label">Requested</div><div class="sh-detail-value">${esc(shFormatDateTime(a.created_at))}</div></div>
        `;
    } else {
        return null;
    }

    const dateObj = shParseDate(dateVal) || new Date(0);
    const dot = shTimelineDotColor(record.status);
    const meta = `${esc(shFormatDateTime(dateVal))} &middot; <span class="badge ${shStatusBadgeClass(record.status)}">${esc(record.status)}</span>`;

    const html = `
        <div class="sh-file sh-timeline-item">
            <div class="sh-file-row">
                <span class="sh-timeline-dot" style="background:${dot}"></span>
                <div class="sh-file-main">
                    <div class="sh-timeline-text">${actorLine}</div>
                    <div class="sh-timeline-meta">${meta}</div>
                </div>
                <i class="fas fa-chevron-right sh-file-chevron"></i>
            </div>
            <div class="sh-file-detail">${detailBody}</div>
        </div>`;

    return { dateObj, html };
}

const SH_RESOLVED_CASE_STATUSES = ['completed', 'resolved', 'done', 'closed'];

/* A counseling case with linked follow-ups becomes one "case thread" — Day 1
   is the case itself, Day 2+ are its follow-ups in date order — instead of
   showing up as separate flat entries. */
function shBuildCaseThreadEntry(c, followUpsRaw) {
    const sortedFollowUps = followUpsRaw.slice().sort((a, b) => {
        const da = shParseDate(a.follow_up_date || a.created_at) || new Date(0);
        const db = shParseDate(b.follow_up_date || b.created_at) || new Date(0);
        return da - db;
    });

    const resolved = SH_RESOLVED_CASE_STATUSES.includes(String(c.status || '').toLowerCase());
    const day1Note = [
        c.case_summary,
        c.case_objective ? `Objective: ${c.case_objective}` : '',
        c.first_action ? `First action: ${c.first_action}` : ''
    ].filter(Boolean).join(' ') || 'Counseling session recorded.';

    const days = [{ rawDate: c.created_at || c.case_date, label: 'Initial session', note: day1Note }]
        .concat(sortedFollowUps.map(f => ({
            rawDate: f.follow_up_date || f.created_at,
            label: 'Follow-up',
            note: f.note || 'Follow-up session recorded.'
        })));

    if (resolved && days.length > 1) {
        days[days.length - 1].label = 'Closing';
    }

    const counselorName = esc(c.counselor_name || 'A counselor');
    const daysHtml = days.map((day, i) => {
        const dayNum = i + 1;
        const isLast = i === days.length - 1;
        const pill = isLast && resolved ? 'REVIEW' : (dayNum === 1 ? 'OPENED' : 'CONTINUED');
        return `
        <div class="sh-case-day">
            <div class="sh-case-day-row">
                <span class="sh-case-day-badge">${dayNum}</span>
                <div class="sh-case-day-bar">
                    <span>Day ${dayNum} — ${esc(day.label)}</span>
                    <span class="sh-case-day-pill">${pill}</span>
                </div>
            </div>
            <div class="sh-case-note-row">
                <span class="sh-case-note-icon"><i class="fas fa-pen"></i></span>
                <div class="sh-case-note-body">
                    <div class="sh-case-note-head"><strong>${counselorName}</strong> added a note &middot; ${esc(shFormatDateTime(day.rawDate))}</div>
                    <div class="sh-case-note-text">${esc(day.note)}</div>
                </div>
            </div>
        </div>`;
    }).join('');

    const lastDay = days[days.length - 1];
    const doneHtml = resolved ? `
        <div class="sh-case-done-row">
            <span class="sh-case-done-icon"><i class="fas fa-check"></i></span>
            <div class="sh-case-note-body">
                <div class="sh-case-note-head"><strong>${counselorName}</strong> marked the case as done &middot; ${esc(shFormatDateTime(c.updated_at || lastDay.rawDate))}</div>
                <div class="sh-case-done-summary">${days.length} day${days.length === 1 ? '' : 's'} &middot; ${days.length} note${days.length === 1 ? '' : 's'}</div>
            </div>
        </div>` : '';

    const html = `
        <div class="sh-case-thread">
            <div class="sh-case-thread-header">
                <div>
                    <div class="sh-case-thread-title">${c.case_uid ? `Case #${esc(c.case_uid)} &middot; ` : ''}${esc(c.case_title || c.section_name || 'Counseling Case')}</div>
                    <div class="sh-case-thread-sub">${esc(c.category_name || 'Counseling')} &middot; Handled by ${counselorName}</div>
                </div>
                <span class="badge ${shStatusBadgeClass(c.status)} sh-case-thread-status">${esc(c.status)}</span>
            </div>
            <div class="sh-case-thread-days">${daysHtml}</div>
            ${doneHtml}
        </div>`;

    const dateObj = shParseDate(resolved ? (c.updated_at || lastDay.rawDate) : lastDay.rawDate) || new Date(0);
    return { dateObj, html };
}

function shRenderTimeline(grouped, hasActiveFilters) {
    const body = document.getElementById('shBody-timeline');
    const totalCount = grouped.referrals.length + grouped.counseling.length + grouped.follow_ups.length + grouped.appointments.length;
    if (totalCount === 0) {
        body.innerHTML = shEmptyFolderHtml('records', hasActiveFilters);
        return;
    }

    const followUpsByCase = {};
    grouped.follow_ups.forEach(f => {
        const key = f.raw.case_uid || '';
        if (!key) return;
        (followUpsByCase[key] = followUpsByCase[key] || []).push(f.raw);
    });

    const threadedCaseUids = new Set();
    const entries = [];

    grouped.counseling.forEach(c => {
        const caseUid = c.raw.case_uid || '';
        const linkedFollowUps = caseUid ? followUpsByCase[caseUid] : null;
        if (linkedFollowUps && linkedFollowUps.length > 0) {
            threadedCaseUids.add(caseUid);
            entries.push(shBuildCaseThreadEntry(c.raw, linkedFollowUps));
        } else {
            const entry = shBuildTimelineEntry(c);
            if (entry) entries.push(entry);
        }
    });

    grouped.follow_ups.forEach(f => {
        const caseUid = f.raw.case_uid || '';
        if (caseUid && threadedCaseUids.has(caseUid)) return;
        const entry = shBuildTimelineEntry(f);
        if (entry) entries.push(entry);
    });

    grouped.referrals.forEach(r => {
        const entry = shBuildTimelineEntry(r);
        if (entry) entries.push(entry);
    });

    grouped.appointments.forEach(a => {
        const entry = shBuildTimelineEntry(a);
        if (entry) entries.push(entry);
    });

    entries.sort((a, b) => b.dateObj - a.dateObj);

    let html = '';
    let currentGroup = null;
    entries.forEach(entry => {
        const label = shTimelineGroupLabel(entry.dateObj);
        if (label !== currentGroup) {
            if (currentGroup !== null) html += '</div>';
            html += `<div class="sh-timeline-group"><div class="sh-timeline-group-label">${esc(label)}</div>`;
            currentGroup = label;
        }
        html += entry.html;
    });
    html += '</div>';

    body.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', shInit);
