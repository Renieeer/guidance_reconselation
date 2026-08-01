// Report Cases — real case-category x grade x gender counts, sourced from
// api/case-report.php (which aggregates the counselor's actual logged cases
// in counselor_case_scenarios). Categories/sections match the real
// case_category/section tables used by the counselor's case workflow.

const ALL_REPORT_GRADES = [7, 8, 9, 10, 11, 12];

let currentSchool = '';
let sections = [];
let counts = {};
let displayRows = [];

// Grades this account is allowed to see (e.g. a coordinator scoped to
// Grades 7-10, or all six if unassigned/no restriction).
let visibleGrades = ALL_REPORT_GRADES;

function computeVisibleGrades() {
    const scoped = gradeScopeToList(getCurrentGradeScope());
    return scoped.length ? scoped : ALL_REPORT_GRADES;
}

// Remove the header column-groups for any grade outside this account's
// scope (e.g. a Grade 7-10 coordinator never sees Grade 11/12 columns).
// Removed (not just hidden) so the remaining header/body columns stay
// aligned once buildCasesTable() only emits cells for visibleGrades.
function applyGradeColumnVisibility() {
    document.querySelectorAll('#reportCasesTable .grade-col').forEach(el => {
        const grade = parseInt(el.getAttribute('data-grade'), 10);
        if (!visibleGrades.includes(grade)) {
            el.remove();
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    initPage();

    const user = getCurrentUser();
    currentSchool = (user && user.school_attended) || '';

    visibleGrades = computeVisibleGrades();
    applyGradeColumnVisibility();

    await loadReportData();
    buildCasesTable();
    setupEventListeners();
});

async function loadReportData() {
    try {
        const gradeScope = getCurrentGradeScope();
        const url = `../../api/case-report.php?action=categories&school=${encodeURIComponent(currentSchool)}&grade_scope=${encodeURIComponent(gradeScope)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to load case report');
        }

        sections = data.sections || [];
        counts = data.counts || {};
    } catch (error) {
        console.error('Error loading case report:', error);
        sections = [];
        counts = {};
    }
}

function gradeCell(bucketKey, grade) {
    const bucket = counts[bucketKey];
    return (bucket && bucket[String(grade)]) || { m: 0, f: 0 };
}

// Flattens sections/categories/counts into one render-and-export-ready list:
// a header row per section, a row per real category, an "Uncategorized" row
// per section (cases whose category hasn't been chosen yet), a subtotal row
// per section, and a final grand-total row.
function buildDisplayRows() {
    const rows = [];
    const grandTotal = {};
    visibleGrades.forEach(g => { grandTotal[g] = { m: 0, f: 0 }; });

    sections.forEach(section => {
        rows.push({ type: 'header', label: `${section.sectionCode}. ${section.sectionName}` });

        const sectionTotal = {};
        visibleGrades.forEach(g => { sectionTotal[g] = { m: 0, f: 0 }; });

        const addToTotals = (bucketKey) => {
            visibleGrades.forEach(g => {
                const cell = gradeCell(bucketKey, g);
                sectionTotal[g].m += cell.m;
                sectionTotal[g].f += cell.f;
                grandTotal[g].m += cell.m;
                grandTotal[g].f += cell.f;
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
    visibleGrades.forEach(g => { totals[g] = gradeCell(row.bucketKey, g); });
    return totals;
}

function buildCasesTable() {
    const tbody = document.getElementById('casesTableBody');
    tbody.innerHTML = '';

    displayRows = buildDisplayRows();

    displayRows.forEach((row, index) => {
        const tr = document.createElement('tr');

        if (row.type === 'header') {
            const colCount = 1 + visibleGrades.length * 3;
            tr.innerHTML = `<td colspan="${colCount}" style="font-weight: 700; background: #e2e8f0;">${row.label}</td>`;
            tbody.appendChild(tr);
            return;
        }

        if (row.type === 'subtotal') {
            tr.style.fontWeight = '700';
            tr.style.backgroundColor = '#f1f5f9';
        }

        const totals = rowTotals(row);
        let html = `<td style="font-weight: 500;">${row.label}</td>`;

        visibleGrades.forEach(g => {
            const cell = totals[g] || { m: 0, f: 0 };
            const total = cell.m + cell.f;
            html += `<td class="text-center" style="font-size: 0.9em;">${cell.m}</td><td class="text-center" style="font-size: 0.9em;">${cell.f}</td><td class="text-center">${total > 0 ? `<span class="badge badge-in-progress">${total}</span>` : '0'}</td>`;
        });

        tr.innerHTML = html;

        if (row.type === 'category') {
            tr.style.cursor = 'pointer';
            tr.addEventListener('click', () => showCaseDetails(index));
        }

        tbody.appendChild(tr);
    });
}

function showCaseDetails(rowIndex) {
    const row = displayRows[rowIndex];
    if (!row) return;

    const modal = document.getElementById('caseModal');
    const totals = rowTotals(row);
    let total = 0;
    visibleGrades.forEach(g => {
        total += (totals[g]?.m || 0) + (totals[g]?.f || 0);
    });

    document.getElementById('caseId').value = `CASE-${(currentSchool || 'SCHOOL').toUpperCase().replace(/\s+/g, '-')}-${row.bucketKey || 'ROW'}`;
    document.getElementById('caseCategory').value = row.label;
    document.getElementById('caseGrade').value = `Grades ${visibleGrades[0]}-${visibleGrades[visibleGrades.length - 1]}`;
    document.getElementById('caseStatus').value = 'Active';
    document.getElementById('caseDate').value = new Date().toLocaleDateString();

    let notes = `Total Cases: ${total}\n\n`;
    visibleGrades.forEach(grade => {
        const m = totals[grade]?.m || 0;
        const f = totals[grade]?.f || 0;
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

// This quick-add form is a local note only — it doesn't have a real
// section/category selection (see the actual case workflow in
// pages/counselor/counseling.php for that), so it can't safely bump the
// real per-category counts above without corrupting them with a fake type.
function submitNewCase() {
    const title = document.getElementById('caseTitle').value;
    const type = document.getElementById('caseType').value;
    const description = document.getElementById('caseDescription').value;
    const severity = document.getElementById('severity').value;

    if (!title || !type || !description || !severity) {
        alert('Please fill in all required fields');
        return;
    }

    const newNote = {
        id: `NOTE-${(currentSchool || 'SCHOOL').toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`,
        title,
        type,
        description,
        severity,
        date: new Date().toLocaleDateString(),
        status: 'Active'
    };

    const storageKey = `coordinator_quick_notes_${currentSchool}`;
    const notes = JSON.parse(localStorage.getItem(storageKey) || '[]');
    notes.push(newNote);
    localStorage.setItem(storageKey, JSON.stringify(notes));

    document.getElementById('caseReportForm').reset();
    document.getElementById('newCaseModal').style.display = 'none';

    showNotification('Note saved. To log a real case with a category, use Case Management.');
}

function exportReport() {
    const header = ['Category of Cases', ...visibleGrades.map(g => `Grade ${g}`), 'Totals'];
    let csv = header.join(',') + '\n';

    displayRows.forEach(row => {
        if (row.type === 'header') {
            return;
        }
        const totals = rowTotals(row);
        const gradeTotals = visibleGrades.map(g => (totals[g]?.m || 0) + (totals[g]?.f || 0));
        const total = gradeTotals.reduce((sum, n) => sum + n, 0);
        csv += `"${row.label}",${gradeTotals.join(',')},${total}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coordinator-cases-${(currentSchool || 'school').replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
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
