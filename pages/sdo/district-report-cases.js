// District Report Cases — real case-category x grade counts per district,
// sourced from api/case-report.php (same real data source as the
// coordinator's Report Cases page). Districts are whatever the SDO has
// assigned to each school in School Management (Edit mode) — until that's done, every school
// falls into a single real "Unassigned" bucket instead of fake per-district
// numbers.

const ALL_REPORT_GRADES = [7, 8, 9, 10, 11, 12];

// Sentinel for the "All Districts" selection — every active school, with no
// need to pick a district or school individually. Kept distinct from any
// real district name (sent to the API as district=all).
const ALL_DISTRICTS = '__ALL_DISTRICTS__';
function districtLabel(district) {
    return district === ALL_DISTRICTS ? 'All Districts' : district;
}
function districtParam(district) {
    return district === ALL_DISTRICTS ? 'all' : district;
}

let districtList = ['Unassigned'];
let currentDistrict = ALL_DISTRICTS;
let sections = [];
let counts = {};
let displayRows = [];
let schoolBreakdown = [];
let currentPeriod = 'all';
let customStart = '';
let customEnd = '';

// Bumped on every district/period/range change so a slower, now-stale
// fetch (e.g. clicking two districts in quick succession) can detect it's
// no longer current and skip overwriting sections/counts/schoolBreakdown
// with the wrong district's data after a newer selection already rendered.
let reportRequestId = 0;

const PERIOD_LABELS = { all: 'All Time', weekly: 'Weekly', monthly: 'Monthly', annually: 'Annually', custom: 'Custom Range' };

async function loadDistrictList() {
    try {
        const response = await fetch('../../api/case-report.php?action=districts');
        const data = await response.json();
        const real = (data.success && Array.isArray(data.districts)) ? data.districts : [];
        districtList = data.success && data.hasUnassigned ? [...real, 'Unassigned'] : real;
    } catch (error) {
        console.error('Error loading district list:', error);
        districtList = [];
    }
    // Default to "All Districts" — every school is visible without having
    // to pick a district first.
    currentDistrict = ALL_DISTRICTS;
}

function renderDistrictButtons() {
    const container = document.getElementById('districtButtons');
    if (!container) return;

    if (districtList.length === 0) {
        container.innerHTML = `
            <p class="text-muted" style="margin: 0;">
                No active schools found.
            </p>
        `;
        return;
    }

    const buttons = [ALL_DISTRICTS, ...districtList];

    container.innerHTML = buttons.map((district, i) => `
        <button class="district-btn ${district === currentDistrict ? 'active' : ''}" style="--i:${i}" data-district="${escapeHtml(district)}">${escapeHtml(districtLabel(district))}</button>
    `).join('');

    container.querySelectorAll('.district-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            container.querySelectorAll('.district-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentDistrict = this.getAttribute('data-district');
            await refreshReports();
        });
    });
}

// Re-fetches both reports for whatever district/period/range is currently
// selected and re-renders them. Bumps reportRequestId first so that if the
// user changes the selection again before this fetch finishes, this older
// request's response gets dropped instead of overwriting the newer one's
// (and thus correct) data — see loadReportData()/loadSchoolBreakdown().
async function refreshReports() {
    reportRequestId++;
    await Promise.all([loadReportData(), loadSchoolBreakdown()]);
    renderCasesTable();
    renderSchoolBreakdown();
}

async function loadReportData() {
    const requestId = reportRequestId;
    try {
        const params = new URLSearchParams({ action: 'categories', district: districtParam(currentDistrict), period: currentPeriod });
        if (currentPeriod === 'custom' && customStart && customEnd) {
            params.set('start', customStart);
            params.set('end', customEnd);
        }
        const url = `../../api/case-report.php?${params.toString()}`;
        const response = await fetch(url);
        const data = await response.json();
        if (requestId !== reportRequestId) return; // superseded by a newer selection

        if (!data.success) {
            throw new Error(data.message || 'Failed to load district case report');
        }

        sections = data.sections || [];
        counts = data.counts || {};
    } catch (error) {
        if (requestId !== reportRequestId) return;
        console.error('Error loading district case report:', error);
        sections = [];
        counts = {};
    }
}

// One row per school (name, total cases, Male/Female split) — only
// fetched for "All Districts"; a single district's category/grade table
// below already covers that one district on its own.
async function loadSchoolBreakdown() {
    if (currentDistrict !== ALL_DISTRICTS) {
        schoolBreakdown = [];
        return;
    }
    const requestId = reportRequestId;
    try {
        const params = new URLSearchParams({ action: 'school_breakdown', district: districtParam(currentDistrict), period: currentPeriod });
        if (currentPeriod === 'custom' && customStart && customEnd) {
            params.set('start', customStart);
            params.set('end', customEnd);
        }
        const url = `../../api/case-report.php?${params.toString()}`;
        const response = await fetch(url);
        const data = await response.json();
        if (requestId !== reportRequestId) return; // superseded by a newer selection

        if (!data.success) {
            throw new Error(data.message || 'Failed to load per-school case report');
        }

        schoolBreakdown = data.schools || [];
    } catch (error) {
        if (requestId !== reportRequestId) return;
        console.error('Error loading per-school case report:', error);
        schoolBreakdown = [];
    }
}

// Param-driven counterparts of loadReportData/loadSchoolBreakdown above —
// fetch and return data without touching the on-screen globals (sections/
// counts/schoolBreakdown) or re-rendering anything. Used by the export
// panel so generating a report for an arbitrary month/year never changes
// what's currently shown on the page behind the modal.
async function fetchCategoryReport(district, period, start, end) {
    try {
        const params = new URLSearchParams({ action: 'categories', district: districtParam(district), period });
        if (period === 'custom' && start && end) {
            params.set('start', start);
            params.set('end', end);
        }
        const response = await fetch(`../../api/case-report.php?${params.toString()}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to load district case report');
        return { sections: data.sections || [], counts: data.counts || {} };
    } catch (error) {
        console.error('Error loading district case report:', error);
        return { sections: [], counts: {} };
    }
}

async function fetchSchoolBreakdownData(district, period, start, end) {
    try {
        const params = new URLSearchParams({ action: 'school_breakdown', district: districtParam(district), period });
        if (period === 'custom' && start && end) {
            params.set('start', start);
            params.set('end', end);
        }
        const response = await fetch(`../../api/case-report.php?${params.toString()}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to load per-school case report');
        return data.schools || [];
    } catch (error) {
        console.error('Error loading per-school case report:', error);
        return [];
    }
}

// Backs the Division Monthly Monitoring Report export — always every
// district at once (plus a '__ALL__' division-wide total), never scoped to
// whatever district button is currently selected on screen.
async function fetchPersonalSocialConcerns(period, start, end) {
    try {
        const params = new URLSearchParams({ action: 'personal_social_concerns', period });
        if (period === 'custom' && start && end) {
            params.set('start', start);
            params.set('end', end);
        }
        const response = await fetch(`../../api/case-report.php?${params.toString()}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to load personal-social concerns report');
        return { districts: data.districts || [], counts: data.counts || {} };
    } catch (error) {
        console.error('Error loading personal-social concerns report:', error);
        return { districts: [], counts: {} };
    }
}

function renderSchoolBreakdown() {
    const section = document.getElementById('schoolBreakdownSection');
    if (section) section.hidden = currentDistrict !== ALL_DISTRICTS;

    const tbody = document.getElementById('schoolBreakdownBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (currentDistrict !== ALL_DISTRICTS) return;

    if (schoolBreakdown.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding: 24px;">No schools found.</td></tr>`;
        return;
    }

    const totals = schoolBreakdown.reduce((acc, s) => {
        acc.total += s.total; acc.male += s.male; acc.female += s.female;
        return acc;
    }, { total: 0, male: 0, female: 0 });

    tbody.innerHTML = schoolBreakdown.map((s, i) => `
        <tr style="--i:${i}">
            <td><strong>${escapeHtml(s.school)}</strong></td>
            <td class="text-center">${s.total > 0 ? `<span class="badge badge-in-progress">${s.total}</span>` : '0'}</td>
            <td class="text-center">${s.male}</td>
            <td class="text-center">${s.female}</td>
        </tr>
    `).join('') + `
        <tr style="font-weight: 700; background: #f1f5f9;">
            <td>Overall Total</td>
            <td class="text-center"><strong style="color: #3b82f6; font-size: 16px;">${totals.total}</strong></td>
            <td class="text-center">${totals.male}</td>
            <td class="text-center">${totals.female}</td>
        </tr>
    `;
}

// countsMap defaults to the on-screen global so every existing call site
// (renderCasesTable etc.) is unaffected; the export panel passes its own
// freshly-fetched counts instead, for whatever period it was asked for,
// without touching what's currently rendered on screen.
function gradeCell(bucketKey, grade, countsMap = counts) {
    const bucket = countsMap[bucketKey];
    return (bucket && bucket[String(grade)]) || { m: 0, f: 0 };
}

// Same flattening as pages/coordinator/report-case.js, minus the M/F split
// (this table only shows one total per grade) — see that file for the
// full explanation of the section/category/uncategorized/subtotal shape.
function buildDisplayRows(sectionsList = sections, countsMap = counts) {
    const rows = [];
    const grandTotal = {};
    ALL_REPORT_GRADES.forEach(g => { grandTotal[g] = 0; });

    sectionsList.forEach(section => {
        rows.push({ type: 'header', label: `${section.sectionCode}. ${section.sectionName}` });

        const sectionTotal = {};
        ALL_REPORT_GRADES.forEach(g => { sectionTotal[g] = 0; });

        const addToTotals = (bucketKey) => {
            ALL_REPORT_GRADES.forEach(g => {
                const cell = gradeCell(bucketKey, g, countsMap);
                const n = cell.m + cell.f;
                sectionTotal[g] += n;
                grandTotal[g] += n;
            });
        };

        section.categories.forEach(cat => {
            rows.push({ type: 'category', label: cat.categoryName, bucketKey: cat.categoryId });
            addToTotals(cat.categoryId);
        });

        const uncategorizedKey = `section-${section.sectionId}-uncategorized`;
        rows.push({ type: 'category', label: 'Uncategorized', bucketKey: uncategorizedKey });
        addToTotals(uncategorizedKey);

        rows.push({ type: 'subtotal', label: `Total ${section.sectionCode}: ${section.sectionName}`, totals: sectionTotal });
    });

    rows.push({ type: 'subtotal', label: 'Overall Total', totals: grandTotal });
    return rows;
}

function rowTotals(row, countsMap = counts) {
    if (row.type === 'subtotal') {
        return row.totals;
    }
    const totals = {};
    ALL_REPORT_GRADES.forEach(g => {
        const cell = gradeCell(row.bucketKey, g, countsMap);
        totals[g] = cell.m + cell.f;
    });
    return totals;
}

// Render cases table for the selected district
function renderCasesTable() {
    const tableBody = document.getElementById('casesTableBody');
    tableBody.innerHTML = '';

    displayRows = buildDisplayRows();

    displayRows.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.style.setProperty('--i', index);

        if (row.type === 'header') {
            tr.innerHTML = `<td colspan="8" style="font-weight: 700; background: #e2e8f0;">${row.label}</td>`;
            tableBody.appendChild(tr);
            return;
        }

        if (row.type === 'subtotal') {
            tr.style.fontWeight = '700';
            tr.style.backgroundColor = '#f1f5f9';
        }

        const totals = rowTotals(row);
        const grandTotal = ALL_REPORT_GRADES.reduce((sum, g) => sum + (totals[g] || 0), 0);

        tr.innerHTML = `
            <td><strong>${row.label}</strong></td>
            ${ALL_REPORT_GRADES.map(g => {
                const n = totals[g] || 0;
                return `<td class="text-center">${n > 0 ? `<span class="badge badge-in-progress">${n}</span>` : '0'}</td>`;
            }).join('')}
            <td class="text-center"><strong style="color: #3b82f6; font-size: 16px;">${grandTotal}</strong></td>
        `;

        if (row.type === 'category') {
            tr.classList.add('row-clickable');
            tr.addEventListener('click', () => showCaseDetails(index));
        }

        tableBody.appendChild(tr);
    });
}

// Show case details modal
function showCaseDetails(rowIndex) {
    const row = displayRows[rowIndex];
    if (!row) return;

    const totals = rowTotals(row);

    document.getElementById('caseId').value = `DIST-${districtLabel(currentDistrict).toUpperCase().replace(/\s+/g, '-')}-${row.bucketKey || 'ROW'}`;
    document.getElementById('caseCategory').value = row.label;
    document.getElementById('caseGrade').value = 'All Grades (7-12)';
    document.getElementById('caseStatus').value = 'Active';
    document.getElementById('caseDate').value = new Date().toLocaleDateString();
    document.getElementById('caseNotes').value = ALL_REPORT_GRADES.map(g => `Grade ${g}: ${totals[g] || 0}`).join(' | ');

    document.getElementById('caseModal').classList.add('show');
}

// Set up event listeners
function setupEventListeners() {
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('caseModal').classList.remove('show');
    });

    document.getElementById('closeCaseModal').addEventListener('click', () => {
        document.getElementById('caseModal').classList.remove('show');
    });

    document.getElementById('exportPdfBtn').addEventListener('click', () => handleExportClick('pdf'));
    document.getElementById('exportExcelBtn').addEventListener('click', () => handleExportClick('excel'));
    document.getElementById('closeExportOptionsModal').addEventListener('click', () => closeModal('exportOptionsModal'));
    document.getElementById('cancelExportOptionsBtn').addEventListener('click', () => closeModal('exportOptionsModal'));
    document.getElementById('generateExportBtn').addEventListener('click', handleGenerateExport);
    document.getElementById('exportReportType').addEventListener('change', updateExportPeriodVisibility);
    document.querySelectorAll('#exportCasesPeriodButtons .period-btn').forEach(btn => {
        btn.addEventListener('click', () => setCasesPeriodMode(btn.getAttribute('data-cases-period')));
    });

    setupPeriodFilter();

    document.getElementById('logoutBtn')?.addEventListener('click', requestLogout);
}

// Weekly / Monthly / Annually / Custom range period filter for the cases table
function setupPeriodFilter() {
    // Scoped to #periodButtons specifically, not just .period-btn — other
    // .period-btn groups can exist elsewhere on the page (e.g. modals) and
    // an unscoped selector here would wire this on-screen filter's click
    // handler onto those too.
    const periodButtons = document.querySelectorAll('#periodButtons .period-btn');
    const customRangeGroup = document.getElementById('customRangeGroup');

    periodButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            periodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPeriod = btn.getAttribute('data-period');
            customRangeGroup.hidden = currentPeriod !== 'custom';

            if (currentPeriod === 'custom') {
                if (!customStart || !customEnd) return;
            }

            await refreshReports();
        });
    });

    document.getElementById('applyRangeBtn').addEventListener('click', async () => {
        const start = document.getElementById('rangeStart').value;
        const end = document.getElementById('rangeEnd').value;

        if (!start || !end) {
            showAlert('error', 'Select both a start and end date.');
            return;
        }
        if (start > end) {
            showAlert('error', 'Start date must be before the end date.');
            return;
        }

        customStart = start;
        customEnd = end;
        await refreshReports();
    });
}

// Shared table shape used by both the PDF and Excel exporters. rows/countsMap
// default to the on-screen globals; the export panel passes its own
// freshly-fetched rows/counts for an arbitrary period instead.
function buildExportTable(rows = displayRows, countsMap = counts) {
    const header = ['Category of Cases', ...ALL_REPORT_GRADES.map(g => `Grade ${g}`), 'Totals'];
    const body = [];
    const sectionHeaderRows = [];

    rows.forEach(row => {
        if (row.type === 'header') {
            sectionHeaderRows.push(body.length);
            body.push([row.label, ...ALL_REPORT_GRADES.map(() => ''), '']);
            return;
        }
        const totals = rowTotals(row, countsMap);
        const gradeTotals = ALL_REPORT_GRADES.map(g => totals[g] || 0);
        const total = gradeTotals.reduce((sum, n) => sum + n, 0);
        body.push([row.label, ...gradeTotals, total]);
    });

    return { header, body, sectionHeaderRows };
}

/* ---- Export preview modals — same "view before you download" flow as
   the analytics.js report exports. ---- */
let pdfPreviewUrl = null;

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
    document.getElementById('pdfPreviewCloseX').addEventListener('click', closePdfPreview);
    document.getElementById('pdfPreviewCloseBtn').addEventListener('click', closePdfPreview);
}

function closePdfPreview() {
    closeModal('pdfPreviewModal');
    document.getElementById('pdfPreviewFrame').src = 'about:blank';
    if (pdfPreviewUrl) { URL.revokeObjectURL(pdfPreviewUrl); pdfPreviewUrl = null; }
}

function showPdfPreview(doc, filename) {
    ensurePdfModal();
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    pdfPreviewUrl = doc.output('bloburl');
    document.getElementById('pdfPreviewFrame').src = pdfPreviewUrl;
    document.getElementById('pdfDownloadBtn').onclick = () => doc.save(filename);
    document.getElementById('pdfPrintBtn').onclick = () => {
        const frame = document.getElementById('pdfPreviewFrame');
        frame.contentWindow.focus();
        frame.contentWindow.print();
    };
    openModal('pdfPreviewModal');
}

function ensureExcelModal() {
    if (document.getElementById('excelPreviewModal')) return;
    document.body.insertAdjacentHTML('beforeend', `<div id="excelPreviewModal" class="modal">
        <div class="modal-content" style="max-width:900px; width:95%; height:82vh; display:flex; flex-direction:column;">
            <div class="modal-header">
                <h2><i class="bi bi-file-earmark-excel"></i> <span id="excelPreviewTitle">Excel Preview</span></h2>
                <button type="button" class="modal-close" id="excelPreviewCloseX">&times;</button>
            </div>
            <div class="modal-body" style="flex:1; overflow:auto;">
                <div class="table-container"><table><tbody id="excelPreviewTbody"></tbody></table></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="excelPreviewCloseBtn">Close</button>
                <button type="button" class="btn btn-success" id="excelDownloadBtn"><i class="bi bi-download"></i> Download</button>
            </div>
        </div>
    </div>`);
    document.getElementById('excelPreviewCloseX').addEventListener('click', () => closeModal('excelPreviewModal'));
    document.getElementById('excelPreviewCloseBtn').addEventListener('click', () => closeModal('excelPreviewModal'));
}

// Each sheet's aoa (array-of-arrays) is the exact same shape that gets
// written to its worksheet, so what's previewed is what's downloaded. Row 0
// of an aoa is that sheet's title (shown as a section heading, not a table
// row); a blank row (`[]`) anywhere after that marks the row right after it
// as a column-header row (rendered as <th>) — matches the title / period /
// blank / head / body shape every aoa here is built in. Multiple sheets are
// stacked in one scrollable preview, each under its own heading.
function showExcelPreview(filename, sheets, onDownload) {
    ensureExcelModal();
    document.getElementById('excelPreviewTitle').textContent = sheets.length === 1
        ? String((sheets[0].aoa[0] && sheets[0].aoa[0][0]) || 'Excel Preview')
        : 'Excel Preview';

    document.getElementById('excelPreviewTbody').innerHTML = sheets.map((sheet, sheetIndex) => {
        const title = String((sheet.aoa[0] && sheet.aoa[0][0]) || sheet.name);
        const heading = `<tr><td colspan="20" style="border:none; padding:${sheetIndex === 0 ? '0' : '24px'} 0 8px; font-weight:700; font-size:15px;">${escapeHtml(title)}</td></tr>`;

        let afterBlank = false;
        const body = sheet.aoa.slice(1).map(row => {
            if (row.length === 0) { afterBlank = true; return '<tr><td style="height:10px; border:none; padding:0;"></td></tr>'; }
            const cellTag = afterBlank ? 'th' : 'td';
            afterBlank = false;
            return `<tr>${row.map(cell => `<${cellTag}>${escapeHtml(cell == null ? '' : cell)}</${cellTag}>`).join('')}</tr>`;
        }).join('');

        return heading + body;
    }).join('');

    document.getElementById('excelDownloadBtn').onclick = onDownload;
    openModal('excelPreviewModal');
}

// Cases-by-school aoa shared by the Excel and PDF exporters' first table.
// list defaults to the on-screen global; the export panel passes its own
// freshly-fetched school list for an arbitrary period instead.
function buildSchoolBreakdownExportRows(list = schoolBreakdown) {
    const totals = list.reduce((acc, s) => {
        acc.total += s.total; acc.male += s.male; acc.female += s.female;
        return acc;
    }, { total: 0, male: 0, female: 0 });

    const body = list.map(s => [s.school, s.total, s.male, s.female]);
    return { body, totals };
}

/* ==================================================================
   EXPORT OPTIONS PANEL (All Districts only) — clicking Export PDF/Excel
   opens a modal to pick the report (Cases by School vs. the Division
   Monthly Monitoring Report) and an explicit month+year, independent of
   whatever period is currently shown on screen. Generating always fetches
   fresh data for that period (see fetchCategoryReport/
   fetchSchoolBreakdownData/fetchPersonalSocialConcerns above) rather than
   reusing the on-screen globals, so it never changes what's rendered
   behind the modal. A single school/district instead skips this panel
   entirely — see handleExportClick below.
   ================================================================== */

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

let pendingExportFormat = 'pdf';
let casesPeriodMode = 'weekly';

function populateExportPeriodSelects() {
    const monthSelect = document.getElementById('exportMonthSelect');
    const yearSelect = document.getElementById('exportYearSelect');
    if (!monthSelect || !yearSelect || monthSelect.options.length) return; // already populated

    monthSelect.innerHTML = MONTH_NAMES.map((name, i) => `<option value="${i + 1}">${name}</option>`).join('');
    monthSelect.value = String(new Date().getMonth() + 1);

    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= currentYear - 4; y--) years.push(y);
    yearSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
    yearSelect.value = String(currentYear);
}

function setCasesPeriodMode(mode) {
    casesPeriodMode = mode;
    document.querySelectorAll('#exportCasesPeriodButtons .period-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-cases-period') === mode);
    });
    const rangeGroup = document.getElementById('exportCasesRangeGroup');
    if (rangeGroup) rangeGroup.hidden = mode !== 'custom';
}

// "Cases by School" uses Weekly/Monthly/Annually keywords (same "current
// week/month/year" meaning as the on-screen filter — no specific date to
// pick). The Division Monthly Monitoring Report instead needs one specific
// month+year, since that's what the official form is dated by. Only one of
// the two period controls is relevant at a time, so show whichever matches
// the selected report.
function updateExportPeriodVisibility() {
    const reportType = document.getElementById('exportReportType').value;
    const casesGroup = document.getElementById('exportCasesPeriodGroup');
    const dmmrGroup = document.getElementById('exportDmmrPeriodGroup');
    if (casesGroup) casesGroup.style.display = reportType === 'dmmr' ? 'none' : '';
    if (dmmrGroup) dmmrGroup.style.display = reportType === 'dmmr' ? '' : 'none';
}

// The Report/Period panel only makes sense for "All Districts" — that's
// the only place "Cases by School" and the Division Monthly Monitoring
// Report are meaningful choices. With one specific school/district
// selected there's only one applicable export (the Category of Cases table
// already on screen), so skip the panel and preview it straight away using
// whatever period is currently shown on screen — no extra picking required.
function handleExportClick(format) {
    if (currentDistrict !== ALL_DISTRICTS) {
        if (format === 'pdf') generateCategoryOfCasesPdf();
        else generateCategoryOfCasesExcel();
        return;
    }
    openExportOptionsModal(format);
}

function openExportOptionsModal(format) {
    pendingExportFormat = format;
    populateExportPeriodSelects();
    updateExportPeriodVisibility();
    openModal('exportOptionsModal');
}

// Category of Cases export for one selected school/district — same content
// as the on-screen table (buildExportTable()/PERIOD_LABELS[currentPeriod]
// with no args default to the live globals), previewed before download.
function generateCategoryOfCasesPdf() {
    if (typeof window.jspdf === 'undefined') {
        showAlert('error', 'PDF export library failed to load.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    const districtTitle = districtLabel(currentDistrict);
    const { header, body, sectionHeaderRows } = buildExportTable();

    doc.setFontSize(14);
    doc.text(`District Report Cases - ${districtTitle}`, 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${PERIOD_LABELS[currentPeriod]}  |  Generated: ${new Date().toLocaleDateString()}`, 14, 21);

    doc.autoTable({
        head: [header],
        body,
        startY: 26,
        theme: 'grid',
        headStyles: { fillColor: [29, 90, 168], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        didParseCell: (data) => {
            if (data.section === 'body' && sectionHeaderRows.includes(data.row.index)) {
                data.cell.styles.fillColor = [226, 232, 240];
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    const filename = `${districtTitle.replace(/\s+/g, '-')}_${PERIOD_LABELS[currentPeriod].replace(/\s+/g, '-')}_CategoryOfCases_${new Date().toISOString().split('T')[0]}.pdf`;
    showPdfPreview(doc, filename);
}

function generateCategoryOfCasesExcel() {
    if (typeof XLSX === 'undefined') {
        showAlert('error', 'Excel export library failed to load.');
        return;
    }

    const districtTitle = districtLabel(currentDistrict);
    const { header, body } = buildExportTable();
    const categoryAoa = [
        [`District Report Cases - ${districtTitle}`],
        [`Period: ${PERIOD_LABELS[currentPeriod]}`],
        [],
        header,
        ...body
    ];
    const sheets = [
        { name: 'Report Cases', aoa: categoryAoa, colWidths: [{ wch: 34 }, ...ALL_REPORT_GRADES.map(() => ({ wch: 10 })), { wch: 10 }] }
    ];
    const filename = `${districtTitle.replace(/\s+/g, '-')}_${PERIOD_LABELS[currentPeriod].replace(/\s+/g, '-')}_CategoryOfCases_${new Date().toISOString().split('T')[0]}.xlsx`;

    showExcelPreview(filename, sheets, () => {
        const workbook = XLSX.utils.book_new();
        sheets.forEach(sheet => {
            const worksheet = XLSX.utils.aoa_to_sheet(sheet.aoa);
            worksheet['!cols'] = sheet.colWidths;
            XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
        });
        XLSX.writeFile(workbook, filename);
        showAlert('success', 'Excel report exported successfully!');
    });
}

// Turns the panel's Month+Year (or just Year) selection into an explicit
// start/end date range for case_date_condition's 'custom' branch, plus a
// human label used in report titles/filenames.
function exportPeriodRange() {
    const year = parseInt(document.getElementById('exportYearSelect').value, 10);
    const month = parseInt(document.getElementById('exportMonthSelect').value, 10);
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start, end, label: `${MONTH_NAMES[month - 1]} ${year}` };
}

async function handleGenerateExport() {
    const reportType = document.getElementById('exportReportType').value;
    const format = pendingExportFormat;

    if (reportType === 'dmmr') {
        closeModal('exportOptionsModal');
        const { start, end, label } = exportPeriodRange();
        if (format === 'pdf') await generateDmmrPdf(start, end, label);
        else await generateDmmrExcel(start, end, label);
        return;
    }

    // Cases by School — Weekly/Monthly/Annually mean "current", same as the
    // on-screen filter, so case_date_condition needs just the keyword.
    // Custom needs an explicit range, validated before the modal closes.
    const period = casesPeriodMode;
    let start = '', end = '', label = PERIOD_LABELS[period];

    if (period === 'custom') {
        start = document.getElementById('exportCasesRangeStart').value;
        end = document.getElementById('exportCasesRangeEnd').value;
        if (!start || !end) {
            showAlert('error', 'Select both a start and end date.');
            return;
        }
        if (start > end) {
            showAlert('error', 'Start date must be before the end date.');
            return;
        }
        label = `${start} to ${end}`;
    }

    closeModal('exportOptionsModal');
    if (format === 'pdf') await generateCasesBySchoolPdf(period, start, end, label);
    else await generateCasesBySchoolExcel(period, start, end, label);
}

// "Cases by School" export — only reachable for "All Districts" (a
// specific school/district instead goes straight to generateCategoryOf-
// CasesPdf/Excel above, no panel), fetched fresh for the panel's chosen
// Weekly/Monthly/Annually/Custom period.
async function generateCasesBySchoolPdf(period, start, end, label) {
    if (typeof window.jspdf === 'undefined') {
        showAlert('error', 'PDF export library failed to load.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    const districtTitle = districtLabel(currentDistrict);
    const filename = `${districtTitle.replace(/\s+/g, '-')}_${label.replace(/\s+/g, '-')}_ReportCases_${new Date().toISOString().split('T')[0]}.pdf`;

    const schools = await fetchSchoolBreakdownData(currentDistrict, period, start, end);
    const { body: schoolBody, totals: schoolTotals } = buildSchoolBreakdownExportRows(schools);

    doc.setFontSize(14);
    doc.text(`Cases by School - ${districtTitle}`, 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${label}  |  Generated: ${new Date().toLocaleDateString()}`, 14, 21);

    doc.autoTable({
        head: [['School', 'Total Cases', 'Male', 'Female']],
        body: [
            ...schoolBody,
            [
                { content: 'Overall Total', styles: { fontStyle: 'bold' } },
                { content: String(schoolTotals.total), styles: { fontStyle: 'bold' } },
                { content: String(schoolTotals.male), styles: { fontStyle: 'bold' } },
                { content: String(schoolTotals.female), styles: { fontStyle: 'bold' } }
            ]
        ],
        startY: 26,
        theme: 'grid',
        headStyles: { fillColor: [29, 90, 168], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 }
    });

    showPdfPreview(doc, filename);
}

async function generateCasesBySchoolExcel(period, start, end, label) {
    if (typeof XLSX === 'undefined') {
        showAlert('error', 'Excel export library failed to load.');
        return;
    }

    const districtTitle = districtLabel(currentDistrict);
    const filename = `${districtTitle.replace(/\s+/g, '-')}_${label.replace(/\s+/g, '-')}_ReportCases_${new Date().toISOString().split('T')[0]}.xlsx`;

    const schools = await fetchSchoolBreakdownData(currentDistrict, period, start, end);
    const { body: schoolBody, totals: schoolTotals } = buildSchoolBreakdownExportRows(schools);
    const schoolAoa = [
        [`Cases by School - ${districtTitle}`],
        [`Period: ${label}`],
        [],
        ['School', 'Total Cases', 'Male', 'Female'],
        ...schoolBody,
        ['Overall Total', schoolTotals.total, schoolTotals.male, schoolTotals.female]
    ];
    const sheets = [
        { name: 'Cases by School', aoa: schoolAoa, colWidths: [{ wch: 34 }, { wch: 12 }, { wch: 10 }, { wch: 10 }] }
    ];

    showExcelPreview(filename, sheets, () => {
        const workbook = XLSX.utils.book_new();
        sheets.forEach(sheet => {
            const worksheet = XLSX.utils.aoa_to_sheet(sheet.aoa);
            worksheet['!cols'] = sheet.colWidths;
            XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
        });
        XLSX.writeFile(workbook, filename);
        showAlert('success', 'Excel report exported successfully!');
    });
}

/* ---- Division Monthly Monitoring Report of Learners' Personal-Social
   Concerns — the official DepEd form's fixed section/issue layout. Only
   issues with a confident, non-inventive match onto this app's existing
   case_category ids carry real counts (Membership/Smoking/Drinking/
   Gambling/Weapon/Underachievement match by name; "All forms of bullying"
   sums the app's Physical+Verbal+Emotional bullying categories; "Abuse"
   matches the app's "Abused" category). Everything else on the official
   form (Quarreling, Theft, Disrespect, CICL, Suicidal thoughts, Mental
   health problems, Neglect, SARDOS, and the "CAR" row itself — which is a
   section label on the official form, not one of this app's categories)
   has no equivalent case_category here and always reads 0, per instruction
   not to invent new categories for it. ---- */
const DMMR_SECTIONS = [
    { name: 'Behavioral or Conduct Problem', issues: [
        { label: 'CAR', categoryIds: null },
        { label: 'Quarreling', categoryIds: null },
        { label: 'Membership to any gang/unsolicited group', categoryIds: ['2'] },
        { label: 'Smoking', categoryIds: ['3'] },
        { label: 'Drinking', categoryIds: ['4'] },
        { label: 'Gambling', categoryIds: ['5'] },
        { label: 'Bringing deadly weapon', categoryIds: ['6'] },
        { label: 'Theft', categoryIds: null },
        { label: 'Disrespect', categoryIds: null },
        { label: 'CICL', categoryIds: null }
    ] },
    { name: 'Self-Harming Behavior or Suicide Ideation', issues: [
        { label: 'Suicidal thoughts', categoryIds: null },
        { label: 'Mental health problems', categoryIds: null },
        { label: 'Neglect', categoryIds: null },
        { label: 'Abuse', categoryIds: ['11'] }
    ] },
    { name: 'Poor Social Skills', issues: [
        { label: 'All forms of bullying', categoryIds: ['12', '13', '14'] }
    ] },
    { name: 'Poor Academic Performance', issues: [
        { label: 'SARDOS', categoryIds: null },
        { label: 'Underachievement', categoryIds: ['15'] }
    ] }
];

// Fixed "who typically handles this" text per issue — nothing in the schema
// tracks this, so it's the same for every district and every period.
const DMMR_DEFAULT_PROVIDER = 'Adviser, Guidance Counselor';
const DMMR_PROVIDER_OVERRIDES = {
    'Abuse': 'Adviser, Parents, School Head, Guidance Counselor and CSWD',
    'Underachievement': 'Adviser, School Head, Guidance Counselor'
};
function dmmrProvider(issueLabel) {
    return DMMR_PROVIDER_OVERRIDES[issueLabel] || DMMR_DEFAULT_PROVIDER;
}
function dmmrIssueCount(countsForGroup, categoryIds) {
    if (!categoryIds) return 0;
    return categoryIds.reduce((sum, id) => sum + (countsForGroup[id] || 0), 0);
}

// Builds the "Secondary" (division-wide total) + one group per real
// district, each group being [No. of Cases, Intervention Provider] columns
// — same grouped-header shape as the coordinator report-case.js's Grade
// columns (rowSpan/colSpan for PDF, two stacked header rows + !merges for
// Excel), just grouped by district instead of grade.
function buildDmmrTable(districts, countsByGroup) {
    const groups = [{ key: '__ALL__', label: 'Secondary' }, ...districts.map(d => ({ key: d, label: d }))];

    const pdfHead = [
        [
            { content: 'Name of School', rowSpan: 2, styles: { valign: 'middle' } },
            ...groups.map(g => ({ content: g.label, colSpan: 2, styles: { halign: 'center' } }))
        ],
        groups.flatMap(() => ['No. of Cases', 'Intervention Provider'])
    ];
    const excelRow1 = ['Name of School', ...groups.flatMap(g => [g.label, ''])];
    const excelRow2 = ['', ...groups.flatMap(() => ['No. of Cases', 'Intervention Provider'])];

    const body = [];
    const sectionHeaderRows = [];

    DMMR_SECTIONS.forEach(section => {
        sectionHeaderRows.push(body.length);
        body.push([section.name, ...groups.flatMap(() => ['', ''])]);

        section.issues.forEach(issue => {
            const provider = dmmrProvider(issue.label);
            const row = [issue.label];
            groups.forEach(g => {
                const count = dmmrIssueCount(countsByGroup[g.key] || {}, issue.categoryIds);
                row.push(count, provider);
            });
            body.push(row);
        });
    });

    return { pdfHead, excelRow1, excelRow2, body, sectionHeaderRows, groups };
}

async function generateDmmrPdf(start, end, label) {
    if (typeof window.jspdf === 'undefined') {
        showAlert('error', 'PDF export library failed to load.');
        return;
    }

    const { districts, counts: dmmrCounts } = await fetchPersonalSocialConcerns('custom', start, end);
    const { pdfHead, body, sectionHeaderRows } = buildDmmrTable(districts, dmmrCounts);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(14);
    doc.text(`Division Monthly Monitoring Report of Learners' Personal-Social Concerns`, 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${label}  |  Generated: ${new Date().toLocaleDateString()}`, 14, 21);

    doc.autoTable({
        head: pdfHead,
        body,
        startY: 26,
        theme: 'grid',
        headStyles: { fillColor: [29, 90, 168], textColor: 255, fontStyle: 'bold', fontSize: 7, halign: 'center' },
        styles: { fontSize: 7, cellPadding: 2 },
        didParseCell: (data) => {
            if (data.section === 'body' && sectionHeaderRows.includes(data.row.index)) {
                data.cell.styles.fillColor = [226, 232, 240];
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    const filename = `DMMR_${label.replace(/\s+/g, '-')}_${new Date().toISOString().split('T')[0]}.pdf`;
    showPdfPreview(doc, filename);
}

async function generateDmmrExcel(start, end, label) {
    if (typeof XLSX === 'undefined') {
        showAlert('error', 'Excel export library failed to load.');
        return;
    }

    const { districts, counts: dmmrCounts } = await fetchPersonalSocialConcerns('custom', start, end);
    const { excelRow1, excelRow2, body, groups } = buildDmmrTable(districts, dmmrCounts);

    const titleRows = [
        [`Division Monthly Monitoring Report of Learners' Personal-Social Concerns`],
        [`Period: ${label}`],
        []
    ];
    const fullAoa = [...titleRows, excelRow1, excelRow2, ...body];
    const filename = `DMMR_${label.replace(/\s+/g, '-')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const sheets = [{ name: `Division Monthly Monitoring Report`, aoa: fullAoa }];

    showExcelPreview(filename, sheets, () => {
        const worksheet = XLSX.utils.aoa_to_sheet(fullAoa);

        const headerRowIndex = titleRows.length;
        const merges = [
            { s: { r: headerRowIndex, c: 0 }, e: { r: headerRowIndex + 1, c: 0 } }
        ];
        groups.forEach((_, i) => {
            const startCol = 1 + i * 2;
            merges.push({ s: { r: headerRowIndex, c: startCol }, e: { r: headerRowIndex, c: startCol + 1 } });
        });
        worksheet['!merges'] = merges;
        worksheet['!cols'] = [{ wch: 34 }, ...groups.flatMap(() => [{ wch: 10 }, { wch: 32 }])];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'DMMR');
        XLSX.writeFile(workbook, filename);
        showAlert('success', 'Excel report exported successfully!');
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    setUserInfo();

    await loadDistrictList();
    renderDistrictButtons();
    await refreshReports();
    setupEventListeners();
});

// Show alert
function showAlert(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} show`;
    alert.textContent = message;
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '10000';
    alert.style.minWidth = '300px';
    document.body.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 3000);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '../../index.php';
}
