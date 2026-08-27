// Student History — aggregates referrals, counseling cases, counseling
// follow-ups, and online appointments for one student into folder-style
// panels, with client-side filtering (search/type/status/date range).

let shAllStudents = [];
let shAllRecords = [];   // normalized flat list across all 4 record types
let shCurrentStudent = null;
let shStudentsLoaded = false;
// 'personal' shows the static profile panel; anything else shows the merged
// activity timeline (optionally narrowed to one record type via shTypeFilter).
let shActiveFolder = 'timeline';

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

function getUserSchool() {
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

function shInit() {
    initPage();

    const school = getUserSchool();
    if (school && school !== 'Unknown') {
        fetch(`../../api/get-students.php?school=${encodeURIComponent(school)}&grade_scope=${encodeURIComponent(getCurrentGradeScope())}`)
            .then(res => res.json())
            .then(result => {
                shAllStudents = result.success ? (result.data || []) : [];
                shStudentsLoaded = true;
                shRenderStudentList(document.getElementById('shStudentSearch').value);
            })
            .catch(err => {
                console.error('Error preloading students:', err);
                shStudentsLoaded = true;
                shRenderStudentList('');
            });
    } else {
        shStudentsLoaded = true;
    }
    shRenderStudentList('');

    const searchInput = document.getElementById('shStudentSearch');
    // The search box only filters the always-visible list below it — no
    // separate dropdown/autocomplete step, so results update as you type.
    searchInput.addEventListener('input', () => shRenderStudentList(searchInput.value));

    document.getElementById('shStudentList').addEventListener('click', (e) => {
        const item = e.target.closest('.sh-slist-item');
        if (!item) return;
        shLoadStudent(item.getAttribute('data-student-id'));
    });

    document.getElementById('shBackToList').addEventListener('click', shShowBrowseList);

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
            shSelectFolder(navTab.getAttribute('data-folder'));
            return;
        }
        const fileRow = e.target.closest('.sh-file-row');
        if (fileRow) {
            fileRow.closest('.sh-file').classList.toggle('open');
        }
    });

    // The compact header chips mirror the folder nav below — clicking
    // either one applies the same selection and keeps both in sync.
    document.getElementById('shStatChips').addEventListener('click', (e) => {
        const chip = e.target.closest('.sh-stat-chip[data-folder]');
        if (!chip) return;
        shSelectFolder(chip.getAttribute('data-folder'));
        document.getElementById('shFolderGrid').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    const params = new URLSearchParams(window.location.search);
    const presetStudentId = params.get('student_id');
    if (presetStudentId) {
        shLoadStudent(presetStudentId);
    }
}

// "Personal Information" swaps to the static profile panel. Any record-type
// tab instead narrows the merged timeline to that type via the existing
// Record Type filter — clicking an already-selected one toggles it back off
// so the timeline returns to showing every record type together.
function shSelectFolder(folder) {
    if (folder === 'personal') {
        shActiveFolder = 'personal';
        shApplyActiveFolder();
        return;
    }
    shActiveFolder = 'timeline';
    const typeSelect = document.getElementById('shTypeFilter');
    typeSelect.value = typeSelect.value === folder ? '' : folder;
    shRenderFolders();
}

function shShowBrowseList() {
    shCurrentStudent = null;
    document.getElementById('shBackBar').style.display = 'none';
    document.getElementById('shBrowseCard').style.display = 'block';
    document.getElementById('shStudentHeaderCard').style.display = 'none';
    document.getElementById('shFilterCard').style.display = 'none';
    document.getElementById('shFolderGrid').style.display = 'none';
    document.getElementById('shEmptyState').style.display = 'none';
    document.getElementById('shLoadingState').style.display = 'none';

    const url = new URL(window.location.href);
    url.searchParams.delete('student_id');
    window.history.replaceState({}, '', url);
}

function shRenderStudentList(term) {
    const listEl = document.getElementById('shStudentList');
    const countEl = document.getElementById('shSlistCount');
    const q = (term || '').trim().toLowerCase();

    if (!shStudentsLoaded) {
        listEl.innerHTML = '<div class="sh-slist-loading">Loading students…</div>';
        countEl.textContent = '';
        return;
    }

    if (shAllStudents.length === 0) {
        listEl.innerHTML = '<div class="sh-slist-empty">No students found for your school.</div>';
        countEl.textContent = '';
        return;
    }

    const matches = shAllStudents.filter(s => {
        if (!q) return true;
        const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
        const id = String(s.id || s.StudentId || '').toLowerCase();
        return name.includes(q) || id.includes(q) || String(s.email || '').toLowerCase().includes(q);
    }).sort((a, b) => `${a.first_name || ''} ${a.last_name || ''}`.trim().localeCompare(`${b.first_name || ''} ${b.last_name || ''}`.trim()));

    countEl.innerHTML = `Showing <strong>${matches.length}</strong> of <strong>${shAllStudents.length}</strong> students`;

    if (matches.length === 0) {
        listEl.innerHTML = '<div class="sh-slist-empty">No students match your search.</div>';
        return;
    }

    listEl.innerHTML = matches.map(s => {
        const id = s.id || s.StudentId || '';
        const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unnamed Student';
        const initials = name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'S';
        const grade = s.grade_name || s.grade_level || s.Grade || '';
        const active = shCurrentStudent && String(shCurrentStudent.student_id) === String(id) ? ' active' : '';
        return `<div class="sh-slist-item${active}" data-student-id="${esc(id)}">
            <div class="sh-slist-avatar">${esc(initials)}</div>
            <div class="sh-slist-main">
                <div class="sh-slist-name">${esc(name)}</div>
                <div class="sh-slist-meta">ID: ${esc(id)}${grade ? ' &middot; ' + esc(grade) : ''}</div>
            </div>
        </div>`;
    }).join('');
}

function shLoadStudent(studentId) {
    document.getElementById('shBrowseCard').style.display = 'none';
    document.getElementById('shBackBar').style.display = 'block';
    document.getElementById('shEmptyState').style.display = 'none';
    document.getElementById('shFolderGrid').style.display = 'none';
    document.getElementById('shStudentHeaderCard').style.display = 'none';
    document.getElementById('shFilterCard').style.display = 'none';
    document.getElementById('shLoadingState').style.display = 'block';

    const url = new URL(window.location.href);
    url.searchParams.set('student_id', studentId);
    window.history.replaceState({}, '', url);

    const apiUrl = `../../api/student-history.php?student_id=${encodeURIComponent(studentId)}&grade_scope=${encodeURIComponent(getCurrentGradeScope())}`;

    fetch(apiUrl)
        .then(res => res.json())
        .then(result => {
            document.getElementById('shLoadingState').style.display = 'none';
            if (!result.success) {
                document.getElementById('shEmptyState').style.display = 'block';
                document.getElementById('shEmptyState').innerHTML = `
                    <i class="fas fa-triangle-exclamation"></i>
                    <h3>Couldn't load history</h3>
                    <p>${esc(result.message || 'Unknown error')}</p>`;
                return;
            }
            shCurrentStudent = result.student;
            const counts = result.counts || {};
            // Land on the merged timeline with every record type showing
            // together, rather than pre-picking one type to isolate.
            shActiveFolder = 'timeline';
            document.getElementById('shTypeFilter').value = '';
            shBuildNormalizedRecords(result.data || {});
            shRenderStudentHeader(result.student, counts);
            shRenderPersonalInfo(result.student);
            shPopulateStatusFilter();
            document.getElementById('shFolderGrid').style.display = 'grid';
            document.getElementById('shFilterCard').style.display = 'block';
            shRenderFolders();
        })
        .catch(err => {
            console.error('Error loading student history:', err);
            document.getElementById('shLoadingState').style.display = 'none';
            document.getElementById('shEmptyState').style.display = 'block';
            document.getElementById('shEmptyState').innerHTML = `
                <i class="fas fa-triangle-exclamation"></i>
                <h3>Couldn't load history</h3>
                <p>${esc(err.message || err)}</p>`;
        });
}

function shRenderStudentHeader(student, counts) {
    const card = document.getElementById('shStudentHeaderCard');
    card.style.display = 'block';

    const name = student.name || 'Unnamed Student';
    const initials = name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'S';
    document.getElementById('shAvatar').textContent = initials;
    document.getElementById('shStudentName').textContent = name;

    // Grade values in this DB mix legacy numeric codes (e.g. "1" meaning
    // Grade 7) with real grade numbers (e.g. "10") — normalizeGradeNumber
    // (from utils.js, mirrors api/grade-scope.php) resolves both the same
    // way the rest of the app does instead of printing the raw code.
    const normalizedGrade = normalizeGradeNumber(student.grade);
    const gradeLabel = normalizedGrade ? `Grade ${normalizedGrade}` : (student.grade ? String(student.grade) : 'Grade N/A');
    const subParts = [`ID: ${student.student_id || 'N/A'}`, gradeLabel, student.section || null, student.email || null].filter(Boolean);
    document.getElementById('shStudentSub').textContent = subParts.join(' · ');

    const chipDefs = [
        { key: 'personal', label: 'Personal Info', icon: 'fa-id-card' },
        { key: 'referrals', label: 'Referrals', icon: 'fa-file-alt' },
        { key: 'counseling', label: 'Counseling', icon: 'fa-comments' },
        { key: 'follow_ups', label: 'Follow-Ups', icon: 'fa-calendar-check' },
        { key: 'appointments', label: 'Appointments', icon: 'fa-calendar-day' }
    ];
    document.getElementById('shStatChips').innerHTML = chipDefs.map(c => `
        <div class="sh-stat-chip" data-folder="${c.key}" role="button" tabindex="0">
            <i class="fas ${c.icon}"></i> ${c.label}${c.key === 'personal' ? '' : ` <span class="sh-stat-count">${counts[c.key] || 0}</span>`}
        </div>
    `).join('');
}

function shRenderPersonalInfo(student) {
    const body = document.getElementById('shBody-personal');
    const normalizedGrade = normalizeGradeNumber(student.grade);
    const gradeLabel = normalizedGrade ? `Grade ${normalizedGrade}` : (student.grade ? String(student.grade) : 'N/A');
    const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ') || student.name || 'N/A';

    const rows = (pairs) => pairs.map(([label, value]) => `
        <div class="sh-detail-row">
            <div class="sh-detail-label">${esc(label)}</div>
            <div class="sh-detail-value">${value ? esc(value) : 'N/A'}</div>
        </div>
    `).join('');

    body.innerHTML = `
        <div class="sh-subheading">Basic Information</div>
        ${rows([
            ['Full Name', fullName],
            ['Nickname', student.nickname],
            ['LRN', student.lrn],
            ['Sex', student.sex],
            ['Age', student.age],
            ['Date of Birth', shFormatDate(student.date_of_birth)],
            ['Place of Birth', student.place_of_birth],
            ['Religion (from birth)', student.religion_from_birth],
            ['Current Religion', student.current_religion]
        ])}

        <div class="sh-subheading">Contact &amp; Address</div>
        ${rows([
            ['Email', student.email],
            ['Cellphone', student.contact],
            ['Current Address', student.current_address],
            ['Permanent Address', student.permanent_address]
        ])}

        <div class="sh-subheading">Academic Info</div>
        ${rows([
            ['Student ID', student.student_id],
            ['Grade', gradeLabel],
            ['Section', student.section]
        ])}
    `;
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
    const typeFilter = document.getElementById('shTypeFilter').value;
    const highlighted = shActiveFolder === 'personal' ? 'personal' : (typeFilter || null);

    document.querySelectorAll('.sh-folder-tab[data-folder]').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-folder') === highlighted);
    });
    document.querySelectorAll('.sh-stat-chip[data-folder]').forEach(chip => {
        chip.classList.toggle('active', chip.getAttribute('data-folder') === highlighted);
    });
    document.getElementById('shBody-personal').classList.toggle('active', shActiveFolder === 'personal');
    document.getElementById('shBody-timeline').classList.toggle('active', shActiveFolder !== 'personal');

    const titles = {
        referrals: 'Referrals',
        counseling: 'Counseling Sessions',
        follow_ups: 'Counseling Appointment Span',
        appointments: 'Online Appointments'
    };
    const titleEl = document.getElementById('shActiveFolderTitle');
    if (titleEl) {
        titleEl.textContent = shActiveFolder === 'personal' ? 'Personal Information' : (titles[typeFilter] || 'Recent History');
    }
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
    if (!shCurrentStudent) return;
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

    // Any filter interaction is about the record timeline, not the static
    // Personal Information panel, so it always takes over as the active view.
    const hasActiveFilters = shHasActiveFilters(filters);
    if (shActiveFolder !== 'personal' || hasActiveFilters) {
        shActiveFolder = 'timeline';
    }

    shRenderTimeline(grouped, hasActiveFilters);

    shApplyActiveFolder();
}

function shEmptyFolderHtml(noun, hasActiveFilters) {
    const message = hasActiveFilters
        ? `No ${noun} match the current filters.`
        : `No ${noun} recorded for this student yet.`;
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

/* Builds one timeline entry — reusing the exact same .sh-file/.sh-file-row/
   .sh-file-detail structure the old per-folder cards used, so the existing
   click-to-expand delegation in shInit() keeps working unchanged. Each type
   gets a "who did what" head line so the feed reads as a log of counselor/
   coordinator (or the student's own) actions, matching how the referring
   record actually gets attributed in the data. */
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
            <div class="sh-detail-row"><div class="sh-detail-label">Parent / Guardian</div><div class="sh-detail-value">${esc(r.parent_guardian) || '—'} ${r.parent_contact ? `(${esc(r.parent_contact)})` : ''}</div></div>
            <div class="sh-detail-row"><div class="sh-detail-label">Referred By</div><div class="sh-detail-value">${esc(r.teacher_name) || '—'}</div></div>
            <div class="sh-detail-row"><div class="sh-detail-label">Grade / Section</div><div class="sh-detail-value">${esc(r.grade) || '—'} ${r.section ? '/ ' + esc(r.section) : ''}</div></div>
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
            <div class="sh-detail-row"><div class="sh-detail-label">Student's Role</div><div class="sh-detail-value">${esc(c.student_role) || '—'}</div></div>
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
            <div class="sh-detail-row"><div class="sh-detail-label">Linked Case</div><div class="sh-detail-value">${esc(f.case_title || f.case_uid) || '—'}</div></div>
            <div class="sh-detail-row"><div class="sh-detail-label">Follow-Up Date</div><div class="sh-detail-value">${esc(shFormatDate(f.follow_up_date))}</div></div>
        `;
    } else if (record.type === 'appointments') {
        const a = record.raw;
        const status = String(a.status || '').toLowerCase();
        const resolved = SH_RESOLVED_APPOINTMENT_STATUSES.includes(status);
        if (resolved) {
            actorLine = `<strong>Counselor</strong> ${esc(status)} an appointment request — <strong>${esc(a.reason || 'Appointment')}</strong>`;
            dateVal = a.updated_at || a.created_at;
        } else {
            const studentName = (shCurrentStudent && shCurrentStudent.name) || 'Student';
            actorLine = `<strong>${esc(studentName)}</strong> requested an appointment — <strong>${esc(a.reason || 'Appointment')}</strong>`;
            dateVal = a.created_at;
        }
        detailBody = `
            <div class="sh-detail-row"><div class="sh-detail-label">Preferred Date</div><div class="sh-detail-value">${esc(shFormatDate(a.preferred_date))} ${esc(a.preferred_time || '')}</div></div>
            <div class="sh-detail-row"><div class="sh-detail-label">Student Notes</div><div class="sh-detail-value">${esc(a.notes) || '—'}</div></div>
            <div class="sh-detail-row"><div class="sh-detail-label">Counselor Notes</div><div class="sh-detail-value">${esc(a.counselor_notes) || '—'}</div></div>
            <div class="sh-detail-row"><div class="sh-detail-label">Requested</div><div class="sh-detail-value">${esc(shFormatDateTime(a.created_at))}</div></div>
            <div class="sh-detail-row"><div class="sh-detail-label">Last Updated</div><div class="sh-detail-value">${esc(shFormatDateTime(a.updated_at))}</div></div>
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
   showing up as separate flat entries. This is the "one timeline of every
   session" view: every day of one case reads as a single continuous story. */
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

    // Bucket follow-ups by case so each counseling case can absorb its own
    // follow-ups into one thread. A follow-up whose case isn't in the
    // current (filtered) counseling results falls back to a standalone
    // entry — e.g. filtering to "Counseling Follow-Ups" only.
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
