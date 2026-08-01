// SDO School Reports Script

function loadSchoolReports() {
    initPage();
    loadSampleReports();
}

function generateReport() {
    const district = document.getElementById('districtSelect').value;
    const period = document.getElementById('periodSelect').value;

    if (!district) {
        showAlert('Please select a district', 'error');
        return;
    }

    showAlert(`Report generated for ${district ? 'Selected District' : 'All Districts'} - ${period}`, 'success');
}

function exportReport() {
    showAlert('Report exported as PDF successfully!', 'success');
}

// Real per-district rollup from api/case-report.php (same source as
// pages/sdo/analytics.js's comparative table) — schools/students
// referred/resolved/success-rate/last-updated, grouped by schools.district.
function loadSampleReports() {
    const tbody = document.getElementById('sampleReportsBody');

    fetch('../../api/case-report.php?action=district_summary')
        .then(response => response.json())
        .then(result => {
            if (!result.success) {
                throw new Error(result.message || 'Failed to load district reports');
            }
            renderSampleReports(result.districts || []);
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

