// District Report Cases — real case-category x grade counts per district,
// sourced from api/case-report.php (same real data source as the
// coordinator's Report Cases page). Districts are whatever the SDO has
// assigned to each school in School Management (Edit mode) — until that's done, every school
// falls into a single real "Unassigned" bucket instead of fake per-district
// numbers.

const ALL_REPORT_GRADES = [7, 8, 9, 10, 11, 12];

let districtList = ['Unassigned'];
let currentDistrict = 'Unassigned';
let sections = [];
let counts = {};
let displayRows = [];
let currentPeriod = 'all';
let customStart = '';
let customEnd = '';

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
    currentDistrict = districtList[0] || 'Unassigned';
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

    container.innerHTML = districtList.map((district, i) => `
        <button class="district-btn ${district === currentDistrict ? 'active' : ''}" style="--i:${i}" data-district="${escapeHtml(district)}">${escapeHtml(district)}</button>
    `).join('');

    container.querySelectorAll('.district-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            container.querySelectorAll('.district-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentDistrict = this.getAttribute('data-district');
            await loadReportData();
            renderCasesTable();
        });
    });
}

async function loadReportData() {
    try {
        const params = new URLSearchParams({ action: 'categories', district: currentDistrict, period: currentPeriod });
        if (currentPeriod === 'custom' && customStart && customEnd) {
            params.set('start', customStart);
            params.set('end', customEnd);
        }
        const url = `../../api/case-report.php?${params.toString()}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to load district case report');
        }

        sections = data.sections || [];
        counts = data.counts || {};
    } catch (error) {
        console.error('Error loading district case report:', error);
        sections = [];
        counts = {};
    }
}

function gradeCell(bucketKey, grade) {
    const bucket = counts[bucketKey];
    return (bucket && bucket[String(grade)]) || { m: 0, f: 0 };
}

// Same flattening as pages/coordinator/report-case.js, minus the M/F split
// (this table only shows one total per grade) — see that file for the
// full explanation of the section/category/uncategorized/subtotal shape.
function buildDisplayRows() {
    const rows = [];
    const grandTotal = {};
    ALL_REPORT_GRADES.forEach(g => { grandTotal[g] = 0; });

    sections.forEach(section => {
        rows.push({ type: 'header', label: `${section.sectionCode}. ${section.sectionName}` });

        const sectionTotal = {};
        ALL_REPORT_GRADES.forEach(g => { sectionTotal[g] = 0; });

        const addToTotals = (bucketKey) => {
            ALL_REPORT_GRADES.forEach(g => {
                const cell = gradeCell(bucketKey, g);
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

function rowTotals(row) {
    if (row.type === 'subtotal') {
        return row.totals;
    }
    const totals = {};
    ALL_REPORT_GRADES.forEach(g => {
        const cell = gradeCell(row.bucketKey, g);
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

    document.getElementById('caseId').value = `DIST-${currentDistrict.toUpperCase().replace(/\s+/g, '-')}-${row.bucketKey || 'ROW'}`;
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

    document.getElementById('exportPdfBtn').addEventListener('click', exportToPDF);
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);

    setupPeriodFilter();

    document.getElementById('logoutBtn')?.addEventListener('click', requestLogout);
}

// Weekly / Monthly / Annually / Custom range period filter for the cases table
function setupPeriodFilter() {
    const periodButtons = document.querySelectorAll('.period-btn');
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

            await loadReportData();
            renderCasesTable();
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
        await loadReportData();
        renderCasesTable();
    });
}

// Shared table shape used by both the PDF and Excel exporters
function buildExportTable() {
    const header = ['Category of Cases', ...ALL_REPORT_GRADES.map(g => `Grade ${g}`), 'Totals'];
    const body = [];
    const sectionHeaderRows = [];

    displayRows.forEach(row => {
        if (row.type === 'header') {
            sectionHeaderRows.push(body.length);
            body.push([row.label, ...ALL_REPORT_GRADES.map(() => ''), '']);
            return;
        }
        const totals = rowTotals(row);
        const gradeTotals = ALL_REPORT_GRADES.map(g => totals[g] || 0);
        const total = gradeTotals.reduce((sum, n) => sum + n, 0);
        body.push([row.label, ...gradeTotals, total]);
    });

    return { header, body, sectionHeaderRows };
}

function exportFileBaseName() {
    return `${currentDistrict.replace(/\s+/g, '-')}_${PERIOD_LABELS[currentPeriod].replace(/\s+/g, '-')}_ReportCases_${new Date().toISOString().split('T')[0]}`;
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

// aoa (array-of-arrays) is the exact same shape that gets written to the
// worksheet, so what's previewed is what's downloaded. Row 0 is the report
// title (shown in the modal header, not as a table row); a blank row (`[]`)
// anywhere after that marks the row right after it as a column-header row
// (rendered as <th>) — matches the title / period / blank / head / body
// shape this file's aoa is always built in.
function showExcelPreview(filename, aoa, colWidths, onDownload) {
    ensureExcelModal();
    document.getElementById('excelPreviewTitle').textContent = String((aoa[0] && aoa[0][0]) || 'Excel Preview');

    let afterBlank = false;
    document.getElementById('excelPreviewTbody').innerHTML = aoa.slice(1).map(row => {
        if (row.length === 0) { afterBlank = true; return '<tr><td style="height:10px; border:none; padding:0;"></td></tr>'; }
        const cellTag = afterBlank ? 'th' : 'td';
        afterBlank = false;
        return `<tr>${row.map(cell => `<${cellTag}>${escapeHtml(cell == null ? '' : cell)}</${cellTag}>`).join('')}</tr>`;
    }).join('');

    document.getElementById('excelDownloadBtn').onclick = onDownload;
    openModal('excelPreviewModal');
}

// Export report as an Excel workbook (.xlsx)
function exportToExcel() {
    if (typeof XLSX === 'undefined') {
        showAlert('error', 'Excel export library failed to load.');
        return;
    }

    const filename = `${exportFileBaseName()}.xlsx`;
    const { header, body } = buildExportTable();
    const aoa = [
        [`District Report Cases - ${currentDistrict}`],
        [`Period: ${PERIOD_LABELS[currentPeriod]}`],
        [],
        header,
        ...body
    ];
    const colWidths = [{ wch: 34 }, ...ALL_REPORT_GRADES.map(() => ({ wch: 10 })), { wch: 10 }];

    showExcelPreview(filename, aoa, colWidths, () => {
        const worksheet = XLSX.utils.aoa_to_sheet(aoa);
        worksheet['!cols'] = colWidths;
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Cases');
        XLSX.writeFile(workbook, filename);
        showAlert('success', 'Excel report exported successfully!');
    });
}

// Export report as a PDF document
function exportToPDF() {
    if (typeof window.jspdf === 'undefined') {
        showAlert('error', 'PDF export library failed to load.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    const { header, body, sectionHeaderRows } = buildExportTable();

    doc.setFontSize(14);
    doc.text(`District Report Cases - ${currentDistrict}`, 14, 15);
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

    showPdfPreview(doc, `${exportFileBaseName()}.pdf`);
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    setUserInfo();

    await loadDistrictList();
    renderDistrictButtons();
    await loadReportData();
    renderCasesTable();
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
