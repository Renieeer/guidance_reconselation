// Report Case Script (Combined Coordinator & Counselor)

function initReportCase() {
    initPage();
    const form = document.getElementById('reportCaseForm');
    
    // Set today's date
    document.getElementById('reportDate').valueAsDate = new Date();
    
    form?.addEventListener('submit', handleReportSubmit);
    
    // Load and display case report
    loadCaseReport();
    
    // Export button
    document.getElementById('exportBtn')?.addEventListener('click', exportCaseReport);
    
    // Filter button
    document.getElementById('filterBtn')?.addEventListener('click', filterCaseReport);
}

function handleReportSubmit(e) {
    e.preventDefault();

    const caseReport = {
        id: 'CR-' + Date.now(),
        studentName: document.getElementById('studentName').value,
        studentId: document.getElementById('studentId').value,
        gradeLevel: parseInt(document.getElementById('gradeLevel').value),
        gender: document.getElementById('gender')?.value || 'Male',
        caseType: document.getElementById('caseType').value,
        description: document.getElementById('description').value,
        reportedBy: document.getElementById('reportedBy').value,
        reportDate: document.getElementById('reportDate').value,
        createdDate: new Date().toISOString(),
        status: 'Open'
    };

    // Save to local storage
    const cases = getData('cases') || [];
    cases.push(caseReport);
    saveData('cases', cases);

    alert('Case report submitted successfully!\nCase ID: ' + caseReport.id);
    document.getElementById('reportCaseForm').reset();
    document.getElementById('reportDate').valueAsDate = new Date();
    
    // Reload the report
    loadCaseReport();
}

function loadCaseReport() {
    const cases = getData('cases') || [];
    const categories = ['Academic Issue', 'Behavioral Issue', 'Emotional/Mental Health', 'Social Issue', 'Family Issue', 'Attendance Issue'];
    const grades = [7, 8, 9, 10, 11, 12];
    
    // Initialize report data structure
    const reportData = {};
    categories.forEach(cat => {
        reportData[cat] = {};
        grades.forEach(grade => {
            reportData[cat][grade] = { male: 0, female: 0 };
        });
    });
    
    // Count cases
    cases.forEach(caseItem => {
        const grade = caseItem.gradeLevel;
        const caseType = caseItem.caseType;
        const categoryMap = {
            'academic': 'Academic Issue',
            'behavioral': 'Behavioral Issue',
            'emotional': 'Emotional/Mental Health',
            'social': 'Social Issue',
            'family': 'Family Issue',
            'attendance': 'Attendance Issue'
        };
        
        const category = categoryMap[caseType] || 'Academic Issue';
        const gender = (caseItem.gender || 'Male').toLowerCase() === 'female' ? 'female' : 'male';
        
        if (grades.includes(grade) && reportData[category]) {
            reportData[category][grade][gender]++;
        }
    });
    
    // Update table
    updateReportTable(reportData);
}

function updateReportTable(reportData) {
    const tbody = document.getElementById('reportTableBody');
    const categories = ['Academic Issue', 'Behavioral Issue', 'Emotional/Mental Health', 'Social Issue', 'Family Issue', 'Attendance Issue'];
    const grades = [7, 8, 9, 10, 11, 12];
    
    tbody.innerHTML = categories.map(category => {
        let totalMale = 0, totalFemale = 0, totalAll = 0;
        
        let row = `<tr><td class="category-col">${category}</td>`;
        
        // For each grade
        grades.forEach(grade => {
            const male = reportData[category]?.[grade]?.male || 0;
            const female = reportData[category]?.[grade]?.female || 0;
            const total = male + female;
            
            totalMale += male;
            totalFemale += female;
            totalAll += total;
            
            row += `<td class="data-cell">${male}</td><td class="data-cell">${female}</td><td class="data-cell total">${total}</td>`;
        });
        
        // Totals column
        row += `<td class="data-cell">${totalMale}</td><td class="data-cell">${totalFemale}</td><td class="data-cell total">${totalAll}</td>`;
        row += '</tr>';
        
        return row;
    }).join('');
}

function exportCaseReport() {
    const cases = getData('cases') || [];
    const categories = ['Academic Issue', 'Behavioral Issue', 'Emotional/Mental Health', 'Social Issue', 'Family Issue', 'Attendance Issue'];
    const grades = [7, 8, 9, 10, 11, 12];
    
    // Build CSV content
    let csv = 'CATEGORY OF CASES,GRADE 7,,,,GRADE 8,,,,GRADE 9,,,,GRADE 10,,,,GRADE 11,,,,GRADE 12,,,,TOTALS,,,\n';
    csv += ',MALE,FEMALE,TOTAL,MALE,FEMALE,TOTAL,MALE,FEMALE,TOTAL,MALE,FEMALE,TOTAL,MALE,FEMALE,TOTAL,MALE,FEMALE,TOTAL,MALE,FEMALE,TOTAL\n';
    
    // Add data rows
    categories.forEach(category => {
        let row = category;
        let totalMale = 0, totalFemale = 0;
        
        grades.forEach(grade => {
            const categoryData = cases.filter(c => c.gradeLevel === grade && 
                                                   Object.values(c.caseType).toString().includes(category.split(' ')[0].toLowerCase()));
            const male = categoryData.filter(c => (c.gender || 'Male').toLowerCase() === 'male').length;
            const female = categoryData.filter(c => (c.gender || '').toLowerCase() === 'female').length;
            const total = male + female;
            
            row += `${male},${female},${total}`;
            totalMale += male;
            totalFemale += female;
            
            if (grade < 12) {
                row += ',';
            }
        });
        
        row += `${totalMale},${totalFemale},${totalMale + totalFemale}\n`;
        csv += row;
    });
    
    // Download CSV
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', 'case_report_' + new Date().toISOString().split('T')[0] + '.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function filterCaseReport() {
    // Placeholder for filter functionality
    alert('Filter functionality coming soon!');
}

// Logout functionality
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

