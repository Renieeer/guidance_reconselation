// Case Categories matching SDO system
const caseCategories = [
    "A. CAT / Learning Disability",
    "B. Family Conflict / Broken Home",
    "C. Bullying / Peer Pressure / Gang Related",
    "D. LGBTQIA+ Concerns",
    "E. Family-Related (Substance, Abuse, Neglect)",
    "F. Poverty / Financial Hardship",
    "G. Social / Emotional Issues",
    "H. Physical / Mental Health",
    "I. Special Needs / PWD",
    "J. Underachievement / School Performance",
    "K. Truancy / Absenteeism",
    "L. Discipline / Conduct Issues"
];

// All cases data organized by category and grade with gender breakdown
let allCasesData = {
    "school1": {
        "A. CAT / Learning Disability": { "7": {m: 2, f: 1}, "8": {m: 3, f: 2}, "9": {m: 1, f: 1}, "10": {m: 2, f: 2}, "11": {m: 2, f: 1}, "12": {m: 1, f: 0} },
        "B. Family Conflict / Broken Home": { "7": {m: 1, f: 1}, "8": {m: 2, f: 1}, "9": {m: 2, f: 2}, "10": {m: 1, f: 1}, "11": {m: 3, f: 2}, "12": {m: 1, f: 1} },
        "C. Bullying / Peer Pressure / Gang Related": { "7": {m: 2, f: 2}, "8": {m: 4, f: 2}, "9": {m: 2, f: 1}, "10": {m: 3, f: 2}, "11": {m: 1, f: 1}, "12": {m: 1, f: 0} },
        "D. LGBTQIA+ Concerns": { "7": {m: 1, f: 0}, "8": {m: 1, f: 1}, "9": {m: 1, f: 0}, "10": {m: 2, f: 1}, "11": {m: 2, f: 2}, "12": {m: 1, f: 1} },
        "E. Family-Related (Substance, Abuse, Neglect)": { "7": {m: 1, f: 1}, "8": {m: 1, f: 1}, "9": {m: 2, f: 1}, "10": {m: 1, f: 1}, "11": {m: 2, f: 1}, "12": {m: 1, f: 0} },
        "F. Poverty / Financial Hardship": { "7": {m: 0, f: 0}, "8": {m: 1, f: 0}, "9": {m: 1, f: 1}, "10": {m: 1, f: 0}, "11": {m: 1, f: 1}, "12": {m: 1, f: 0} },
        "G. Social / Emotional Issues": { "7": {m: 3, f: 2}, "8": {m: 2, f: 2}, "9": {m: 3, f: 3}, "10": {m: 3, f: 2}, "11": {m: 2, f: 2}, "12": {m: 1, f: 2} },
        "H. Physical / Mental Health": { "7": {m: 1, f: 0}, "8": {m: 1, f: 1}, "9": {m: 2, f: 1}, "10": {m: 2, f: 2}, "11": {m: 2, f: 1}, "12": {m: 1, f: 1} },
        "I. Special Needs / PWD": { "7": {m: 1, f: 1}, "8": {m: 1, f: 0}, "9": {m: 1, f: 1}, "10": {m: 1, f: 0}, "11": {m: 1, f: 0}, "12": {m: 0, f: 0} },
        "J. Underachievement / School Performance": { "7": {m: 2, f: 1}, "8": {m: 2, f: 2}, "9": {m: 3, f: 2}, "10": {m: 4, f: 2}, "11": {m: 2, f: 2}, "12": {m: 2, f: 1} },
        "K. Truancy / Absenteeism": { "7": {m: 1, f: 1}, "8": {m: 2, f: 1}, "9": {m: 2, f: 2}, "10": {m: 3, f: 2}, "11": {m: 2, f: 1}, "12": {m: 1, f: 1} },
        "L. Discipline / Conduct Issues": { "7": {m: 2, f: 2}, "8": {m: 3, f: 2}, "9": {m: 4, f: 2}, "10": {m: 2, f: 2}, "11": {m: 2, f: 1}, "12": {m: 1, f: 1} }
    },
    "school2": {
        "A. CAT / Learning Disability": { "7": {m: 1, f: 1}, "8": {m: 2, f: 2}, "9": {m: 2, f: 1}, "10": {m: 1, f: 1}, "11": {m: 1, f: 1}, "12": {m: 1, f: 0} },
        "B. Family Conflict / Broken Home": { "7": {m: 1, f: 0}, "8": {m: 1, f: 1}, "9": {m: 2, f: 1}, "10": {m: 1, f: 0}, "11": {m: 2, f: 2}, "12": {m: 1, f: 0} },
        "C. Bullying / Peer Pressure / Gang Related": { "7": {m: 2, f: 1}, "8": {m: 2, f: 2}, "9": {m: 1, f: 1}, "10": {m: 2, f: 2}, "11": {m: 1, f: 0}, "12": {m: 1, f: 0} },
        "D. LGBTQIA+ Concerns": { "7": {m: 0, f: 0}, "8": {m: 1, f: 0}, "9": {m: 1, f: 0}, "10": {m: 1, f: 1}, "11": {m: 2, f: 1}, "12": {m: 1, f: 0} },
        "E. Family-Related (Substance, Abuse, Neglect)": { "7": {m: 1, f: 0}, "8": {m: 1, f: 0}, "9": {m: 1, f: 1}, "10": {m: 1, f: 0}, "11": {m: 1, f: 1}, "12": {m: 1, f: 0} },
        "F. Poverty / Financial Hardship": { "7": {m: 1, f: 0}, "8": {m: 1, f: 1}, "9": {m: 1, f: 0}, "10": {m: 1, f: 1}, "11": {m: 1, f: 0}, "12": {m: 1, f: 0} },
        "G. Social / Emotional Issues": { "7": {m: 2, f: 2}, "8": {m: 2, f: 1}, "9": {m: 3, f: 2}, "10": {m: 2, f: 2}, "11": {m: 2, f: 1}, "12": {m: 1, f: 1} },
        "H. Physical / Mental Health": { "7": {m: 1, f: 1}, "8": {m: 1, f: 0}, "9": {m: 1, f: 1}, "10": {m: 2, f: 1}, "11": {m: 1, f: 1}, "12": {m: 1, f: 0} },
        "I. Special Needs / PWD": { "7": {m: 1, f: 0}, "8": {m: 1, f: 1}, "9": {m: 1, f: 0}, "10": {m: 1, f: 0}, "11": {m: 1, f: 0}, "12": {m: 0, f: 0} },
        "J. Underachievement / School Performance": { "7": {m: 1, f: 1}, "8": {m: 2, f: 1}, "9": {m: 2, f: 2}, "10": {m: 3, f: 2}, "11": {m: 2, f: 1}, "12": {m: 1, f: 1} },
        "K. Truancy / Absenteeism": { "7": {m: 1, f: 0}, "8": {m: 1, f: 1}, "9": {m: 2, f: 1}, "10": {m: 2, f: 2}, "11": {m: 1, f: 1}, "12": {m: 1, f: 0} },
        "L. Discipline / Conduct Issues": { "7": {m: 2, f: 1}, "8": {m: 2, f: 2}, "9": {m: 3, f: 2}, "10": {m: 2, f: 1}, "11": {m: 1, f: 1}, "12": {m: 1, f: 0} }
    },
    "school3": {
        "A. CAT / Learning Disability": { "7": {m: 1, f: 0}, "8": {m: 2, f: 1}, "9": {m: 1, f: 1}, "10": {m: 2, f: 1}, "11": {m: 1, f: 0}, "12": {m: 0, f: 0} },
        "B. Family Conflict / Broken Home": { "7": {m: 1, f: 0}, "8": {m: 1, f: 0}, "9": {m: 1, f: 1}, "10": {m: 1, f: 1}, "11": {m: 2, f: 1}, "12": {m: 1, f: 0} },
        "C. Bullying / Peer Pressure / Gang Related": { "7": {m: 1, f: 1}, "8": {m: 2, f: 1}, "9": {m: 1, f: 0}, "10": {m: 2, f: 1}, "11": {m: 1, f: 0}, "12": {m: 0, f: 0} },
        "D. LGBTQIA+ Concerns": { "7": {m: 0, f: 0}, "8": {m: 1, f: 0}, "9": {m: 0, f: 0}, "10": {m: 1, f: 0}, "11": {m: 1, f: 1}, "12": {m: 1, f: 0} },
        "E. Family-Related (Substance, Abuse, Neglect)": { "7": {m: 0, f: 0}, "8": {m: 1, f: 0}, "9": {m: 1, f: 0}, "10": {m: 1, f: 0}, "11": {m: 1, f: 0}, "12": {m: 0, f: 0} },
        "F. Poverty / Financial Hardship": { "7": {m: 1, f: 0}, "8": {m: 1, f: 0}, "9": {m: 1, f: 0}, "10": {m: 1, f: 0}, "11": {m: 1, f: 0}, "12": {m: 1, f: 0} },
        "G. Social / Emotional Issues": { "7": {m: 2, f: 1}, "8": {m: 1, f: 1}, "9": {m: 2, f: 2}, "10": {m: 2, f: 1}, "11": {m: 1, f: 1}, "12": {m: 1, f: 0} },
        "H. Physical / Mental Health": { "7": {m: 1, f: 0}, "8": {m: 1, f: 0}, "9": {m: 1, f: 0}, "10": {m: 1, f: 1}, "11": {m: 1, f: 0}, "12": {m: 1, f: 0} },
        "I. Special Needs / PWD": { "7": {m: 1, f: 0}, "8": {m: 1, f: 0}, "9": {m: 1, f: 0}, "10": {m: 0, f: 0}, "11": {m: 1, f: 0}, "12": {m: 0, f: 0} },
        "J. Underachievement / School Performance": { "7": {m: 1, f: 1}, "8": {m: 1, f: 1}, "9": {m: 2, f: 1}, "10": {m: 2, f: 2}, "11": {m: 1, f: 1}, "12": {m: 1, f: 0} },
        "K. Truancy / Absenteeism": { "7": {m: 1, f: 0}, "8": {m: 1, f: 0}, "9": {m: 1, f: 1}, "10": {m: 2, f: 1}, "11": {m: 1, f: 0}, "12": {m: 1, f: 0} },
        "L. Discipline / Conduct Issues": { "7": {m: 1, f: 1}, "8": {m: 2, f: 1}, "9": {m: 2, f: 2}, "10": {m: 1, f: 1}, "11": {m: 1, f: 0}, "12": {m: 1, f: 0} }
    }
};

let currentSchool = "school1";
let casesData = {};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeCoordinator();
    loadUserInfo();
    loadCasesFromStorage();
    buildCasesTable();
    setupEventListeners();
});

function initializeCoordinator() {
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (userData && userData.coordinatorSchools) {
        // Could be multiple schools; for demo, use first
        const schools = userData.coordinatorSchools.split(',');
        currentSchool = schools[0].toLowerCase().replace(/\s+/g, '');
    }
}

function loadCasesFromStorage() {
    const stored = localStorage.getItem(`coordinator_cases_${currentSchool}`);
    if (stored) {
        const newCases = JSON.parse(stored);
        // Merge stored cases into the data
        Object.keys(newCases).forEach(category => {
            Object.keys(newCases[category]).forEach(grade => {
                if (!allCasesData[currentSchool][category]) {
                    allCasesData[currentSchool][category] = { "7": 0, "8": 0, "9": 0, "10": 0, "11": 0, "12": 0 };
                }
                allCasesData[currentSchool][category][grade] = (allCasesData[currentSchool][category][grade] || 0) + newCases[category][grade];
            });
        });
    }
    casesData = JSON.parse(JSON.stringify(allCasesData[currentSchool] || {}));
}

function buildCasesTable() {
    const tbody = document.getElementById('casesTableBody');
    tbody.innerHTML = '';

    caseCategories.forEach(category => {
        if (!casesData[category]) {
            casesData[category] = {
                "7": {m: 0, f: 0}, "8": {m: 0, f: 0}, "9": {m: 0, f: 0}, 
                "10": {m: 0, f: 0}, "11": {m: 0, f: 0}, "12": {m: 0, f: 0}
            };
        }

        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        
        const gradeData = casesData[category];
        let grandTotalM = 0, grandTotalF = 0;
        
        let htmlContent = `<td style="font-weight: 500;">${category}</td>`;
        
        for (let i = 7; i <= 12; i++) {
            const m = gradeData[i]?.m || 0;
            const f = gradeData[i]?.f || 0;
            const total = m + f;
            grandTotalM += m;
            grandTotalF += f;
            htmlContent += `<td class="text-center" style="font-size: 0.9em;">${m}</td><td class="text-center" style="font-size: 0.9em;">${f}</td><td class="text-center" style="font-weight: 600;">${total}</td>`;
        }
        
        htmlContent += `<td class="text-center" style="font-size: 0.9em;">${grandTotalM}</td><td class="text-center" style="font-size: 0.9em;">${grandTotalF}</td><td class="text-center" style="font-weight: 600;">${grandTotalM + grandTotalF}</td>`;
        row.innerHTML = htmlContent;

        row.addEventListener('click', () => showCaseDetails(category));
        tbody.appendChild(row);
    });
}

function showCaseDetails(category) {
    const modal = document.getElementById('caseModal');
    const gradeData = casesData[category];
    let total = 0;
    for (let i = 7; i <= 12; i++) {
        total += parseInt(gradeData[i] || 0);
    }

    document.getElementById('caseId').value = `CASE-${currentSchool.toUpperCase()}-${Date.now()}`;
    document.getElementById('caseCategory').value = category;
    document.getElementById('caseGrade').value = 'Grades 7-12';
    document.getElementById('caseStatus').value = 'Active';
    document.getElementById('caseDate').value = new Date().toLocaleDateString();
    
    let notes = `Total Cases: ${total}\n\n`;
    for (let grade = 7; grade <= 12; grade++) {
        notes += `Grade ${grade}: ${gradeData[grade] || 0} cases\n`;
    }
    document.getElementById('caseNotes').value = notes;

    modal.style.display = 'flex';
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

    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportReport);

    // Filter button
    document.getElementById('filterBtn').addEventListener('click', () => {
        alert('Filter functionality to be implemented');
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        const caseModal = document.getElementById('caseModal');
        const newCaseModal = document.getElementById('newCaseModal');
        if (e.target === caseModal) caseModal.style.display = 'none';
        if (e.target === newCaseModal) newCaseModal.style.display = 'none';
    });
}

function submitNewCase() {
    const title = document.getElementById('caseTitle').value;
    const type = document.getElementById('caseType').value;
    const description = document.getElementById('caseDescription').value;
    const severity = document.getElementById('severity').value;

    if (!title || !type || !description || !severity) {
        alert('Please fill in all required fields');
        return;
    }

    // Store the new case
    const newCase = {
        id: `CASE-${currentSchool.toUpperCase()}-${Date.now()}`,
        title: title,
        type: type,
        description: description,
        severity: severity,
        date: new Date().toLocaleDateString(),
        status: 'Active'
    };

    let casesList = JSON.parse(localStorage.getItem(`coordinator_cases_list_${currentSchool}`) || '[]');
    casesList.push(newCase);
    localStorage.setItem(`coordinator_cases_list_${currentSchool}`, JSON.stringify(casesList));

    // Update the table data
    if (!casesData[type]) {
        casesData[type] = { "7": 0, "8": 0, "9": 0, "10": 0, "11": 0, "12": 0 };
    }
    casesData[type]["7"]++;

    buildCasesTable();
    document.getElementById('caseReportForm').reset();
    document.getElementById('newCaseModal').style.display = 'none';
    
    showNotification('Case report submitted successfully!');
}

function exportReport() {
    let csv = 'Category of Cases,Grade 7,Grade 8,Grade 9,Grade 10,Grade 11,Grade 12,Totals\n';

    caseCategories.forEach(category => {
        if (casesData[category]) {
            const gradeData = casesData[category];
            let total = 0;
            for (let i = 7; i <= 12; i++) {
                total += parseInt(gradeData[i] || 0);
            }

            csv += `"${category}",${gradeData[7] || 0},${gradeData[8] || 0},${gradeData[9] || 0},${gradeData[10] || 0},${gradeData[11] || 0},${gradeData[12] || 0},${total}\n`;
        }
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coordinator-cases-${currentSchool}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
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
