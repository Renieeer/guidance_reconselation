// Reports Dashboard — real data for the 4 checklist reports that belong
// on a per-school staff account: 7.1 Counseling Appointments, 7.2 Online
// Appointments, 7.3 Referral Distribution, 7.5 Child Summary Case.
// 7.4 (division-wide) is intentionally not here — that's SDO-only data,
// out of scope for a school-scoped account.
// Built entirely from this app's existing shared classes (css/style.css:
// .tabs/.tab-button, .dashboard-grid/.stat-card, .table-container,
// createBadge() from js/utils.js) — no separate design system.
// Same JS runs unmodified on the counselor, coordinator, and other-school
// portals — only the sidebar include in each .php differs; the API role
// param is derived at runtime from the logged-in account's own role.

const REPORTS = [
    { key: 'counseling', code: '7.1', name: 'Counseling Appointments', desc: 'Staff-scheduled, in-person' },
    { key: 'online', code: '7.2', name: 'Online Appointments', desc: 'Student self-booked' },
    { key: 'referrals', code: '7.3', name: 'Referral Distribution', desc: 'Breakdown by reason' },
    { key: 'child', code: '7.5', name: 'Child Summary Case', desc: 'Full per-student record' },
];

// Maps a logged-in account's own role to the `role=` value api/referral.php
// expects for its school-scoping branch — lets this one file work
// unmodified across all three portals.
const REFERRAL_API_ROLE = {
    counselor: 'counselor',
    coordinator: 'coordinator',
    'counselor-and-coordinator': 'other-school'
};

// Drawn from this app's own design tokens (css/style.css :root), not a
// separate palette — --secondary-color, --accent-emerald, --warning-color,
// --info, --danger-color, --role-coordinator, --role-teacher, --primary-color.
const CHART_COLORS = { navy: '#123a6b', green: '#1b7f5a', amber: '#a15c00', blue: '#1d5aa8', red: '#b3261e', purple: '#6a4fa3', teal: '#0e6e6e', darknavy: '#0b1f3a' };
const CHART_CAT = [CHART_COLORS.navy, CHART_COLORS.green, CHART_COLORS.amber, CHART_COLORS.blue, CHART_COLORS.red, CHART_COLORS.purple, CHART_COLORS.teal, CHART_COLORS.darknavy];
const STATUS_CHART_COLOR = { approved: CHART_COLORS.green, closed: CHART_COLORS.green, completed: CHART_COLORS.green, pending: CHART_COLORS.amber, rejected: CHART_COLORS.red, cancelled: CHART_COLORS.red };
// Maps this dashboard's real status values onto the 4 categories
// js/utils.js's createBadge() already knows how to color.
const BADGE_STATUS = { approved: 'completed', closed: 'completed', completed: 'completed', pending: 'pending', rejected: 'rejected', cancelled: 'rejected' };

let state = { report: 'counseling', student: null };
let charts = [];
let appointments = [];
let referrals = [];
let studentsList = [];
let studentDetailCache = {};

function esc(v) { const d = document.createElement('div'); d.textContent = v == null ? '' : String(v); return d.innerHTML; }
function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function countBy(rows, fn) { return rows.reduce((m, r) => { const k = fn(r) || 'Unspecified'; m[k] = (m[k] || 0) + 1; return m; }, {}); }
function meta(key) { return REPORTS.find(r => r.key === key); }
function gradeLabel(rawGrade) { const n = normalizeGradeNumber(rawGrade); return n ? `Grade ${n}` : (rawGrade || 'N/A'); }
function badge(status) { return createBadge(BADGE_STATUS[String(status || '').toLowerCase()] || 'pending'); }

function getUserSchool() {
    const user = getCurrentUser();
    return (user && (user.school_attended || user.school)) || '';
}

function getReferralApiRole() {
    const user = getCurrentUser();
    return REFERRAL_API_ROLE[user && user.role] || 'counselor';
}

// Generic tabular Excel export shared by the 7.1/7.2/7.3 reports' "Export
// Excel" button (sits alongside the existing "Export PDF" preview flow).
// 7.5's exportChildSummaryExcel() builds its own since it mixes a text
// summary block with a table.
function downloadExcel(filename, title, head, body) {
    if (typeof XLSX === 'undefined') { showAlert('Excel export library failed to load.', 'error'); return; }
    const worksheet = XLSX.utils.aoa_to_sheet([
        [title],
        [`Generated: ${new Date().toLocaleDateString()}`],
        [],
        head,
        ...body
    ]);
    worksheet['!cols'] = head.map(h => ({ wch: Math.max(12, String(h).length + 2) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, filename);
}

function mkChart(canvas, config) { const c = new Chart(canvas.getContext('2d'), config); charts.push(c); return c; }
const legendRight = { plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 12, font: { size: 12 } } } } };
const noLegend = { plugins: { legend: { display: false } } };

function panelHeader(key, subtitle, onExportPdf, onExportExcel) {
    const m = meta(key);
    const h = el(`<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; margin-bottom:22px;">
        <div>
            <h2 class="card-title" style="margin-bottom:6px;">${esc(m.name)} <span class="text-muted" style="font-weight:400; font-size:13px;">Report ${m.code}</span></h2>
            <p class="text-muted" style="margin:0; max-width:64ch;">${esc(subtitle)}</p>
        </div>
        <div style="display:flex; gap:10px;">
            <button type="button" class="btn btn-primary btn-sm" id="btnExportPdf"><i class="bi bi-file-earmark-pdf"></i> Export PDF</button>
            <button type="button" class="btn btn-success btn-sm" id="btnExportExcel"><i class="bi bi-file-earmark-excel"></i> Export Excel</button>
        </div>
    </div>`);
    $('#btnExportPdf', h).addEventListener('click', onExportPdf);
    $('#btnExportExcel', h).addEventListener('click', onExportExcel);
    return h;
}
const statCards = cards => `<div class="dashboard-grid" style="margin-bottom:24px;">${cards.map(c => `
    <div class="stat-card"><div class="stat-icon"><i class="bi ${c.icon}"></i></div><div><h3>${c.num}</h3><p>${esc(c.lbl)}</p></div></div>`).join('')}</div>`;
const chartTile = (id, title, tall) => `<div class="table-container" style="padding:20px;">
    <h4 class="text-primary" style="margin-top:0;">${esc(title)}</h4>
    <div style="position:relative; height:${tall ? 320 : 260}px;"><canvas id="${id}"></canvas></div></div>`;
// Same card/title framing as chartTile, but for when there's no data to
// plot yet — an empty Chart.js canvas draws nothing at all (no axes, no
// "no data" message), which just looks broken rather than "zero".
const chartTileEmpty = (title, text, tall) => `<div class="table-container" style="padding:20px;">
    <h4 class="text-primary" style="margin-top:0;">${esc(title)}</h4>
    <div style="height:${tall ? 320 : 260}px; display:flex; align-items:center; justify-content:center; text-align:center; color:var(--text-light);">${esc(text)}</div></div>`;
const emptyNote = text => `<p class="text-center text-muted" style="background:white; border:1px dashed var(--border-color); border-radius:8px; padding:40px 20px;">${esc(text)}</p>`;

/* ---- PDF preview: build with jsPDF + autoTable, show in-page before print/download ---- */
let pdfPreviewUrl = null;

function chartImage(id) {
    const canvas = document.getElementById(id);
    const chart = canvas && typeof Chart !== 'undefined' && Chart.getChart(canvas);
    return chart ? chart.toBase64Image('image/png', 1) : null;
}

function newPdf() {
    return new window.jspdf.jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
}

function pdfHeader(doc, title, subtitle) {
    const school = getUserSchool();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(18, 58, 107);
    doc.text(title, 40, 44);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100, 110, 130);
    doc.text(school || '', 40, 60);
    doc.text(subtitle || '', 40, 74);
    doc.text(`Generated ${new Date().toLocaleString()}`, 40, 88);
    doc.setDrawColor(220, 224, 232);
    doc.line(40, 98, doc.internal.pageSize.getWidth() - 40, 98);
    return 120;
}

function ensurePdfModal() {
    if (document.getElementById('pdfPreviewModal')) return;
    document.body.insertAdjacentHTML('beforeend', `<div id="pdfPreviewModal" class="modal">
        <div class="modal-content" style="max-width:980px; width:95%; height:88vh;">
            <div class="modal-header">
                <h2><i class="bi bi-file-earmark-pdf"></i> PDF Preview</h2>
                <button type="button" class="modal-close" id="pdfPreviewCloseX">&times;</button>
            </div>
            <div class="modal-body" style="padding:0; flex:1; display:flex;">
                <iframe id="pdfPreviewFrame" title="PDF preview" style="width:100%; height:100%; border:0;"></iframe>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="pdfPreviewCloseBtn">Close</button>
                <button type="button" class="btn btn-secondary" id="pdfPrintBtn"><i class="bi bi-printer"></i> Print</button>
                <button type="button" class="btn btn-primary" id="pdfDownloadBtn"><i class="bi bi-download"></i> Download</button>
            </div>
        </div>
    </div>`);
    $('#pdfPreviewCloseX').addEventListener('click', closePdfPreview);
    $('#pdfPreviewCloseBtn').addEventListener('click', closePdfPreview);
}

function closePdfPreview() {
    closeModal('pdfPreviewModal');
    $('#pdfPreviewFrame').src = 'about:blank';
    if (pdfPreviewUrl) { URL.revokeObjectURL(pdfPreviewUrl); pdfPreviewUrl = null; }
}

function showPdfPreview(doc, filename) {
    ensurePdfModal();
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    pdfPreviewUrl = doc.output('bloburl');
    $('#pdfPreviewFrame').src = pdfPreviewUrl;
    $('#pdfDownloadBtn').onclick = () => doc.save(filename);
    $('#pdfPrintBtn').onclick = () => {
        const frame = $('#pdfPreviewFrame');
        frame.contentWindow.focus();
        frame.contentWindow.print();
    };
    openModal('pdfPreviewModal');
}

/* ---- 7.1 / 7.2 appointments ---- */
function renderAppointments(key) {
    const isOnline = key === 'online';
    const rows = appointments.filter(a => a.booking_type === key);
    const frag = document.createDocumentFragment();
    const exportTitle = `${meta(key).name} — Report ${meta(key).code}`;
    const exportHeader = ['Date', 'Time', 'Student', 'Reason', 'Status'];
    const exportBody = () => rows.map(r => [r.preferred_date, r.preferred_time, r.student_name, r.reason, r.status]);
    frag.append(panelHeader(key,
        isOnline ? 'Appointments students booked themselves through the online scheduling system.' : 'Appointments scheduled directly by staff for a student (e.g. a walk-in, or "Appoint Students" on a case).',
        () => {
            const doc = newPdf();
            const st2 = countBy(rows, r => r.status);
            let y = pdfHeader(doc, `${meta(key).name} — Report ${meta(key).code}`,
                isOnline ? 'Student self-booked appointments' : 'Staff-scheduled appointments');

            doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(30, 40, 60);
            doc.text(`Total: ${rows.length}   Pending: ${st2['pending'] || 0}   Approved: ${st2['approved'] || 0}   Rejected: ${st2['rejected'] || 0}`, 40, y);
            y += 20;

            if (rows.length > 0) {
                const pageW = doc.internal.pageSize.getWidth();
                const half = (pageW - 80 - 16) / 2;
                const imgStatus = chartImage('chStatus');
                const imgReason = chartImage('chReason');
                if (imgStatus) doc.addImage(imgStatus, 'PNG', 40, y, half, 150);
                if (imgReason) doc.addImage(imgReason, 'PNG', 40 + half + 16, y, half, 150);
                y += 166;
                const imgTrend = chartImage('chTrend');
                if (imgTrend) { doc.addImage(imgTrend, 'PNG', 40, y, pageW - 80, 140); y += 156; }

                doc.autoTable({
                    startY: y,
                    head: [['Date', 'Time', 'Student', 'Reason', 'Status']],
                    body: rows.map(r => [r.preferred_date, r.preferred_time, r.student_name, r.reason, r.status]),
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [18, 58, 107] },
                    margin: { left: 40, right: 40 },
                });
            } else {
                doc.setTextColor(120, 130, 150);
                doc.text(`No ${isOnline ? 'online' : 'counseling'} appointments recorded for your school yet.`, 40, y + 16);
            }

            showPdfPreview(doc, `gms_${key}_appointments.pdf`);
        },
        () => downloadExcel(`gms_${key}_appointments.xlsx`, exportTitle, exportHeader, exportBody())));

    const st = countBy(rows, r => r.status);
    frag.append(el(statCards([
        { num: rows.length, lbl: 'Total', icon: 'bi-calendar3' },
        { num: st['pending'] || 0, lbl: 'Pending', icon: 'bi-hourglass-split' },
        { num: st['approved'] || 0, lbl: 'Approved', icon: 'bi-check-circle' },
        { num: st['rejected'] || 0, lbl: 'Rejected', icon: 'bi-x-circle' },
    ])));

    frag.append(el(`<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">
        ${chartTile('chStatus', 'Status Breakdown')}${chartTile('chReason', 'By Reason')}</div>`));
    frag.append(el(`<div style="margin-bottom:28px;">${chartTile('chTrend', 'Daily Trend')}</div>`));

    if (rows.length === 0) {
        frag.append(el(emptyNote(`No ${isOnline ? 'online' : 'counseling'} appointments recorded for your school yet.`)));
    } else {
        const tr = rows.map(r => `<tr><td>${esc(r.preferred_date)}</td><td>${esc(r.preferred_time)}</td><td>${esc(r.student_name)}</td><td>${esc(r.reason)}</td><td>${badge(r.status)}</td></tr>`).join('');
        frag.append(el(`<div class="mb-4"><h3 class="text-primary">Appointment Log</h3><div class="table-container"><table><thead><tr><th>Date</th><th>Time</th><th>Student</th><th>Reason</th><th>Status</th></tr></thead><tbody>${tr}</tbody></table></div></div>`));
    }

    queueMicrotask(() => {
        const sl = Object.keys(st);
        mkChart($('#chStatus'), { type: 'doughnut', data: { labels: sl, datasets: [{ data: sl.map(k => st[k]), backgroundColor: sl.map(k => STATUS_CHART_COLOR[k] || CHART_COLORS.navy), borderColor: '#fff', borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '58%', ...legendRight } });

        const rb = countBy(rows, r => r.reason); const rl = Object.keys(rb);
        mkChart($('#chReason'), { type: 'bar', data: { labels: rl, datasets: [{ data: rl.map(k => rb[k]), backgroundColor: CHART_COLORS.navy, borderRadius: 5, maxBarThickness: 46 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, ...noLegend, scales: { x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#eaeef3' } }, y: { grid: { display: false } } } } });

        const db = countBy(rows, r => r.preferred_date); const dl = Object.keys(db).sort();
        mkChart($('#chTrend'), { type: 'line', data: { labels: dl.map(d => d.slice(5)), datasets: [{ data: dl.map(k => db[k]), borderColor: CHART_COLORS.navy, backgroundColor: 'rgba(18,58,107,.10)', fill: true, tension: .35, pointBackgroundColor: CHART_COLORS.navy, pointRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, ...noLegend, scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#eaeef3' } }, x: { grid: { display: false } } } } });
    });

    return frag;
}

/* ---- 7.3 referral distribution ---- */
function renderReferrals() {
    const frag = document.createDocumentFragment();
    const agg = countBy(referrals, r => r.referral_reason);
    const reasons = Object.entries(agg).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
    const total = referrals.length;

    const referralsExportTitle = 'Referral Distribution — Report 7.3';
    const referralsExportHeader = ['Reason', 'Count', '% of total'];
    const referralsExportBody = () => {
        const body = reasons.map(r => [r.reason, r.count, total ? ((r.count / total) * 100).toFixed(1) + '%' : '0%']);
        body.push(['TOTAL', total, '100%']);
        return body;
    };
    frag.append(panelHeader('referrals',
        'Every referral reason on record for your school — the full breakdown, not just the top few.',
        () => {
            const doc = newPdf();
            let y = pdfHeader(doc, 'Referral Distribution — Report 7.3', 'Every referral reason on record for your school');

            doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(30, 40, 60);
            doc.text(`Total referrals: ${total}   Distinct reasons: ${reasons.length}`, 40, y);
            y += 20;

            if (total > 0) {
                const pageW = doc.internal.pageSize.getWidth();
                const imgReasons = chartImage('chReasons');
                if (imgReasons) { doc.addImage(imgReasons, 'PNG', 40, y, pageW - 80, 170); y += 186; }
                const imgUrgency = chartImage('chUrgency');
                if (imgUrgency) { doc.addImage(imgUrgency, 'PNG', 40, y, (pageW - 80) / 2, 140); y += 156; }

                doc.autoTable({
                    startY: y,
                    head: [['Reason', 'Count', '% of total']],
                    body: reasons.map(r => [r.reason, r.count, ((r.count / total) * 100).toFixed(1) + '%']),
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [18, 58, 107] },
                    margin: { left: 40, right: 40 },
                });
            } else {
                doc.setTextColor(120, 130, 150);
                doc.text('No referrals recorded for your school yet.', 40, y + 16);
            }

            showPdfPreview(doc, 'gms_referral_distribution.pdf');
        },
        () => downloadExcel('gms_referral_distribution.xlsx', referralsExportTitle, referralsExportHeader, referralsExportBody())));

    frag.append(el(statCards([
        { num: total, lbl: 'Total referrals', icon: 'bi-clipboard-data' },
        { num: reasons.length, lbl: 'Distinct reasons', icon: 'bi-tags' },
        { num: reasons[0] ? reasons[0].count : 0, lbl: 'Top reason count', icon: 'bi-graph-up-arrow' },
        { num: new Set(referrals.map(r => r.student_name)).size, lbl: 'Students referred', icon: 'bi-people' },
    ])));

    frag.append(el(`<div style="margin-bottom:20px;">${chartTile('chReasons', 'Referrals by Reason (All)', true)}</div>`));
    frag.append(el(`<div style="max-width:480px; margin-bottom:28px;">${chartTile('chUrgency', 'By Urgency')}</div>`));

    if (total === 0) {
        frag.append(el(emptyNote('No referrals recorded for your school yet.')));
    } else {
        const tr = reasons.map(r => `<tr><td>${esc(r.reason)}</td><td style="text-align:right;">${r.count}</td><td style="text-align:right;">${((r.count / total) * 100).toFixed(1)}%</td></tr>`).join('');
        frag.append(el(`<div><h3 class="text-primary">Reason Breakdown</h3><div class="table-container"><table><thead><tr><th>Reason</th><th style="text-align:right;">Count</th><th style="text-align:right;">% of total</th></tr></thead><tbody>${tr}</tbody></table></div></div>`));
    }

    queueMicrotask(() => {
        mkChart($('#chReasons'), { type: 'bar', data: { labels: reasons.map(r => r.reason), datasets: [{ data: reasons.map(r => r.count), backgroundColor: reasons.map((_, i) => CHART_CAT[i % CHART_CAT.length]), borderRadius: 5 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, ...noLegend, scales: { x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#eaeef3' } }, y: { grid: { display: false } } } } });
        const ub = countBy(referrals, r => r.urgency || 'normal'); const ul = Object.keys(ub);
        mkChart($('#chUrgency'), { type: 'doughnut', data: { labels: ul, datasets: [{ data: ul.map(k => ub[k]), backgroundColor: ul.map((_, i) => CHART_CAT[i % CHART_CAT.length]), borderColor: '#fff', borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '55%', ...legendRight } });
    });

    return frag;
}

/* ---- 7.5 child summary case ---- */
function renderChild() {
    const frag = document.createDocumentFragment();
    frag.append(panelHeader('child', 'The complete guidance record for one student — profile, case history, and follow-ups.', exportChildPdf, exportChildSummaryExcel));

    if (studentsList.length === 0) {
        frag.append(el(emptyNote('No students on file for your school yet.')));
        return frag;
    }

    const picker = el(`<div class="form-group" style="max-width:420px;">
        <label for="rdStudentPick">Select a student</label>
        <select id="rdStudentPick" style="padding:8px; border:1px solid var(--border-color); border-radius:4px; width:100%;"><option value="">Select a student…</option></select>
    </div>`);
    const sel = $('select', picker);
    studentsList.forEach(s => {
        const name = `${s.first_name || ''} ${s.last_name || ''}`.trim();
        const o = document.createElement('option');
        o.value = s.id;
        o.textContent = `${name} — ${s.grade_name || 'N/A'}`;
        if (String(s.id) === String(state.student)) o.selected = true;
        sel.append(o);
    });
    sel.addEventListener('change', e => { state.student = e.target.value || null; render(); });
    frag.append(picker);

    if (!state.student) {
        frag.append(el(emptyNote('Select a student above to view their full record.')));
        return frag;
    }

    const cached = studentDetailCache[state.student];
    if (!cached) {
        frag.append(el(emptyNote('Loading student record…')));
        loadStudentDetail(state.student).then(() => render());
        return frag;
    }

    const s = cached.student;
    const cases = cached.data.counseling || [];
    const studentReferrals = cached.data.referrals || [];
    const followUps = cached.data.follow_ups || [];

    frag.append(el(`<div class="form-row mb-4" style="margin-top:16px;">
        <div>
            <p><strong>Learner:</strong> ${esc(s.name)}</p>
            <p><strong>LRN:</strong> ${esc(s.lrn || 'N/A')}</p>
            <p><strong>Grade &amp; Section:</strong> ${esc(gradeLabel(s.grade))} · ${esc(s.section || 'N/A')}</p>
        </div>
        <div>
            <p><strong>Sessions:</strong> ${cases.length}</p>
            <p><strong>Referrals:</strong> ${studentReferrals.length}</p>
            <p><strong>Follow-ups:</strong> ${followUps.length}</p>
        </div>
    </div>`));

    const hasCases = cases.length > 0;
    frag.append(el(`<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">${hasCases
        ? `${chartTile('chCaseStatus', 'Case Status')}${chartTile('chCaseCategory', 'Cases by Category')}`
        : `${chartTileEmpty('Case Status', 'No counseling case data yet.')}${chartTileEmpty('Cases by Category', 'No counseling case data yet.')}`
    }</div>`));

    const followUpsByCase = {};
    followUps.forEach(f => { (followUpsByCase[f.case_uid] = followUpsByCase[f.case_uid] || []).push(f); });

    const caseRows = cases.map(c => {
        const cidStyle = 'font-family:monospace; color:var(--secondary-color); font-weight:600;';
        const fus = (followUpsByCase[c.case_uid] || []).map(f => `<tr><td></td><td><span style="${cidStyle}">${esc(f.follow_up_id)}</span></td><td>${esc(f.follow_up_date || 'N/A')}</td><td colspan="2">${esc(f.note || '')}</td></tr>`).join('');
        return `<tr><td><span style="${cidStyle}">${esc(c.case_uid)}</span></td><td>${esc(c.case_date || 'N/A')}</td><td>${esc(c.category_name || c.case_title || 'N/A')}</td><td>${esc(c.counselor_name || 'N/A')}</td><td>${badge(c.status)}</td></tr>${fus}`;
    }).join('');

    frag.append(el(`<div class="mb-4"><h3 class="text-primary">Case History &amp; Follow-ups</h3><div class="table-container"><table><thead><tr><th>Case / Follow-up ID</th><th>Opened / Date</th><th>Category / Note</th><th>Counselor</th><th>Status</th></tr></thead><tbody>${caseRows || '<tr><td colspan="5" class="text-center text-muted" style="padding:30px;">No counseling cases on record.</td></tr>'}</tbody></table></div></div>`));

    if (studentReferrals.length > 0) {
        const refRows = studentReferrals.map(r => `<tr><td>${esc(r.referral_code || r.id)}</td><td>${esc(r.date_submitted)}</td><td>${esc(r.referral_reason)}</td><td>${badge(r.status)}</td></tr>`).join('');
        frag.append(el(`<div><h3 class="text-primary">Referral History</h3><div class="table-container"><table><thead><tr><th>Referral ID</th><th>Submitted</th><th>Reason</th><th>Status</th></tr></thead><tbody>${refRows}</tbody></table></div></div>`));
    }

    if (hasCases) {
        queueMicrotask(() => {
            const cs = countBy(cases, c => c.status); const csl = Object.keys(cs);
            mkChart($('#chCaseStatus'), { type: 'doughnut', data: { labels: csl, datasets: [{ data: csl.map(k => cs[k]), backgroundColor: csl.map(k => STATUS_CHART_COLOR[k] || CHART_COLORS.navy), borderColor: '#fff', borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '58%', ...legendRight } });
            const cb = countBy(cases, c => c.category_name || c.case_title || 'Uncategorized'); const cbl = Object.keys(cb);
            mkChart($('#chCaseCategory'), { type: 'bar', data: { labels: cbl, datasets: [{ data: cbl.map(k => cb[k]), backgroundColor: cbl.map((_, i) => CHART_CAT[i % CHART_CAT.length]), borderRadius: 5, maxBarThickness: 46 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, ...noLegend, scales: { x: { beginAtZero: true, ticks: { precision: 0, stepSize: 1 }, grid: { color: '#eaeef3' } }, y: { grid: { display: false } } } } });
        });
    }

    return frag;
}

async function loadStudentDetail(studentId) {
    try {
        const gradeScope = typeof getCurrentGradeScope === 'function' ? getCurrentGradeScope() : '';
        const res = await fetch(`../../api/student-history.php?student_id=${encodeURIComponent(studentId)}&grade_scope=${encodeURIComponent(gradeScope)}`).then(r => r.json());
        if (res.success) {
            studentDetailCache[studentId] = res;
        } else {
            showAlert(res.message || 'Could not load student record', 'error');
        }
    } catch (e) {
        showAlert('Could not load student record: ' + e.message, 'error');
    }
}

function exportChildPdf() {
    const cached = state.student ? studentDetailCache[state.student] : null;
    if (!cached) { showAlert('Select a student first.', 'error'); return; }
    const s = cached.student;
    const cases = cached.data.counseling || [];
    const studentReferrals = cached.data.referrals || [];

    const doc = newPdf();
    let y = pdfHeader(doc, 'Child Summary Case — Report 7.5', s.name);

    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(30, 40, 60);
    doc.text(`LRN: ${s.lrn || 'N/A'}`, 40, y); y += 16;
    doc.text(`Grade & Section: ${gradeLabel(s.grade)} · ${s.section || 'N/A'}`, 40, y); y += 16;
    doc.text(`Sessions: ${cases.length}   Referrals: ${studentReferrals.length}`, 40, y); y += 20;

    if (cases.length > 0) {
        const pageW = doc.internal.pageSize.getWidth();
        const half = (pageW - 80 - 16) / 2;
        const imgStatus = chartImage('chCaseStatus');
        const imgCategory = chartImage('chCaseCategory');
        if (imgStatus) doc.addImage(imgStatus, 'PNG', 40, y, half, 150);
        if (imgCategory) doc.addImage(imgCategory, 'PNG', 40 + half + 16, y, half, 150);
        y += 166;
    }

    doc.autoTable({
        startY: y,
        head: [['Case ID', 'Date', 'Category', 'Counselor', 'Status']],
        body: cases.length
            ? cases.map(c => [c.case_uid, c.case_date || 'N/A', c.category_name || c.case_title || 'N/A', c.counselor_name || 'N/A', c.status])
            : [['No counseling cases on record.', '', '', '', '']],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [18, 58, 107] },
        margin: { left: 40, right: 40 },
    });

    if (studentReferrals.length > 0) {
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Referral ID', 'Submitted', 'Reason', 'Status']],
            body: studentReferrals.map(r => [r.referral_code || r.id, r.date_submitted, r.referral_reason, r.status]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [18, 58, 107] },
            margin: { left: 40, right: 40 },
        });
    }

    showPdfPreview(doc, `gms_child_summary_${s.student_id}.pdf`);
}

function exportChildSummaryExcel() {
    const cached = state.student ? studentDetailCache[state.student] : null;
    if (!cached) { showAlert('Select a student first.', 'error'); return; }
    if (typeof XLSX === 'undefined') { showAlert('Excel export library failed to load.', 'error'); return; }

    const s = cached.student;
    const cases = cached.data.counseling || [];
    const referralCount = (cached.data.referrals || []).length;

    const worksheet = XLSX.utils.aoa_to_sheet([
        [`Child Summary Case — ${s.name}`],
        ['LRN', s.lrn || 'N/A'],
        ['Grade & Section', `${gradeLabel(s.grade)} · ${s.section || 'N/A'}`],
        ['Sessions', cases.length],
        ['Referrals', referralCount],
        [],
        ['Case ID', 'Date', 'Category', 'Counselor', 'Status'],
        ...cases.map(c => [c.case_uid, c.case_date, c.category_name || c.case_title || '', c.counselor_name || '', c.status])
    ]);
    worksheet['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 26 }, { wch: 18 }, { wch: 12 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Child Summary');
    XLSX.writeFile(workbook, `gms_child_summary_${s.student_id}.xlsx`);
}

/* ---- dispatcher + render ---- */
function renderReport() {
    switch (state.report) {
        case 'counseling': return renderAppointments('counseling');
        case 'online': return renderAppointments('online');
        case 'referrals': return renderReferrals();
        case 'child': return renderChild();
    }
}

function render() {
    charts.forEach(c => c.destroy()); charts = [];
    const tabs = $('#reportTabs');
    tabs.innerHTML = '';
    REPORTS.forEach(r => {
        const btn = el(`<button type="button" class="tab-button ${r.key === state.report ? 'active' : ''}" title="${esc(r.desc)}">${esc(r.code)} · ${esc(r.name)}</button>`);
        btn.addEventListener('click', () => { state.report = r.key; render(); });
        tabs.append(btn);
    });
    const panel = $('#reportPanel');
    panel.innerHTML = '';
    panel.append(renderReport());
}

async function init() {
    initPage();
    const school = getUserSchool();
    if (!school) {
        $('#reportPanel').innerHTML = emptyNote('No school on file for this account — cannot load reports.');
        return;
    }

    try {
        const [apptRes, refRes, studentsRes] = await Promise.all([
            fetch(`../../api/appointment-request.php?school=${encodeURIComponent(school)}`).then(r => r.json()),
            fetch(`../../api/referral.php?role=${encodeURIComponent(getReferralApiRole())}&school=${encodeURIComponent(school)}`).then(r => r.json()),
            fetch(`../../api/get-students.php?school=${encodeURIComponent(school)}`).then(r => r.json()),
        ]);
        appointments = apptRes.success ? (apptRes.data || []) : [];
        referrals = refRes.success ? (refRes.data || []) : [];
        studentsList = studentsRes.success ? (studentsRes.data || []) : [];
    } catch (e) {
        showAlert('Could not load report data: ' + e.message, 'error');
    }

    render();
}

document.addEventListener('DOMContentLoaded', init);
