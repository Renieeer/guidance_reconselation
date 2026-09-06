// SDO School Reports — both sections now run on real data from
// api/case-report.php (previously the "Available Reports" generator was
// pure UI decoration: a fake district1..district11 dropdown, and Generate/
// Export just showed a toast without producing anything).

// This page's own period wording, mapped to the shared period param
// api/case-report.php's case_date_condition() understands.
const PERIOD_PARAM = { current: 'monthly', quarterly: 'quarterly', annual: 'annually' };
const PERIOD_LABEL = { current: 'Current Month', quarterly: 'Quarterly', annual: 'Annual' };

let generatedReports = [];

function loadSchoolReports() {
    initPage();
    loadDistrictOptions();
    loadSummaryReports();
}

function selectedDistrict() {
    return document.getElementById('districtSelect').value;
}

function selectedPeriodKey() {
    return document.getElementById('periodSelect').value;
}

// Real district list (schools.district, same source as the district report
// pages) instead of the old hardcoded "District 1".."District 11" — those
// never matched any real district value, so selecting one and generating
// always came back empty.
async function loadDistrictOptions() {
    const select = document.getElementById('districtSelect');
    let districts = [];
    try {
        const res = await fetch('../../api/case-report.php?action=districts').then(r => r.json());
        districts = (res.success && Array.isArray(res.districts)) ? res.districts : [];
        if (res.success && res.hasUnassigned) districts.push('Unassigned');
    } catch (error) {
        console.error('Error loading districts:', error);
    }
    select.innerHTML = '<option value="">All Districts</option>' +
        districts.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
}

async function generateReport() {
    const district = selectedDistrict();
    const periodKey = selectedPeriodKey();

    try {
        const params = new URLSearchParams({ action: 'school_breakdown', district: district || 'all', period: PERIOD_PARAM[periodKey] });
        const res = await fetch(`../../api/case-report.php?${params.toString()}`).then(r => r.json());
        if (!res.success) {
            throw new Error(res.message || 'Failed to generate report');
        }

        generatedReports.unshift({
            id: Date.now(),
            district: district || 'All Districts',
            districtParam: district,
            periodKey,
            generatedAt: new Date()
        });
        renderGeneratedReports();
        showAlert(`Report generated for ${district || 'All Districts'} - ${PERIOD_LABEL[periodKey]}`, 'success');
    } catch (error) {
        console.error('Error generating report:', error);
        showAlert('Could not generate report: ' + error.message, 'error');
    }
}

function renderGeneratedReports() {
    const tbody = document.getElementById('reportsTableBody');

    if (generatedReports.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center p-5 text-muted">
                    <p>Generate a report to view results</p>
                    <button class="btn btn-primary mt-2" onclick="generateReport()">Generate Report</button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = generatedReports.map(r => `
        <tr>
            <td>Case &amp; Gender Report</td>
            <td>${escapeHtml(r.district)}</td>
            <td>${escapeHtml(PERIOD_LABEL[r.periodKey])}</td>
            <td>${r.generatedAt.toLocaleString()}</td>
            <td><span class="badge badge-completed">Ready</span></td>
            <td><button type="button" class="btn btn-primary btn-sm" onclick="downloadGeneratedReport(${r.id})"><i class="bi bi-download"></i> Download PDF</button></td>
        </tr>
    `).join('');
}

function downloadGeneratedReport(id) {
    const report = generatedReports.find(r => r.id === id);
    if (!report) return;
    buildAndDownloadPdf(report.districtParam, report.periodKey);
}

// Top-level "Export PDF" — builds and downloads a PDF for whatever's
// currently selected, without needing a prior "Generate" click.
function exportReport() {
    buildAndDownloadPdf(selectedDistrict(), selectedPeriodKey());
}

async function buildAndDownloadPdf(district, periodKey) {
    if (typeof window.jspdf === 'undefined') {
        showAlert('PDF export library failed to load.', 'error');
        return;
    }

    try {
        const params = new URLSearchParams({ action: 'school_breakdown', district: district || 'all', period: PERIOD_PARAM[periodKey] });
        const res = await fetch(`../../api/case-report.php?${params.toString()}`).then(r => r.json());
        if (!res.success) {
            throw new Error(res.message || 'Failed to load report data');
        }

        const schools = res.schools || [];
        const districtTitle = district || 'All Districts';
        const totals = schools.reduce((acc, s) => {
            acc.total += s.total; acc.male += s.male; acc.female += s.female;
            return acc;
        }, { total: 0, male: 0, female: 0 });

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text(`School Report - ${districtTitle}`, 14, 15);
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text(`Period: ${PERIOD_LABEL[periodKey]}  |  Generated: ${new Date().toLocaleDateString()}`, 14, 21);

        doc.autoTable({
            head: [['School', 'Total Cases', 'Male', 'Female']],
            body: [
                ...schools.map(s => [s.school, s.total, s.male, s.female]),
                [
                    { content: 'Overall Total', styles: { fontStyle: 'bold' } },
                    { content: String(totals.total), styles: { fontStyle: 'bold' } },
                    { content: String(totals.male), styles: { fontStyle: 'bold' } },
                    { content: String(totals.female), styles: { fontStyle: 'bold' } }
                ]
            ],
            startY: 26,
            theme: 'grid',
            headStyles: { fillColor: [18, 58, 107], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 }
        });

        const filename = `school_report_${districtTitle.replace(/\s+/g, '-')}_${periodKey}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        showAlert('Report exported as PDF successfully!', 'success');
    } catch (error) {
        console.error('Error exporting report:', error);
        showAlert('Could not export report: ' + error.message, 'error');
    }
}

// Real per-district rollup from api/case-report.php (same source as
// pages/sdo/analytics.js's comparative table) — schools/students
// referred/resolved/success-rate/last-updated, grouped by schools.district.
// Respects this page's own district/period filters instead of always
// showing all-time, every-district data regardless of the selection above.
function loadSummaryReports() {
    const tbody = document.getElementById('sampleReportsBody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center p-5 text-muted">Loading district reports...</td></tr>';

    const district = selectedDistrict();
    const periodKey = selectedPeriodKey();
    const params = new URLSearchParams({ action: 'district_summary', period: PERIOD_PARAM[periodKey] });

    fetch(`../../api/case-report.php?${params.toString()}`)
        .then(response => response.json())
        .then(result => {
            if (!result.success) {
                throw new Error(result.message || 'Failed to load district reports');
            }
            let districts = result.districts || [];
            if (district) {
                districts = districts.filter(d => d.district === district);
            }
            renderSampleReports(districts);
        })
        .catch(error => {
            console.error('Error loading district reports:', error);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Unable to load district reports.</td></tr>';
        });
}

function renderSampleReports(districts) {
    const tbody = document.getElementById('sampleReportsBody');

    if (districts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No schools found.</td></tr>';
        return;
    }

    tbody.innerHTML = districts.map(row => {
        const successRate = row.studentsReferred > 0 ? Math.round((row.resolvedCount / row.studentsReferred) * 100) : 0;
        const lastDate = row.lastActivity ? new Date(row.lastActivity).toLocaleDateString() : 'No activity yet';

        return `
            <tr>
                <td><strong>${escapeHtml(row.district)}</strong></td>
                <td>${row.schoolCount}</td>
                <td>${row.studentsReferred}</td>
                <td>${row.resolvedCount}</td>
                <td><strong>${successRate}%</strong></td>
                <td>${lastDate}</td>
            </tr>
        `;
    }).join('');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', loadSchoolReports);
