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
    "default": {
        "A. CAT / Learning Disability": { "7": {m: 1, f: 1}, "8": {m: 2, f: 1}, "9": {m: 1, f: 1}, "10": {m: 2, f: 1}, "11": {m: 1, f: 1}, "12": {m: 1, f: 0} },
        "B. Family Conflict / Broken Home": { "7": {m: 1, f: 0}, "8": {m: 1, f: 1}, "9": {m: 1, f: 1}, "10": {m: 1, f: 1}, "11": {m: 1, f: 1}, "12": {m: 0, f: 1} },
        "C. Bullying / Peer Pressure / Gang Related": { "7": {m: 1, f: 1}, "8": {m: 2, f: 1}, "9": {m: 1, f: 1}, "10": {m: 2, f: 1}, "11": {m: 1, f: 0}, "12": {m: 0, f: 0} },
        "D. LGBTQIA+ Concerns": { "7": {m: 0, f: 0}, "8": {m: 1, f: 0}, "9": {m: 0, f: 1}, "10": {m: 1, f: 0}, "11": {m: 1, f: 1}, "12": {m: 0, f: 1} },
        "E. Family-Related (Substance, Abuse, Neglect)": { "7": {m: 0, f: 1}, "8": {m: 1, f: 0}, "9": {m: 1, f: 0}, "10": {m: 1, f: 0}, "11": {m: 1, f: 0}, "12": {m: 0, f: 1} },
        "F. Poverty / Financial Hardship": { "7": {m: 0, f: 0}, "8": {m: 1, f: 0}, "9": {m: 0, f: 1}, "10": {m: 1, f: 0}, "11": {m: 0, f: 0}, "12": {m: 1, f: 0} },
        "G. Social / Emotional Issues": { "7": {m: 2, f: 1}, "8": {m: 1, f: 2}, "9": {m: 2, f: 1}, "10": {m: 2, f: 1}, "11": {m: 1, f: 1}, "12": {m: 1, f: 1} },
        "H. Physical / Mental Health": { "7": {m: 1, f: 0}, "8": {m: 1, f: 1}, "9": {m: 1, f: 0}, "10": {m: 1, f: 1}, "11": {m: 1, f: 0}, "12": {m: 1, f: 0} },
        "I. Special Needs / PWD": { "7": {m: 1, f: 0}, "8": {m: 0, f: 1}, "9": {m: 1, f: 0}, "10": {m: 0, f: 1}, "11": {m: 1, f: 0}, "12": {m: 0, f: 0} },
        "J. Underachievement / School Performance": { "7": {m: 2, f: 1}, "8": {m: 1, f: 2}, "9": {m: 2, f: 1}, "10": {m: 2, f: 2}, "11": {m: 1, f: 1}, "12": {m: 1, f: 1} },
        "K. Truancy / Absenteeism": { "7": {m: 1, f: 1}, "8": {m: 1, f: 0}, "9": {m: 1, f: 1}, "10": {m: 2, f: 1}, "11": {m: 1, f: 1}, "12": {m: 0, f: 1} },
        "L. Discipline / Conduct Issues": { "7": {m: 2, f: 0}, "8": {m: 1, f: 1}, "9": {m: 2, f: 1}, "10": {m: 1, f: 1}, "11": {m: 1, f: 1}, "12": {m: 1, f: 0} }
    }
};

let casesData = {};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
    loadCasesFromStorage();
    buildCasesTable();
    setupEventListeners();
});

function loadCasesFromStorage() {
    const stored = localStorage.getItem(`teacher_cases_default`);
    if (stored) {
        const newCases = JSON.parse(stored);
        // Merge stored cases into the data
        Object.keys(newCases).forEach(category => {
            Object.keys(newCases[category]).forEach(grade => {
                if (!allCasesData["default"][category]) {
                    allCasesData["default"][category] = { 
                        "7": {m: 0, f: 0}, "8": {m: 0, f: 0}, "9": {m: 0, f: 0}, 
                        "10": {m: 0, f: 0}, "11": {m: 0, f: 0}, "12": {m: 0, f: 0}
                    };
                }
                if (typeof newCases[category][grade] === 'object') {
                    allCasesData["default"][category][grade].m = (allCasesData["default"][category][grade].m || 0) + (newCases[category][grade].m || 0);
                    allCasesData["default"][category][grade].f = (allCasesData["default"][category][grade].f || 0) + (newCases[category][grade].f || 0);
                }
            });
        });
    }
    casesData = JSON.parse(JSON.stringify(allCasesData["default"] || {}));
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
        
        let htmlContent = `<td style="font-weight: 500;\">${category}</td>`;
        
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
    let totalM = 0, totalF = 0;
    for (let i = 7; i <= 12; i++) {
        totalM += gradeData[i]?.m || 0;
        totalF += gradeData[i]?.f || 0;
    }

    document.getElementById('caseId').value = `CASE-TEACHER-${Date.now()}`;
    document.getElementById('caseCategory').value = category;
    document.getElementById('caseGrade').value = 'Grades 7-12';
    document.getElementById('caseStatus').value = 'Active';
    document.getElementById('caseDate').value = new Date().toLocaleDateString();
    
    let notes = `Total Cases - Male: ${totalM}, Female: ${totalF}, Total: ${totalM + totalF}\n\n`;
    for (let grade = 7; grade <= 12; grade++) {
        const m = gradeData[grade]?.m || 0;
        const f = gradeData[grade]?.f || 0;
        notes += `Grade ${grade}: M=${m}, F=${f}, Total=${m+f}\n`;
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

    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportReport);

    // Filter button
    document.getElementById('filterBtn').addEventListener('click', () => {
        alert('Filter functionality to be implemented');
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        const caseModal = document.getElementById('caseModal');
        if (e.target === caseModal) caseModal.style.display = 'none';
    });
}

function exportReport() {
    let csv = 'Category of Cases,Grade 7 M,Grade 7 F,Grade 7 Total,Grade 8 M,Grade 8 F,Grade 8 Total,Grade 9 M,Grade 9 F,Grade 9 Total,Grade 10 M,Grade 10 F,Grade 10 Total,Grade 11 M,Grade 11 F,Grade 11 Total,Grade 12 M,Grade 12 F,Grade 12 Total,Total M,Total F,Total\n';

    caseCategories.forEach(category => {
        if (casesData[category]) {
            const gradeData = casesData[category];
            let totalM = 0, totalF = 0;
            let rowData = `"${category}"`;
            
            for (let i = 7; i <= 12; i++) {
                const m = gradeData[i]?.m || 0;
                const f = gradeData[i]?.f || 0;
                totalM += m;
                totalF += f;
                rowData += `,${m},${f},${m + f}`;
            }
            
            rowData += `,${totalM},${totalF},${totalM + totalF}`;
            csv += rowData + '\n';
        }
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teacher-cases-${new Date().toISOString().split('T')[0]}.csv`;
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
