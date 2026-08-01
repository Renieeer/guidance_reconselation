// Case Categories matching SDO system
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

const REPORT_GRADE_MAX = { 7: 5, 8: 5, 9: 6, 10: 6, 11: 5, 12: 4 };

// Generate sample case data (male/female per grade)
function generateCaseData() {
    const data = {};
    caseCategories.forEach(category => {
        data[category] = {};
        ALL_REPORT_GRADES.forEach(grade => {
            const total = Math.floor(Math.random() * REPORT_GRADE_MAX[grade]);
            const male = Math.floor(Math.random() * (total + 1));
            data[category][grade] = { m: male, f: total - male };
        });
    });
    return data;
}

// All cases data organized by category and grade with gender breakdown.
// Generated once per browser and cached in localStorage so the demo
// numbers stay stable across reloads instead of reshuffling every visit.
let allCasesData = {};

function loadOrGenerateAllCasesData() {
    const stored = localStorage.getItem('otherschool_base_cases_data');
    const parsed = stored ? JSON.parse(stored) : null;
    const isCurrentShape = parsed?.default?.['A. CAT']?.['7']?.m !== undefined;

    if (parsed && isCurrentShape) {
        allCasesData = parsed;
    } else {
        allCasesData = { default: generateCaseData() };
        localStorage.setItem('otherschool_base_cases_data', JSON.stringify(allCasesData));
    }
}

let casesData = {};

// Grades this account is allowed to see (e.g. a counselor scoped to
// Grade 7 only, or all six if unassigned/no restriction).
const ALL_REPORT_GRADES = [7, 8, 9, 10, 11, 12];
let visibleGrades = ALL_REPORT_GRADES;

function computeVisibleGrades() {
    const scoped = gradeScopeToList(getCurrentGradeScope());
    return scoped.length ? scoped : ALL_REPORT_GRADES;
}

// Remove the header column-groups for any grade outside this account's
// scope. Removed (not just hidden) so the remaining header/body columns
// stay aligned once buildCasesTable() only emits cells for visibleGrades.
function applyGradeColumnVisibility() {
    document.querySelectorAll('#reportCasesTable .grade-col').forEach(el => {
        const grade = parseInt(el.getAttribute('data-grade'), 10);
        if (!visibleGrades.includes(grade)) {
            el.remove();
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setUserInfo();
    visibleGrades = computeVisibleGrades();
    applyGradeColumnVisibility();
    loadOrGenerateAllCasesData();
    loadCasesFromStorage();
    buildCasesTable();
    setupEventListeners();
});

function loadCasesFromStorage() {
    const stored = localStorage.getItem(`otherschool_cases_default`);
    if (stored) {
        const newCases = JSON.parse(stored);
        // Merge stored cases into the data
        Object.keys(newCases).forEach(category => {
            Object.keys(newCases[category]).forEach(grade => {
                if (!allCasesData["default"][category]) {
                    allCasesData["default"][category] = { "7": 0, "8": 0, "9": 0, "10": 0, "11": 0, "12": 0 };
                }
                allCasesData["default"][category][grade] = (allCasesData["default"][category][grade] || 0) + newCases[category][grade];
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

        // Highlight subtotal/overall rows the same way the SDO district
        // report does, so the grouped category headings stand out.
        if (category.includes('Total')) {
            row.style.fontWeight = '700';
            row.style.backgroundColor = '#f1f5f9';
        }

        const gradeData = casesData[category];

        let htmlContent = `<td style="font-weight: 500;">${category}</td>`;

        visibleGrades.forEach(i => {
            const m = gradeData[i]?.m || 0;
            const f = gradeData[i]?.f || 0;
            const total = m + f;
            htmlContent += `<td class="text-center" style="font-size: 0.9em;">${m}</td><td class="text-center" style="font-size: 0.9em;">${f}</td><td class="text-center">${total > 0 ? `<span class="badge badge-in-progress">${total}</span>` : '0'}</td>`;
        });

        row.innerHTML = htmlContent;

        row.addEventListener('click', () => showCaseDetails(category));
        tbody.appendChild(row);
    });
}

function showCaseDetails(category) {
    const modal = document.getElementById('caseModal');
    const gradeData = casesData[category];
    let total = 0;
    visibleGrades.forEach(i => {
        total += (gradeData[i]?.m || 0) + (gradeData[i]?.f || 0);
    });

    document.getElementById('caseId').value = `CASE-COU-${Date.now()}`;
    document.getElementById('caseCategory').value = category;
    document.getElementById('caseGrade').value = `Grades ${visibleGrades[0]}-${visibleGrades[visibleGrades.length - 1]}`;
    document.getElementById('caseStatus').value = 'Active';
    document.getElementById('caseDate').value = new Date().toLocaleDateString();

    let notes = `Total Cases: ${total}\n\n`;
    visibleGrades.forEach(grade => {
        const m = gradeData[grade]?.m || 0;
        const f = gradeData[grade]?.f || 0;
        notes += `Grade ${grade}: ${m + f} (M: ${m} / F: ${f})\n`;
    });
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
        id: `CASE-COU-${Date.now()}`,
        title: title,
        type: type,
        description: description,
        severity: severity,
        date: new Date().toLocaleDateString(),
        status: 'Active'
    };

    let casesList = JSON.parse(localStorage.getItem(`otherschool_cases_list_default`) || '[]');
    casesList.push(newCase);
    localStorage.setItem(`otherschool_cases_list_default`, JSON.stringify(casesList));

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
    const header = ['Category of Cases', ...visibleGrades.map(g => `Grade ${g}`), 'Totals'];
    let csv = header.join(',') + '\n';

    caseCategories.forEach(category => {
        if (casesData[category]) {
            const gradeData = casesData[category];
            const gradeTotals = visibleGrades.map(g => (gradeData[g]?.m || 0) + (gradeData[g]?.f || 0));
            const total = gradeTotals.reduce((sum, n) => sum + n, 0);

            csv += `"${category}",${gradeTotals.join(',')},${total}\n`;
        }
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `counselor-cases-${new Date().toISOString().split('T')[0]}.csv`;
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

