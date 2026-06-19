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

function loadSampleReports() {
    const districts = [
        'District 1', 'District 2', 'District 3', 'District 4', 'District 5',
        'District 6', 'District 7', 'District 8', 'District 9', 'District 10', 'District 11'
    ];

    const tbody = document.getElementById('sampleReportsBody');

    tbody.innerHTML = districts.map((district, idx) => {
        const schools = Math.floor(Math.random() * 15) + 5;
        const students = Math.floor(Math.random() * 150) + 20;
        const resolved = Math.floor(students * (Math.random() * 0.5 + 0.3));
        const successRate = Math.round((resolved / students) * 100);
        const lastDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString();

        return `
            <tr>
                <td><strong>${district}</strong></td>
                <td>${schools}</td>
                <td>${students}</td>
                <td>${resolved}</td>
                <td><strong>${successRate}%</strong></td>
                <td>${lastDate}</td>
            </tr>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', loadSchoolReports);

