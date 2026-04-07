// District Report Cases Data
const caseCategories = [
    'A. CAT',
    'Misbehavior / Truancy / Absenteeism / Unwarranted Group',
    'Smoking',
    'Drinking',
    'Drug Abuse',
    'Carrying Deadly Weapons',
    'Total A: CAT',
    'B. FAMILY: ADULTS',
    'Non-displaced',
    'Deprivation',
    'Family Conflict',
    'Suicide Completed',
    'Situational / MENTAL HEALTH',
    'Total B: MENTAL HEALTH',
    'C. BULLYING',
    'Physical',
    'Verbal',
    'Emotional',
    'Cyber',
    'Total C: BULLYING',
    'D. LGBTQIA ISSUES',
    'Underachievement',
    'Abuse/Neglect (Academic Performance)',
    'Conflict In Adapting to Environment',
    'Early Marriage',
    'Learning Disability',
    'Transfers or Changing Schools',
    'Total D: FAMILY RELATED',
    'E. Family-Related',
    'Family Problems',
    'Use of Illegal Drugs',
    'All Sorts of Alcohol/Drinks/Cannabis',
    'Overall TOTAL'
];

let currentDistrict = '1';
let allCasesData = {};

// Initialize district data
function initializeDistrictData() {
    for (let d = 1; d <= 11; d++) {
        const districtKey = `district${d}`;
        allCasesData[districtKey] = generateCaseData(d);
    }
    saveCasesData();
}

// Generate sample case data for a district
function generateCaseData(districtNum) {
    const data = {};
    caseCategories.forEach(category => {
        data[category] = {
            grade7: Math.floor(Math.random() * 5),
            grade8: Math.floor(Math.random() * 5),
            grade9: Math.floor(Math.random() * 6),
            grade10: Math.floor(Math.random() * 6),
            grade11: Math.floor(Math.random() * 5),
            grade12: Math.floor(Math.random() * 4),
            notes: ''
        };
    });
    return data;
}

// Save cases data to localStorage
function saveCasesData() {
    localStorage.setItem('districtCasesData', JSON.stringify(allCasesData));
}

// Load cases data from localStorage
function loadCasesData() {
    const saved = localStorage.getItem('districtCasesData');
    if (saved) {
        allCasesData = JSON.parse(saved);
    } else {
        initializeDistrictData();
    }
}

// Render cases table for selected district
function renderCasesTable() {
    const tableBody = document.getElementById('casesTableBody');
    tableBody.innerHTML = '';
    
    const districtData = allCasesData[`district${currentDistrict}`];
    
    caseCategories.forEach(category => {
        const rowData = districtData[category];
        const grade7 = rowData.grade7;
        const grade8 = rowData.grade8;
        const grade9 = rowData.grade9;
        const grade10 = rowData.grade10;
        const grade11 = rowData.grade11;
        const grade12 = rowData.grade12;
        const total = grade7 + grade8 + grade9 + grade10 + grade11 + grade12;
        
        const row = document.createElement('tr');
        
        // Highlight totals rows with different styling
        if (category.includes('Total')) {
            row.style.fontWeight = '700';
            row.style.backgroundColor = '#f1f5f9';
        }
        
        row.innerHTML = `
            <td><strong>${category}</strong></td>
            <td class="text-center">${grade7 > 0 ? `<span class="badge badge-in-progress">${grade7}</span>` : '0'}</td>
            <td class="text-center">${grade8 > 0 ? `<span class="badge badge-in-progress">${grade8}</span>` : '0'}</td>
            <td class="text-center">${grade9 > 0 ? `<span class="badge badge-in-progress">${grade9}</span>` : '0'}</td>
            <td class="text-center">${grade10 > 0 ? `<span class="badge badge-in-progress">${grade10}</span>` : '0'}</td>
            <td class="text-center">${grade11 > 0 ? `<span class="badge badge-in-progress">${grade11}</span>` : '0'}</td>
            <td class="text-center">${grade12 > 0 ? `<span class="badge badge-warning">${grade12}</span>` : '0'}</td>
            <td class="text-center"><strong style="color: #3b82f6; font-size: 16px;">${total}</strong></td>
        `;
        
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => showCaseDetails(category));
        tableBody.appendChild(row);
    });
}

// Show case details modal
function showCaseDetails(category) {
    const districtData = allCasesData[`district${currentDistrict}`];
    const caseData = districtData[category];
    
    if (caseData) {
        document.getElementById('caseId').value = `DIST${currentDistrict}-${category.substring(0, 3)}`;
        document.getElementById('caseCategory').value = category;
        document.getElementById('caseGrade').value = 'All Grades (7-12)';
        document.getElementById('caseStatus').value = 'Active';
        document.getElementById('caseDate').value = new Date().toLocaleDateString();
        document.getElementById('caseNotes').value = `Grade 7: ${caseData.grade7} | Grade 8: ${caseData.grade8} | Grade 9: ${caseData.grade9} | Grade 10: ${caseData.grade10} | Grade 11: ${caseData.grade11} | Grade 12: ${caseData.grade12}`;
        
        document.getElementById('caseModal').classList.add('show');
    }
}

// Set up event listeners
function setupEventListeners() {
    // District selection buttons
    document.querySelectorAll('.district-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.district-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentDistrict = this.getAttribute('data-district');
            renderCasesTable();
        });
    });
    
    // Modal close buttons
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('caseModal').classList.remove('show');
    });
    
    document.getElementById('closeCaseModal').addEventListener('click', () => {
        document.getElementById('caseModal').classList.remove('show');
    });
    
    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportReport);
    
    // Filter button
    document.getElementById('filterBtn').addEventListener('click', () => {
        alert('Filter functionality coming soon');
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Export report function
function exportReport() {
    const districtData = allCasesData[`district${currentDistrict}`];
    let csvContent = 'Category of Cases,Grade 7,Grade 8,Grade 9,Grade 10,Grade 11,Grade 12,Totals\n';
    
    caseCategories.forEach(category => {
        const data = districtData[category];
        const total = data.grade7 + data.grade8 + data.grade9 + data.grade10 + data.grade11 + data.grade12;
        csvContent += `"${category}",${data.grade7},${data.grade8},${data.grade9},${data.grade10},${data.grade11},${data.grade12},${total}\n`;
    });
    
    // Create download link
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', `District${currentDistrict}_ReportCases_${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    showAlert('success', 'Report exported successfully!');
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadCasesData();
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

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '../../index.php';
}
