// Student History — aggregates referrals, counseling cases, counseling
// follow-ups, and online appointments for one student into folder-style
// panels, with client-side filtering (search/type/status/date range).

let shAllStudents = [];
let shAllRecords = [];   // normalized flat list across all 4 record types
let shCurrentStudent = null;
let shStudentsLoaded = false;
// Student picker pagination — 'all' disables paging entirely.
let shPageSize = 20;
let shListPage = 1;
// Timeline pagination (the merged activity feed for one selected student) —
// separate from the student-picker pagination above. 'all' disables paging.
let shTimelinePageSize = 20;
let shTimelinePage = 1;
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
    searchInput.addEventListener('input', () => {
        shListPage = 1;
        shRenderStudentList(searchInput.value);
    });

    const pageSizeSelect = document.getElementById('shPageSize');
    pageSizeSelect.addEventListener('change', () => {
        shPageSize = pageSizeSelect.value === 'all' ? Infinity : parseInt(pageSizeSelect.value, 10);
        shListPage = 1;
        shRenderStudentList(searchInput.value);
    });

    document.getElementById('shStudentList').addEventListener('click', (e) => {
        const item = e.target.closest('.sh-slist-item');
        if (!item) return;
        shLoadStudent(item.getAttribute('data-student-id'));
    });

    document.getElementById('shSlistPagination').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-page]');
        if (!btn || btn.disabled) return;
        shListPage = btn.getAttribute('data-page') === 'next' ? shListPage + 1 : shListPage - 1;
        shRenderStudentList(searchInput.value);
    });

    document.getElementById('shBackToList').addEventListener('click', shShowBrowseList);

    ['shSearchText', 'shTypeFilter', 'shStatusFilter', 'shDateFrom', 'shDateTo'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('input', () => { shTimelinePage = 1; shRenderFolders(); });
        el.addEventListener('change', () => { shTimelinePage = 1; shRenderFolders(); });
    });

    const timelinePageSizeSelect = document.getElementById('shTimelinePageSize');
    timelinePageSizeSelect.addEventListener('change', () => {
        shTimelinePageSize = timelinePageSizeSelect.value === 'all' ? Infinity : parseInt(timelinePageSizeSelect.value, 10);
        shTimelinePage = 1;
        shRenderFolders();
    });

    document.getElementById('shTimelinePagination').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-page]');
        if (!btn || btn.disabled) return;
        shTimelinePage = btn.getAttribute('data-page') === 'next' ? shTimelinePage + 1 : shTimelinePage - 1;
        shRenderFolders();
    });

    document.getElementById('shClearFilters').addEventListener('click', () => {
        document.getElementById('shSearchText').value = '';
        document.getElementById('shTypeFilter').value = '';
        document.getElementById('shStatusFilter').value = '';
        document.getElementById('shDateFrom').value = '';
        document.getElementById('shDateTo').value = '';
        shTimelinePage = 1;
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
            return;
        }
        // Referral and counseling-case threads both collapse to just their
        // summary header by default (see shBuildReferralThreadEntry() /
        // shBuildCaseThreadEntry()) — clicking it reveals the full
        // Day 1/2/3... story underneath. Both share the same
        // .sh-referral-thread-* toggle classes/CSS rather than each having
        // their own collapse mechanism.
        const threadToggle = e.target.closest('.sh-referral-thread-toggle');
        if (threadToggle) {
            threadToggle.closest('.sh-referral-thread').classList.toggle('open');
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
    shTimelinePage = 1;
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
    const paginationEl = document.getElementById('shSlistPagination');
    const q = (term || '').trim().toLowerCase();

    if (!shStudentsLoaded) {
        listEl.innerHTML = '<div class="sh-slist-loading">Loading students…</div>';
        countEl.textContent = '';
        paginationEl.innerHTML = '';
        return;
    }

    if (shAllStudents.length === 0) {
        listEl.innerHTML = '<div class="sh-slist-empty">No students found for your school.</div>';
        countEl.textContent = '';
        paginationEl.innerHTML = '';
        return;
    }

    const matches = shAllStudents.filter(s => {
        if (!q) return true;
        const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
        const id = String(s.id || s.StudentId || '').toLowerCase();
        return name.includes(q) || id.includes(q) || String(s.email || '').toLowerCase().includes(q);
    }).sort((a, b) => `${a.first_name || ''} ${a.last_name || ''}`.trim().localeCompare(`${b.first_name || ''} ${b.last_name || ''}`.trim()));

    if (matches.length === 0) {
        countEl.innerHTML = `Showing <strong>0</strong> of <strong>${shAllStudents.length}</strong> students`;
        listEl.innerHTML = '<div class="sh-slist-empty">No students match your search.</div>';
        paginationEl.innerHTML = '';
        return;
    }

    const totalPages = Math.max(1, Math.ceil(matches.length / shPageSize));
    if (shListPage > totalPages) shListPage = totalPages;
    if (shListPage < 1) shListPage = 1;

    const startIdx = shPageSize === Infinity ? 0 : (shListPage - 1) * shPageSize;
    const endIdx = shPageSize === Infinity ? matches.length : Math.min(startIdx + shPageSize, matches.length);
    const pageItems = matches.slice(startIdx, endIdx);

    countEl.innerHTML = matches.length > pageItems.length
        ? `Showing <strong>${startIdx + 1}&ndash;${endIdx}</strong> of <strong>${matches.length}</strong> students`
        : `Showing <strong>${matches.length}</strong> of <strong>${shAllStudents.length}</strong> students`;

    listEl.innerHTML = pageItems.map(s => {
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

    if (shPageSize === Infinity || totalPages <= 1) {
        paginationEl.innerHTML = '';
    } else {
        paginationEl.innerHTML = `
            <button type="button" class="btn btn-secondary btn-sm" data-page="prev" ${shListPage <= 1 ? 'disabled' : ''}>
                <i class="bi bi-chevron-left"></i> Prev
            </button>
            <span class="sh-slist-page-info">Page ${shListPage} of ${totalPages}</span>
            <button type="button" class="btn btn-secondary btn-sm" data-page="next" ${shListPage >= totalPages ? 'disabled' : ''}>
                Next <i class="bi bi-chevron-right"></i>
            </button>`;
    }
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
            shTimelinePage = 1;
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
    if (typeof value === 'string') {
        // A bare "YYYY-MM-DD" (no time part — e.g. follow_up_date) is parsed
        // by the JS Date constructor as UTC midnight per spec, while the
        // "T"-joined datetime strings below (e.g. created_at) parse as local
        // time — so a date-only value ends up several hours off from where
        // it belongs once displayed/compared in local time (UTC midnight
        // shows as 8 AM local for a UTC+8 reader). Parse date-only values as
        // local midnight instead so both kinds compare and group correctly.
        const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateOnly) {
            const [, y, m, d] = dateOnly;
            return new Date(Number(y), Number(m) - 1, Number(d));
        }
        value = value.replace(' ', 'T');
    }
    const d = new Date(value);
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
   click-to-expand delegation in shInit() keeps working unchanged. Referrals
   no longer go through here — see shBuildReferralThreadEntry() below, which
   renders a full Day 1/2/3... story instead of a flat field list. Each
   remaining type gets a "who did what" head line so the feed reads as a
   log of counselor/coordinator actions, matching how the referring record
   actually gets attributed in the data. */
function shBuildTimelineEntry(record) {
    let actorLine = '';
    let dateVal = record.date;
    let detailBody = '';

    if (record.type === 'counseling') {
        const c = record.raw;
        const detail = c.student_detail || {};
        const hasDetail = detail && (detail.scenario_id || detail.action || detail.reason);
        const resolved = ['completed', 'resolved', 'done', 'closed'].includes(String(c.status || '').toLowerCase());
        actorLine = `<strong>${esc(c.counselor_name || 'A counselor')}</strong> ${resolved ? 'resolved counseling case' : 'logged a counseling session'} — <strong>${esc(c.case_title || c.section_name || 'Counseling Case')}</strong>`;
        dateVal = c.created_at || c.case_date;
        detailBody = `
            <div class="sh-detail-row"><div class="sh-detail-label">Summary</div><div class="sh-detail-value">${esc(shStripReferralLinkTag(c.case_summary)) || '—'}</div></div>
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

const SH_STAGE_NAMES = {
    1: 'Interview/Background',
    2: 'Initial Risk Assessment',
    3: 'Parent Call-up/Consent',
    4: 'Intervention',
    5: 'Counseling',
    6: 'Student Follow-up'
};

// Turns one referral_stage_log row (see api/update-referral.php) into a
// plain-English sentence for the timeline. The specific cases mirror the
// actual branching logic in referral-status.js/referrals.js
// (confirmAssessmentCompleted(), confirmConsentDecision()) — everything
// else (a plain advance, or a coordinator's manual stage jump) falls back
// to a generic "moved from X to Y" description built from the stage names.
function shDescribeStageTransition(fromStage, toStage, note) {
    const key = `${fromStage}-${toStage}`;

    // Both the "agreed" and "declined" consent outcomes land on the same
    // next stage now — Intervention is mandatory before Counseling either
    // way (see confirmConsentDecision()) — so this reads the note it
    // actually recorded instead of a fixed per-key sentence.
    if (key === '3-4') {
        return note ? `${note} — proceeding to Intervention first.` : 'Completed Parent Call-up/Consent and moved to Intervention.';
    }

    const specific = {
        '1-2': 'Completed the Interview/Background check-up and moved to Initial Risk Assessment.',
        '2-3': 'Completed the assessment test and moved to Parent Call-up/Consent.',
        '4-5': 'Completed intervention activities and moved to Counseling.',
        '5-6': 'Completed counseling sessions and moved to Student Follow-up.'
    };
    if (specific[key]) return specific[key];

    const fromName = SH_STAGE_NAMES[fromStage] || `Stage ${fromStage}`;
    const toName = SH_STAGE_NAMES[toStage] || `Stage ${toStage}`;

    if (toStage === 6 && fromStage !== 5) {
        return note ? `Case closed early (${note}) while at ${fromName}.` : `Case closed early while at ${fromName}.`;
    }
    return note ? `Moved from ${fromName} to ${toName} — ${note}.` : `Moved from ${fromName} to ${toName}.`;
}

// Cases created from a referral (see applyReferralPrefill() in
// counseling.js) carry a "(Linked to Referral <code>)" tag appended to
// case_summary purely so the referral side can find the case again — it's
// bookkeeping, not part of the clinical narrative, so every place that
// displays a case's summary strips it back out first.
function shStripReferralLinkTag(text) {
    return String(text || '').replace(/\s*\(Linked to Referral [^)]*\)\s*$/, '').trim();
}

/* A counseling case with linked follow-ups becomes one "case thread" — Day 1
   is everything that happened the day the case was opened, Day 2+ are later
   calendar days of follow-ups — instead of showing up as separate flat
   entries. This is the "one timeline of every session" view: every day of
   one case reads as a single continuous story. Same two-step approach as
   shBuildReferralThreadEntry(): build a flat, chronologically-sorted list of
   events first, then group whichever of them land on the same calendar day
   into one "Day N" block — a follow-up logged for the same day the case was
   opened (its date has no time-of-day, so compared directly against the
   case's precise created_at it would otherwise almost always look like it
   happened "earlier in the day", flipping Day 1/Day 2 and their
   Opened/Continued labels) merges into that same Day 1 instead. */
function shBuildCaseThreadEntry(c, followUpsRaw) {
    const resolved = SH_RESOLVED_CASE_STATUSES.includes(String(c.status || '').toLowerCase());
    const day1Note = [
        shStripReferralLinkTag(c.case_summary),
        c.case_objective ? `Objective: ${c.case_objective}` : '',
        c.first_action ? `First action: ${c.first_action}` : ''
    ].filter(Boolean).join(' ') || 'Counseling session recorded.';

    const events = [
        { rawDate: c.created_at || c.case_date, label: 'Initial session', note: day1Note },
        ...followUpsRaw.map(f => ({
            rawDate: f.follow_up_date || f.created_at,
            // Category is the counselor's own read on this student's
            // behavior for this follow-up (see renderFollowUpNoteTile() /
            // saveFollowUp() in counseling.js, now picked per-student
            // rather than one category for the whole batch) — surfaced
            // here so the history shows what was actually assessed, not
            // just a generic "Follow-up" label.
            label: f.categoryName ? `Follow-up: ${f.categoryName}` : 'Follow-up',
            note: f.note || 'Follow-up session recorded.'
        }))
    ].sort((a, b) => {
        const da = shParseDate(a.rawDate) || new Date(0);
        const db = shParseDate(b.rawDate) || new Date(0);
        return da - db;
    });

    const dayKeyOf = (rawDate) => {
        const d = shParseDate(rawDate);
        return d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : String(rawDate || '');
    };
    const days = [];
    events.forEach(ev => {
        const key = dayKeyOf(ev.rawDate);
        const current = days[days.length - 1];
        if (current && current.key === key) {
            current.events.push(ev);
        } else {
            days.push({ key, events: [ev] });
        }
    });

    if (resolved && days.length > 1) {
        const lastDayEvents = days[days.length - 1].events;
        lastDayEvents[lastDayEvents.length - 1].label = 'Closing';
    }

    const counselorName = esc(c.counselor_name || 'A counselor');
    const daysHtml = days.map((day, i) => {
        const dayNum = i + 1;
        const isLast = i === days.length - 1;
        const pill = isLast && resolved ? 'REVIEW' : (dayNum === 1 ? 'OPENED' : 'CONTINUED');
        const headerLabel = [...new Set(day.events.map(ev => ev.label))].join(' + ');
        const notesHtml = day.events.map(ev => `
            <div class="sh-case-note-row">
                <span class="sh-case-note-icon"><i class="fas fa-pen"></i></span>
                <div class="sh-case-note-body">
                    <div class="sh-case-note-head"><strong>${counselorName}</strong> added a note &middot; ${esc(shFormatDateTime(ev.rawDate))}</div>
                    <div class="sh-case-note-text">${esc(ev.note)}</div>
                </div>
            </div>`).join('');
        return `
        <div class="sh-case-day">
            <div class="sh-case-day-row">
                <span class="sh-case-day-badge">${dayNum}</span>
                <div class="sh-case-day-bar">
                    <span>Day ${dayNum} — ${esc(headerLabel)}</span>
                    <span class="sh-case-day-pill">${pill}</span>
                </div>
            </div>
            ${notesHtml}
        </div>`;
    }).join('');

    const lastDay = days[days.length - 1];
    const lastEvent = lastDay.events[lastDay.events.length - 1];
    const doneHtml = resolved ? `
        <div class="sh-case-done-row">
            <span class="sh-case-done-icon"><i class="fas fa-check"></i></span>
            <div class="sh-case-note-body">
                <div class="sh-case-note-head"><strong>${counselorName}</strong> marked the case as done &middot; ${esc(shFormatDateTime(c.updated_at || lastEvent.rawDate))}</div>
                <div class="sh-case-done-summary">${days.length} day${days.length === 1 ? '' : 's'} &middot; ${events.length} note${events.length === 1 ? '' : 's'}</div>
            </div>
        </div>` : '';

    // Collapsed-row summary — same shape as the referral thread's (see
    // shBuildReferralThreadEntry below): date of the last activity, plus
    // either an activity count or "Awaiting follow-up" for a case that's
    // just sitting at Day 1.
    const dateLabel = shFormatDate(resolved ? (c.updated_at || lastEvent.rawDate) : lastEvent.rawDate);
    const summaryLabel = events.length > 1
        ? `${days.length} day${days.length === 1 ? '' : 's'} &middot; ${events.length} note${events.length === 1 ? '' : 's'}`
        : 'Awaiting follow-up';

    // Collapses to just its summary header by default, like the referral
    // thread — reusing its .sh-referral-thread-* toggle classes/CSS/click
    // handler rather than duplicating a second collapse mechanism.
    const html = `
        <div class="sh-case-thread sh-referral-thread">
            <div class="sh-case-thread-header sh-referral-thread-toggle">
                <div class="sh-referral-row-icon"><i class="fas fa-comments"></i></div>
                <div class="sh-referral-row-main">
                    <div class="sh-referral-row-eyebrow">Counseling</div>
                    <div class="sh-referral-row-title">${c.case_uid ? `Case #${esc(c.case_uid)} &middot; ` : ''}${esc(c.case_title || c.section_name || 'Counseling Case')}</div>
                    <div class="sh-referral-row-sub">${esc(c.category_name || 'Counseling')} &middot; Handled by ${counselorName}</div>
                </div>
                <div class="sh-referral-row-meta">
                    <div class="sh-referral-row-dates">${esc(dateLabel)}</div>
                    <div class="sh-referral-row-summary">${summaryLabel}</div>
                </div>
                <span class="badge ${shStatusBadgeClass(c.status)} sh-case-thread-status">${esc(c.status)}</span>
                <i class="fas fa-chevron-down sh-referral-thread-chevron"></i>
            </div>
            <div class="sh-referral-thread-body">
                <div class="sh-case-thread-days">${daysHtml}</div>
                ${doneHtml}
            </div>
        </div>`;

    const dateObj = shParseDate(resolved ? (c.updated_at || lastEvent.rawDate) : lastEvent.rawDate) || new Date(0);
    return { dateObj, html };
}

/* A referral's full story — submission (with the parent/guardian and grade/
   section context staff need, folded into the Day 1 note) and every risk-
   assessment note logged against it (Stage 2's screenings) — as one
   Day 1/2/3... thread of what actually happened, same pattern as a
   counseling case's thread above. No synthetic "current stage" summary is
   appended — a static 6-stage indicator isn't itself an event, and the
   collapsed row's status pill already covers "where things stand"; new
   days only appear here once a coordinator/counselor logs a real
   follow-up or update. Collapses to just its summary header by default
   (.sh-referral-thread, toggled in shInit()'s click delegation) — every
   referral renders this way now, even one with no screenings yet (just a
   single "Day 1 — Submitted" entry), instead of the old flat field list. */
function shBuildReferralThreadEntry(r) {
    const day1Parts = [r.referral_reason || 'Referral submitted.'];
    if (r.intervention_attempts) day1Parts.push(`Initial actions taken: ${r.intervention_attempts}`);
    const events = [{
        rawDate: r.date_submitted,
        label: 'Submitted',
        by: r.teacher_name || 'A teacher',
        verb: 'submitted this referral',
        note: day1Parts.join(' '),
        pill: 'SUBMITTED'
    }];

    // referral_screening now serves two stages (see api/referral-screening.php)
    // — Stage 1's Interview/Background notes and Stage 2's Risk Assessment
    // notes are the same table shape, told apart by `stage`.
    (r.screenings || []).forEach(s => {
        const isBackground = Number(s.stage) === 1;
        const parts = [];
        if (s.risk_level) parts.push(`Risk level: ${s.risk_level}.`);
        if (s.interview_notes) parts.push(isBackground ? s.interview_notes : `Interview: ${s.interview_notes}`);
        if (s.observations) parts.push(`Observations: ${s.observations}`);
        events.push({
            rawDate: s.created_at,
            label: isBackground ? 'Interview/Background' : 'Risk Assessment',
            by: s.counselor_name || 'A counselor',
            verb: isBackground ? 'logged an interview / background check-up' : 'logged a risk assessment',
            note: parts.join(' ') || (isBackground ? 'Interview / background check-up recorded.' : 'Risk assessment recorded.'),
            pill: isBackground ? 'INTERVIEWED' : 'ASSESSED'
        });
    });

    // Every stage change this referral has gone through (see
    // api/update-referral.php's referral_stage_log) — narrated in plain
    // English via shDescribeStageTransition() instead of surfacing the raw
    // stage_note, so e.g. a Stage 3 disagreement reads as a sentence
    // explaining what happens next and why, not just "Waiting for
    // assessment proper".
    (r.stage_log || []).forEach(log => {
        events.push({
            rawDate: log.changed_at,
            label: `Moved to Stage ${log.to_stage}`,
            by: log.changed_by || 'A counselor',
            verb: 'updated the referral stage',
            note: shDescribeStageTransition(log.from_stage, log.to_stage, log.note),
            pill: 'UPDATED'
        });
    });

    events.sort((a, b) => (shParseDate(a.rawDate) || new Date(0)) - (shParseDate(b.rawDate) || new Date(0)));

    // Group events that landed on the same calendar day into one "Day N"
    // block instead of a new day per event — a referral submitted and
    // screened the same afternoon is still one day's story, so the day
    // counter only advances on a real date change, not once per note.
    const dayKeyOf = (rawDate) => {
        const d = shParseDate(rawDate);
        return d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : String(rawDate || '');
    };
    const days = [];
    events.forEach(ev => {
        const key = dayKeyOf(ev.rawDate);
        const current = days[days.length - 1];
        if (current && current.key === key) {
            current.events.push(ev);
        } else {
            days.push({ key, events: [ev] });
        }
    });

    const daysHtml = days.map((day, i) => {
        const dayNum = i + 1;
        const headerLabel = [...new Set(day.events.map(ev => ev.label))].join(' + ');
        const pill = day.events[day.events.length - 1].pill || 'ASSESSED';
        const notesHtml = day.events.map(ev => `
            <div class="sh-case-note-row">
                <span class="sh-case-note-icon"><i class="fas fa-pen"></i></span>
                <div class="sh-case-note-body">
                    <div class="sh-case-note-head"><strong>${esc(ev.by)}</strong> ${esc(ev.verb)} &middot; ${esc(shFormatDateTime(ev.rawDate))}</div>
                    <div class="sh-case-note-text">${esc(ev.note)}</div>
                </div>
            </div>`).join('');
        return `
        <div class="sh-case-day">
            <div class="sh-case-day-row">
                <span class="sh-case-day-badge">${dayNum}</span>
                <div class="sh-case-day-bar">
                    <span>Day ${dayNum} — ${esc(headerLabel)}</span>
                    <span class="sh-case-day-pill">${pill}</span>
                </div>
            </div>
            ${notesHtml}
        </div>`;
    }).join('');

    const lastEvent = events[events.length - 1];

    const gradeSection = [r.grade, r.section].filter(Boolean).join(' / ');
    const parentInfo = r.parent_guardian ? `${r.parent_guardian}${r.parent_contact ? ' (' + r.parent_contact + ')' : ''}` : '';
    const urgencyLabel = r.urgency ? String(r.urgency).charAt(0).toUpperCase() + String(r.urgency).slice(1) : '';
    const stageLabel = `Stage ${r.stage || 1}/6${r.stage_note ? ` — ${r.stage_note}` : ''}`;
    const subParts = [
        `Referral #${r.referral_code ? esc(r.referral_code) : '—'}`,
        `Referred by ${esc(r.teacher_name || 'a teacher')}`,
        gradeSection ? esc(gradeSection) : '',
        urgencyLabel ? `Urgency: ${esc(urgencyLabel)}` : '',
        esc(stageLabel),
        parentInfo ? `Parent: ${esc(parentInfo)}` : ''
    ].filter(Boolean).join(' &middot; ');

    // Collapsed-row summary: date of the last activity, plus either an
    // activity count (once a counselor has actually logged something) or
    // "Awaiting counselor" for a referral that's just sitting at Day 1.
    const dateLabel = shFormatDate(lastEvent.rawDate);
    const summaryLabel = events.length > 1
        ? `${days.length} day${days.length === 1 ? '' : 's'} &middot; ${events.length} note${events.length === 1 ? '' : 's'}`
        : 'Awaiting counselor';

    const html = `
        <div class="sh-case-thread sh-referral-thread">
            <div class="sh-case-thread-header sh-referral-thread-toggle">
                <div class="sh-referral-row-icon"><i class="fas fa-arrow-right"></i></div>
                <div class="sh-referral-row-main">
                    <div class="sh-referral-row-eyebrow">Referral</div>
                    <div class="sh-referral-row-title">${esc(r.referral_reason || 'Referral')}</div>
                    <div class="sh-referral-row-sub">${subParts}</div>
                </div>
                <div class="sh-referral-row-meta">
                    <div class="sh-referral-row-dates">${esc(dateLabel)}</div>
                    <div class="sh-referral-row-summary">${summaryLabel}</div>
                </div>
                <span class="badge ${shStatusBadgeClass(r.status)} sh-case-thread-status">${esc(r.status)}</span>
                <i class="fas fa-chevron-down sh-referral-thread-chevron"></i>
            </div>
            <div class="sh-referral-thread-body">
                <div class="sh-case-thread-days">${daysHtml}</div>
            </div>
        </div>`;

    const dateObj = shParseDate(lastEvent.rawDate) || new Date(0);
    return { dateObj, html };
}

function shRenderTimeline(grouped, hasActiveFilters) {
    const body = document.getElementById('shBody-timeline');
    const paginationEl = document.getElementById('shTimelinePagination');
    const totalCount = grouped.referrals.length + grouped.counseling.length + grouped.follow_ups.length + grouped.appointments.length;
    if (totalCount === 0) {
        body.innerHTML = shEmptyFolderHtml('records', hasActiveFilters);
        if (paginationEl) paginationEl.innerHTML = '';
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
        entries.push(shBuildReferralThreadEntry(r.raw));
    });

    grouped.appointments.forEach(a => {
        const entry = shBuildTimelineEntry(a);
        if (entry) entries.push(entry);
    });

    entries.sort((a, b) => b.dateObj - a.dateObj);

    const totalPages = Math.max(1, Math.ceil(entries.length / shTimelinePageSize));
    if (shTimelinePage > totalPages) shTimelinePage = totalPages;
    if (shTimelinePage < 1) shTimelinePage = 1;

    const startIdx = shTimelinePageSize === Infinity ? 0 : (shTimelinePage - 1) * shTimelinePageSize;
    const endIdx = shTimelinePageSize === Infinity ? entries.length : Math.min(startIdx + shTimelinePageSize, entries.length);
    const pageEntries = entries.slice(startIdx, endIdx);

    let html = '';
    let currentGroup = null;
    pageEntries.forEach(entry => {
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
    shAnimateTimelineEntries();

    if (paginationEl) {
        if (shTimelinePageSize === Infinity || totalPages <= 1) {
            paginationEl.innerHTML = '';
        } else {
            paginationEl.innerHTML = `
                <button type="button" class="btn btn-secondary btn-sm" data-page="prev" ${shTimelinePage <= 1 ? 'disabled' : ''}>
                    <i class="bi bi-chevron-left"></i> Prev
                </button>
                <span class="sh-slist-page-info">Showing ${startIdx + 1}&ndash;${endIdx} of ${entries.length} &middot; Page ${shTimelinePage} of ${totalPages}</span>
                <button type="button" class="btn btn-secondary btn-sm" data-page="next" ${shTimelinePage >= totalPages ? 'disabled' : ''}>
                    Next <i class="bi bi-chevron-right"></i>
                </button>`;
        }
    }
}

// Fades/slides each entry in as it scrolls into view within the timeline's
// own scrollable panel (see css/student-history.css's #shBody-timeline
// .sh-in rules). Re-run after every re-render since body.innerHTML wipes
// out any previously-observed nodes — cheap to redo, there's never more
// than a page's worth of entries in this panel.
function shAnimateTimelineEntries() {
    const body = document.getElementById('shBody-timeline');
    const items = body.querySelectorAll('.sh-timeline-item, .sh-case-thread');
    if (!('IntersectionObserver' in window)) {
        items.forEach(i => i.classList.add('sh-in'));
        return;
    }
    const io = new IntersectionObserver((observed) => {
        observed.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('sh-in');
                io.unobserve(e.target);
            }
        });
    }, { root: body, threshold: 0.12 });
    items.forEach(i => io.observe(i));
}

document.addEventListener('DOMContentLoaded', shInit);
