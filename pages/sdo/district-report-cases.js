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

    document.getElementById('exportBtn').addEventListener('click', exportReport);

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

// Export report function
function exportReport() {
    let csvContent = `Category of Cases,${ALL_REPORT_GRADES.map(g => `Grade ${g}`).join(',')},Totals\n`;

    displayRows.forEach(row => {
        if (row.type === 'header') return;
        const totals = rowTotals(row);
        const gradeTotals = ALL_REPORT_GRADES.map(g => totals[g] || 0);
        const total = gradeTotals.reduce((sum, n) => sum + n, 0);
        csvContent += `"${row.label}",${gradeTotals.join(',')},${total}\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', `${currentDistrict.replace(/\s+/g, '-')}_${PERIOD_LABELS[currentPeriod].replace(/\s+/g, '-')}_ReportCases_${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    showAlert('success', 'Report exported successfully!');
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();

    await loadDistrictList();
    renderDistrictButtons();
    await loadReportData();
    renderCasesTable();
    setupEventListeners();

    // Update user info
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.role.toUpperCase();
        document.getElementById('userAvatar').textContent = user.name.substring(0, 2).toUpperCase();
    }
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
