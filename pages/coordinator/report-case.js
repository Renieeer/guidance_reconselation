// Report Cases — real case-category x grade x gender counts, sourced from
// api/case-report.php (which aggregates the counselor's actual logged cases
// in counselor_case_scenarios). Categories/sections match the real
// case_category/section tables used by the counselor's case workflow.

// Mutable: reassigned to [1..6] whenever this account's school is
// elementary (school_level East/West/South) — see loadReportData() and
// api/case-report.php's schools_are_elementary(). Defaults to the usual
// secondary range until the first fetch comes back.
let ALL_REPORT_GRADES = [7, 8, 9, 10, 11, 12];
let isElementarySchool = false;

let currentSchool = '';
let sections = [];
let counts = {};
let displayRows = [];

// This same report-case.js is shared verbatim by the coordinator, counselor,
// and combined ("other-school") login pages — role-specific text (report
// title, filename) reads the logged-in account's own role instead of being
// hardcoded, so a counselor's export doesn't say "Coordinator".
function reportRoleLabel() {
    const role = (getCurrentUser() && getCurrentUser().role) || '';
    if (role === 'counselor') return 'Counselor';
    if (role === 'counselor-and-coordinator') return 'Combined Coordinator & Counselor';
    return 'Coordinator';
}

function reportRoleSlug() {
    const role = (getCurrentUser() && getCurrentUser().role) || '';
    if (role === 'counselor') return 'counselor';
    if (role === 'counselor-and-coordinator') return 'combined';
    return 'coordinator';
}

// Grades this account is allowed to see (e.g. a coordinator scoped to
// Grades 7-10, or all six if unassigned/no restriction).
let visibleGrades = ALL_REPORT_GRADES;

function computeVisibleGrades() {
    const scoped = gradeScopeToList(getCurrentGradeScope(), isElementarySchool);
    return scoped.length ? scoped : ALL_REPORT_GRADES;
}

// Rebuilds the two-row grouped header (Grade N spanning Male/Female/Total)
// from visibleGrades. Built fresh every time rather than trimming the
// static 7-12 markup, since an elementary school's 1-6 columns don't exist
// in that markup at all.
function renderGradeHeader() {
    const theadRows = document.querySelectorAll('#reportCasesTable thead tr');
    if (theadRows.length < 2) return;

    theadRows[0].innerHTML = `<th>Category of Cases</th>${visibleGrades.map(g =>
        `<th colspan="3" class="grade-col" data-grade="${g}" style="text-align: center;">Grade ${g}</th>`
    ).join('')}`;

    theadRows[1].innerHTML = `<th></th>${visibleGrades.map(g =>
        `<th class="grade-col" data-grade="${g}">Male</th><th class="grade-col" data-grade="${g}">Female</th><th class="grade-col" data-grade="${g}">Total</th>`
    ).join('')}`;
}

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    initPage();

    const user = getCurrentUser();
    currentSchool = (user && user.school_attended) || '';

    await loadReportData();
    visibleGrades = computeVisibleGrades();
    renderGradeHeader();

    buildCasesTable();
    populateFilterOptions();
    setupEventListeners();
});

function esc(value) {
    const div = document.createElement('div');
    div.textContent = value === null || value === undefined ? '' : String(value);
    return div.innerHTML;
}

async function loadReportData() {
    try {
        const gradeScope = getCurrentGradeScope();
        const url = `../../api/case-report.php?action=categories&school=${encodeURIComponent(currentSchool)}&grade_scope=${encodeURIComponent(gradeScope)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to load case report');
        }

        sections = data.sections || [];
        counts = data.counts || {};
        if (Array.isArray(data.grades) && data.grades.length) {
            ALL_REPORT_GRADES = data.grades;
        }
        isElementarySchool = !!data.isElementary;
    } catch (error) {
        console.error('Error loading case report:', error);
        sections = [];
        counts = {};
    }
}

function gradeCell(bucketKey, grade) {
    const bucket = counts[bucketKey];
    return (bucket && bucket[String(grade)]) || { m: 0, f: 0 };
}

// Flattens sections/categories/counts into one render-and-export-ready list:
// a header row per section, a row per real category, an "Uncategorized" row
// per section (cases whose category hasn't been chosen yet), a subtotal row
// per section, and a final grand-total row.
function buildDisplayRows() {
    const rows = [];
    const grandTotal = {};
    visibleGrades.forEach(g => { grandTotal[g] = { m: 0, f: 0 }; });

    sections.forEach(section => {
        rows.push({ type: 'header', label: `${section.sectionCode}. ${section.sectionName}` });

        const sectionTotal = {};
        visibleGrades.forEach(g => { sectionTotal[g] = { m: 0, f: 0 }; });

        const addToTotals = (bucketKey) => {
            visibleGrades.forEach(g => {
                const cell = gradeCell(bucketKey, g);
                sectionTotal[g].m += cell.m;
                sectionTotal[g].f += cell.f;
                grandTotal[g].m += cell.m;
                grandTotal[g].f += cell.f;
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

function rowTotals(row) {
    if (row.type === 'subtotal') {
        return row.totals;
    }
    const totals = {};
    visibleGrades.forEach(g => { totals[g] = gradeCell(row.bucketKey, g); });
    return totals;
}

function buildCasesTable() {
    const tbody = document.getElementById('casesTableBody');
    tbody.innerHTML = '';

    displayRows = buildDisplayRows();

    displayRows.forEach((row, index) => {
        const tr = document.createElement('tr');

        if (row.type === 'header') {
            const colCount = 1 + visibleGrades.length * 3;
            tr.innerHTML = `<td colspan="${colCount}" style="font-weight: 700; background: #e2e8f0;">${row.label}</td>`;
            tbody.appendChild(tr);
            return;
        }

        if (row.type === 'subtotal') {
            tr.style.fontWeight = '700';
            tr.style.backgroundColor = '#f1f5f9';
        }

        const totals = rowTotals(row);
        let html = `<td style="font-weight: 500;">${row.label}</td>`;

        visibleGrades.forEach(g => {
            const cell = totals[g] || { m: 0, f: 0 };
            const total = cell.m + cell.f;
            html += `<td class="text-center" style="font-size: 0.9em;">${cell.m}</td><td class="text-center" style="font-size: 0.9em;">${cell.f}</td><td class="text-center">${total > 0 ? `<span class="badge badge-in-progress">${total}</span>` : '0'}</td>`;
        });

        tr.innerHTML = html;

        if (row.type === 'category') {
            tr.style.cursor = 'pointer';
            tr.addEventListener('click', () => showCaseDetails(index));
        }

        tbody.appendChild(tr);
    });
}

function showCaseDetails(rowIndex) {
    const row = displayRows[rowIndex];
    if (!row) return;

    const modal = document.getElementById('caseModal');
    const totals = rowTotals(row);
    let total = 0;
    visibleGrades.forEach(g => {
        total += (totals[g]?.m || 0) + (totals[g]?.f || 0);
    });

    document.getElementById('caseId').value = `CASE-${(currentSchool || 'SCHOOL').toUpperCase().replace(/\s+/g, '-')}-${row.bucketKey || 'ROW'}`;
    document.getElementById('caseCategory').value = row.label;
    document.getElementById('caseGrade').value = `Grades ${visibleGrades[0]}-${visibleGrades[visibleGrades.length - 1]}`;
    document.getElementById('caseStatus').value = 'Active';
    document.getElementById('caseDate').value = new Date().toLocaleDateString();

    let notes = `Total Cases: ${total}\n\n`;
    visibleGrades.forEach(grade => {
        const m = totals[grade]?.m || 0;
        const f = totals[grade]?.f || 0;
        notes += `Grade ${grade}: ${m + f} (M: ${m} / F: ${f})\n`;
    });
    document.getElementById('caseNotes').value = notes;

    modal.style.display = 'flex';
}

// ---- Filter panel + searchable case list ----
// Every filter (period, category, grade, gender, status, free-text search)
// is applied server-side by api/case-report.php?action=list, which returns
// one row per real logged case — unlike the pivot table above, which only
// ever shows aggregated counts and can't answer "which cases".
let filteredCases = [];

function populateFilterOptions() {
    const categorySelect = document.getElementById('filterCategory');
    sections.forEach(section => {
        const group = document.createElement('optgroup');
        group.label = `${section.sectionCode}. ${section.sectionName}`;
        section.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.categoryId;
            opt.textContent = cat.categoryName;
            group.appendChild(opt);
        });
        const uncategorized = document.createElement('option');
        uncategorized.value = `section-${section.sectionId}-uncategorized`;
        uncategorized.textContent = 'Uncategorized';
        group.appendChild(uncategorized);
        categorySelect.appendChild(group);
    });

    const gradeSelect = document.getElementById('filterGrade');
    visibleGrades.forEach(g => {
        const opt = document.createElement('option');
        opt.value = String(g);
        opt.textContent = `Grade ${g}`;
        gradeSelect.appendChild(opt);
    });
}

function toggleFilterPanel() {
    const panel = document.getElementById('filterPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function updateCustomRangeVisibility() {
    const isCustom = document.getElementById('filterPeriod').value === 'custom';
    document.getElementById('filterStartGroup').style.display = isCustom ? 'block' : 'none';
    document.getElementById('filterEndGroup').style.display = isCustom ? 'block' : 'none';
}

async function applyFilters() {
    const params = new URLSearchParams({
        action: 'list',
        school: currentSchool,
        grade_scope: getCurrentGradeScope(),
        period: document.getElementById('filterPeriod').value,
        start: document.getElementById('filterStart').value,
        end: document.getElementById('filterEnd').value,
        category: document.getElementById('filterCategory').value,
        grade: document.getElementById('filterGrade').value,
        gender: document.getElementById('filterGender').value,
        status: document.getElementById('filterStatus').value,
        search: document.getElementById('filterSearch').value.trim()
    });

    const resultsView = document.getElementById('filterResultsView');
    const summary = document.getElementById('filterResultsSummary');
    const list = document.getElementById('filterResultsList');

    document.getElementById('reportTableView').style.display = 'none';
    resultsView.style.display = 'block';
    summary.textContent = 'Searching...';
    list.innerHTML = '';

    try {
        const response = await fetch(`../../api/case-report.php?${params.toString()}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to load cases');

        filteredCases = data.data || [];
        renderFilterResults();
    } catch (error) {
        console.error('Error loading filtered cases:', error);
        summary.textContent = 'Could not load cases.';
    }
}

function renderFilterResults() {
    const summary = document.getElementById('filterResultsSummary');
    const list = document.getElementById('filterResultsList');

    summary.textContent = filteredCases.length === 0
        ? 'No cases match these filters.'
        : `${filteredCases.length} case${filteredCases.length === 1 ? '' : 's'} found`;

    if (filteredCases.length === 0) {
        list.innerHTML = `<p class="text-muted" style="background:white; border:1px dashed var(--border-color); border-radius:8px; padding:30px; text-align:center;">Try widening the period or clearing a filter.</p>`;
        return;
    }

    list.innerHTML = filteredCases.map((row, index) => {
        const dateLabel = row.caseDate
            ? new Date(`${row.caseDate}T00:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : 'No date on file';
        const gradeLabel = row.grade ? `Grade ${row.grade}` : 'Grade N/A';
        const snippet = row.summary || row.caseTitle || 'No additional notes on file.';
        return `
        <div class="case-result-item" data-index="${index}">
            <div class="case-result-title">${esc(row.studentName)} <span class="case-result-dash">&mdash;</span> ${esc(row.categoryName)}</div>
            <div class="case-result-meta">
                <span>${esc(gradeLabel)}</span> &middot;
                <span>${esc(row.gender || 'N/A')}</span> &middot;
                ${badgeForCaseStatus(row.status)} &middot;
                <span>${esc(dateLabel)}</span> &middot;
                <span>${esc(row.counselorName || 'Unknown counselor')}</span>
            </div>
            <div class="case-result-snippet">${esc(snippet)}</div>
        </div>`;
    }).join('');

    list.querySelectorAll('.case-result-item').forEach(item => {
        item.addEventListener('click', () => showFilteredCaseDetails(parseInt(item.getAttribute('data-index'), 10)));
    });
}

function badgeForCaseStatus(status) {
    const normalized = String(status || '').toLowerCase();
    const mapped = ['completed', 'resolved', 'done', 'closed'].includes(normalized) ? 'completed'
        : ['rejected', 'cancelled', 'canceled'].includes(normalized) ? 'rejected'
        : ['in-progress', 'in progress', 'ongoing'].includes(normalized) ? 'in-progress'
        : 'pending';
    return createBadge(mapped);
}

function showFilteredCaseDetails(index) {
    const row = filteredCases[index];
    if (!row) return;

    document.getElementById('caseId').value = row.caseUid || `CASE-${row.id}`;
    document.getElementById('caseCategory').value = row.categoryName || 'Uncategorized';
    document.getElementById('caseGrade').value = `${row.grade ? `Grade ${row.grade}` : 'N/A'} • ${row.gender || 'N/A'}`;
    document.getElementById('caseStatus').value = row.status || 'pending';
    document.getElementById('caseDate').value = row.caseDate
        ? new Date(`${row.caseDate}T00:00:00`).toLocaleDateString()
        : 'N/A';
    document.getElementById('caseNotes').value = [
        `Student: ${row.studentName || 'Unknown'}`,
        `Counselor: ${row.counselorName || 'Unknown'}`,
        row.caseTitle ? `Title: ${row.caseTitle}` : '',
        '',
        row.summary || 'No additional notes on file.'
    ].filter(Boolean).join('\n');

    document.getElementById('caseModal').style.display = 'flex';
}

function clearFilters() {
    document.getElementById('filterPeriod').value = 'all';
    document.getElementById('filterStart').value = '';
    document.getElementById('filterEnd').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterGrade').value = '';
    document.getElementById('filterGender').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterSearch').value = '';
    updateCustomRangeVisibility();

    document.getElementById('filterResultsView').style.display = 'none';
    document.getElementById('reportTableView').style.display = '';
    filteredCases = [];
}

function setupEventListeners() {
    // Modal controls
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('caseModal').style.display = 'none';
    });

    document.getElementById('closeCaseModal').addEventListener('click', () => {
        document.getElementById('caseModal').style.display = 'none';
    });

    document.getElementById('closeNewCaseModal').addEventListener('click', () => {
        document.getElementById('newCaseModal').style.display = 'none';
    });

    document.getElementById('cancelNewCase').addEventListener('click', () => {
        document.getElementById('newCaseModal').style.display = 'none';
    });

    // Form submission
    document.getElementById('caseReportForm').addEventListener('submit', (e) => {
        e.preventDefault();
        submitNewCase();
    });

    // Export buttons
    document.getElementById('exportPdfBtn').addEventListener('click', exportToPDF);
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);

    // Filter panel
    document.getElementById('filterBtn').addEventListener('click', toggleFilterPanel);
    document.getElementById('filterPeriod').addEventListener('change', updateCustomRangeVisibility);
    document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
    document.getElementById('filterSearch').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyFilters();
        }
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        const caseModal = document.getElementById('caseModal');
        const newCaseModal = document.getElementById('newCaseModal');
        if (e.target === caseModal) caseModal.style.display = 'none';
        if (e.target === newCaseModal) newCaseModal.style.display = 'none';
    });
}

// This quick-add form is a local note only — it doesn't have a real
// section/category selection (see the actual case workflow in
// pages/counselor/counseling.php for that), so it can't safely bump the
// real per-category counts above without corrupting them with a fake type.
function submitNewCase() {
    const title = document.getElementById('caseTitle').value;
    const type = document.getElementById('caseType').value;
    const description = document.getElementById('caseDescription').value;
    const severity = document.getElementById('severity').value;

    if (!title || !type || !description || !severity) {
        alert('Please fill in all required fields');
        return;
    }

    const newNote = {
        id: `NOTE-${(currentSchool || 'SCHOOL').toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`,
        title,
        type,
        description,
        severity,
        date: new Date().toLocaleDateString(),
        status: 'Active'
    };

    const storageKey = `coordinator_quick_notes_${currentSchool}`;
    const notes = JSON.parse(localStorage.getItem(storageKey) || '[]');
    notes.push(newNote);
    localStorage.setItem(storageKey, JSON.stringify(notes));

    document.getElementById('caseReportForm').reset();
    document.getElementById('newCaseModal').style.display = 'none';

    showNotification('Note saved. To log a real case with a category, use Case Management.');
}

// Two-row grade header (Grade N spanning Male/Female/Total), mirroring the
// on-page table instead of a single row like "Grade 7 - M" — those truncate
// to identical-looking "Grade 7 -" labels once column width is narrower
// than the full text. Feeds the PDF's autotable head directly; the Excel
// workbook builds its own equivalent header via real merged cells (see
// buildReportCasesWorkbook()).
function buildGradeHeaderRows() {
    const pdfHead = [
        [
            { content: 'Category of Cases', rowSpan: 2, styles: { valign: 'middle' } },
            ...visibleGrades.map(g => ({ content: `Grade ${g}`, colSpan: 3, styles: { halign: 'center' } })),
            { content: 'Overall Total', rowSpan: 2, styles: { valign: 'middle' } }
        ],
        visibleGrades.flatMap(() => ['Male', 'Female', 'Total'])
    ];
    return { pdfHead };
}

// Shared table shape used by both the PDF and Excel exporters
function buildExportTable() {
    const body = [];
    const sectionHeaderRows = [];
    const subtotalRows = [];

    displayRows.forEach(row => {
        if (row.type === 'header') {
            sectionHeaderRows.push(body.length);
            body.push([row.label, ...visibleGrades.flatMap(() => ['', '', '']), '']);
            return;
        }

        const totals = rowTotals(row);
        const rowCells = [row.label];
        let overallTotal = 0;
        visibleGrades.forEach(g => {
            const cell = totals[g] || { m: 0, f: 0 };
            const total = cell.m + cell.f;
            overallTotal += total;
            rowCells.push(cell.m, cell.f, total);
        });
        rowCells.push(overallTotal);

        if (row.type === 'subtotal') {
            subtotalRows.push(body.length);
        }
        body.push(rowCells);
    });

    return { body, sectionHeaderRows, subtotalRows };
}

function exportFileBaseName() {
    return `${reportRoleSlug()}-cases-${(currentSchool || 'school').replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;
}

/* ---- Export preview modals — same "view before you download" flow as
   the analytics.js report exports, adapted here since the grade header
   uses merged cells (Excel) / rowSpan+colSpan (PDF) that a flat
   array-of-arrays preview can't represent faithfully. The live
   #reportCasesTable already renders that exact structure (only the
   visibleGrades columns, same header grouping), so it's cloned straight
   into the Excel preview instead of re-deriving it. ---- */
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
        <div class="modal-content" style="max-width:1100px; width:95%; height:82vh; display:flex; flex-direction:column;">
            <div class="modal-header">
                <h2><i class="bi bi-file-earmark-excel"></i> Excel Preview</h2>
                <button type="button" class="modal-close" id="excelPreviewCloseX">&times;</button>
            </div>
            <div class="modal-body" style="flex:1; overflow:auto;" id="excelPreviewBody"></div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="excelPreviewCloseBtn">Close</button>
                <button type="button" class="btn btn-success" id="excelDownloadBtn"><i class="bi bi-download"></i> Download</button>
            </div>
        </div>
    </div>`);
    document.getElementById('excelPreviewCloseX').addEventListener('click', () => closeModal('excelPreviewModal'));
    document.getElementById('excelPreviewCloseBtn').addEventListener('click', () => closeModal('excelPreviewModal'));
}

function showExcelPreview(filename, tableEl, onDownload) {
    ensureExcelModal();
    const body = document.getElementById('excelPreviewBody');
    body.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'table-container';
    wrapper.appendChild(tableEl);
    body.appendChild(wrapper);
    document.getElementById('excelDownloadBtn').onclick = onDownload;
    openModal('excelPreviewModal');
}

// Generic thin border, reused by every cell in the built workbook.
const THIN_BORDER = {
    top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
};

// Real cell colors/borders/merges on the downloaded .xlsx need actual
// style-writing, which the plain SheetJS build (the free "Community
// Edition", also loaded on this page for the Excel preview's live-table
// clone) can't do on write — CE dropped that years ago, which is why the
// old export came out as unstyled text with no visible header grouping.
// ExcelJS (ajax/libs/exceljs) still writes real styles, so the downloaded
// file is built with that instead — same pattern already used by
// pages/sdo/district-report-cases.js's Category of Cases export.
function buildReportCasesWorkbook(body, sectionHeaderRows, subtotalRows, title, periodLabel) {
    const totalCols = 2 + visibleGrades.length * 3; // label + (Male/Female/Total per grade) + Overall Total
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report Cases');

    sheet.mergeCells(1, 1, 1, totalCols);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = title;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells(2, 1, 2, totalCols);
    const periodCell = sheet.getCell(2, 1);
    periodCell.value = periodLabel;
    periodCell.font = { size: 10, color: { argb: 'FF666666' } };
    periodCell.alignment = { horizontal: 'center' };

    const headRow1 = 4;
    const headRow2 = 5;

    sheet.mergeCells(headRow1, 1, headRow2, 1);
    sheet.getCell(headRow1, 1).value = 'Category of Cases';

    sheet.mergeCells(headRow1, totalCols, headRow2, totalCols);
    sheet.getCell(headRow1, totalCols).value = 'Overall Total';

    let col = 2;
    visibleGrades.forEach(g => {
        sheet.mergeCells(headRow1, col, headRow1, col + 2);
        sheet.getCell(headRow1, col).value = `Grade ${g}`;
        sheet.getCell(headRow2, col).value = 'Male';
        sheet.getCell(headRow2, col + 1).value = 'Female';
        sheet.getCell(headRow2, col + 2).value = 'Total';
        col += 3;
    });

    for (let r = headRow1; r <= headRow2; r++) {
        for (let c = 1; c <= totalCols; c++) {
            const cell = sheet.getCell(r, c);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D5AA8' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = THIN_BORDER;
        }
    }

    let rowIndex = headRow2 + 1;
    body.forEach((row, i) => {
        const isHeader = sectionHeaderRows.includes(i);
        const isSubtotal = subtotalRows.includes(i);

        if (isHeader) sheet.mergeCells(rowIndex, 1, rowIndex, totalCols);

        row.forEach((value, c) => {
            if (isHeader && c > 0) return; // merged into the label cell above
            const cell = sheet.getCell(rowIndex, c + 1);
            cell.value = value;
            cell.border = THIN_BORDER;
            cell.alignment = { vertical: 'middle', horizontal: c === 0 ? 'left' : 'center', wrapText: true };
            if (isHeader) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
                cell.font = { bold: true };
            } else if (isSubtotal) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                cell.font = { bold: true };
            }
        });
        rowIndex++;
    });

    sheet.getColumn(1).width = 34;
    for (let c = 2; c <= totalCols; c++) sheet.getColumn(c).width = 9;

    return workbook;
}

async function downloadExcelJSWorkbook(workbook, filename) {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Export report as an Excel workbook (.xlsx)
function exportToExcel() {
    if (typeof ExcelJS === 'undefined') {
        showNotification('Excel export library failed to load.');
        return;
    }

    const filename = `${exportFileBaseName()}.xlsx`;
    const previewTable = document.getElementById('reportCasesTable').cloneNode(true);
    previewTable.removeAttribute('id');

    showExcelPreview(filename, previewTable, async () => {
        const { body, sectionHeaderRows, subtotalRows } = buildExportTable();
        const title = `${reportRoleLabel()} Report Cases - ${currentSchool || 'School'}`;
        const periodLabel = `Generated: ${new Date().toLocaleDateString()}`;

        const workbook = buildReportCasesWorkbook(body, sectionHeaderRows, subtotalRows, title, periodLabel);
        await downloadExcelJSWorkbook(workbook, filename);
        showNotification('Excel report exported successfully!');
    });
}

// Export report as a PDF document
function exportToPDF() {
    if (typeof window.jspdf === 'undefined') {
        showNotification('PDF export library failed to load.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    const { body, sectionHeaderRows, subtotalRows } = buildExportTable();
    const { pdfHead } = buildGradeHeaderRows();

    doc.setFontSize(14);
    doc.text(`${reportRoleLabel()} Report Cases - ${currentSchool || 'School'}`, 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 21);

    doc.autoTable({
        head: pdfHead,
        body,
        startY: 26,
        theme: 'grid',
        headStyles: { fillColor: [29, 90, 168], textColor: 255, fontStyle: 'bold', fontSize: 7, halign: 'center' },
        styles: { fontSize: 7, cellPadding: 2 },
        didParseCell: (data) => {
            if (data.section !== 'body') return;
            if (sectionHeaderRows.includes(data.row.index)) {
                data.cell.styles.fillColor = [226, 232, 240];
                data.cell.styles.fontStyle = 'bold';
            } else if (subtotalRows.includes(data.row.index)) {
                data.cell.styles.fillColor = [241, 245, 249];
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    showPdfPreview(doc, `${exportFileBaseName()}.pdf`);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 35px rgba(59, 130, 246, 0.32);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
