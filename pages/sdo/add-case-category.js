// SDO Case Management — Add Case Category
// Categories hang off a section (case_category.SectionID -> section.SectionID).
// The same api/get-case-section.php?action=sections payload used by the
// counselor case workflow is flattened here into one row per category for
// the section dropdown and the table below.
const CASE_SECTION_ENDPOINT = '../../api/get-case-section.php';

let caseSections = [];
let allCategories = [];
let categorySearchTerm = '';
let categoryCurrentPage = 1;
let categoriesPageSize = 10;

function initAddCaseCategoryPage() {
    initPage();
    loadCaseSections();

    document.getElementById('addCaseCategoryForm').addEventListener('submit', handleAddCaseCategory);

    document.getElementById('categorySearchInput').addEventListener('input', (e) => {
        categorySearchTerm = e.target.value.trim().toLowerCase();
        categoryCurrentPage = 1;
        renderCategories();
    });

    document.getElementById('categoriesPageSizeSelect').addEventListener('change', (e) => {
        categoriesPageSize = e.target.value === 'all' ? Infinity : parseInt(e.target.value, 10);
        categoryCurrentPage = 1;
        renderCategories();
    });

    document.getElementById('categoriesPagination').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-page]');
        if (!btn || btn.disabled) return;
        categoryCurrentPage += btn.dataset.page === 'next' ? 1 : -1;
        renderCategories();
    });
}

function loadCaseSections() {
    fetch(`${CASE_SECTION_ENDPOINT}?action=sections`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(result => {
            if (!result.success) throw new Error(result.message || 'Failed to load sections');

            caseSections = (result.sections || []).slice().sort((a, b) => a.SectionID - b.SectionID);
            renderSectionOptions();

            allCategories = [];
            caseSections.forEach(section => {
                (section.categories || []).forEach(cat => {
                    allCategories.push({
                        CaseId: cat.CaseId,
                        SectionID: section.SectionID,
                        SectionName: section.SectionName,
                        CategoryName: cat.CategoryName
                    });
                });
            });
            allCategories.sort((a, b) => (parseInt(a.CaseId, 10) || 0) - (parseInt(b.CaseId, 10) || 0));
            renderCategories();
        })
        .catch(error => {
            console.error('Error loading case categories:', error);
            document.getElementById('categoriesTableBody').innerHTML =
                `<tr><td colspan="3" class="no-accounts"><i class="bi bi-exclamation-triangle"></i> <p>Unable to load case categories</p></td></tr>`;
        });
}

function renderSectionOptions() {
    const select = document.getElementById('categorySectionSelect');
    const currentValue = select.value;
    select.innerHTML = '<option value="">Select a section</option>' +
        caseSections.map(s => `<option value="${s.SectionID}">${escapeHtml(s.SectionName)}</option>`).join('');
    if (currentValue) select.value = currentValue;
}

function handleAddCaseCategory(e) {
    e.preventDefault();

    const sectionSelect = document.getElementById('categorySectionSelect');
    const nameInput = document.getElementById('categoryNameInput');
    const sectionId = sectionSelect.value;
    const categoryName = nameInput.value.trim();

    if (!sectionId || !categoryName) return;

    const submitBtn = document.getElementById('addCaseCategorySubmitBtn');
    submitBtn.disabled = true;

    fetch(CASE_SECTION_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_case_category', sectionId, categoryName })
    })
        .then(response => response.json())
        .then(result => {
            if (!result.success) throw new Error(result.message || 'Failed to add case category');
            showAlert('Case category added successfully!', 'success');
            nameInput.value = '';
            loadCaseSections();
        })
        .catch(error => showAlert('Error: ' + error.message, 'error'))
        .finally(() => { submitBtn.disabled = false; });
}

function renderCategories() {
    const filtered = categorySearchTerm
        ? allCategories.filter(c =>
            String(c.CategoryName || '').toLowerCase().includes(categorySearchTerm) ||
            String(c.SectionName || '').toLowerCase().includes(categorySearchTerm))
        : allCategories;

    const totalPages = Math.max(1, Math.ceil(filtered.length / categoriesPageSize));
    if (categoryCurrentPage > totalPages) categoryCurrentPage = totalPages;
    if (categoryCurrentPage < 1) categoryCurrentPage = 1;

    const startIdx = categoriesPageSize === Infinity ? 0 : (categoryCurrentPage - 1) * categoriesPageSize;
    const endIdx = categoriesPageSize === Infinity ? filtered.length : Math.min(startIdx + categoriesPageSize, filtered.length);
    const pageRows = filtered.slice(startIdx, endIdx);

    const tbody = document.getElementById('categoriesTableBody');
    if (pageRows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="no-accounts"><i class="bi bi-inbox"></i> <p>No case categories found</p></td></tr>`;
    } else {
        tbody.innerHTML = pageRows.map((cat, i) => `
            <tr>
                <td>${startIdx + i + 1}</td>
                <td>${escapeHtml(cat.SectionName)}</td>
                <td><strong>${escapeHtml(cat.CategoryName)}</strong></td>
            </tr>
        `).join('');
    }

    renderCategoriesPagination(filtered.length, startIdx, endIdx, totalPages);
}

function renderCategoriesPagination(totalFiltered, startIdx, endIdx, totalPages) {
    const el = document.getElementById('categoriesPagination');

    if (totalFiltered === 0 || categoriesPageSize === Infinity || totalPages <= 1) {
        el.innerHTML = '';
        return;
    }

    el.innerHTML = `
        <button type="button" class="btn btn-secondary btn-sm" data-page="prev" ${categoryCurrentPage <= 1 ? 'disabled' : ''}>
            <i class="bi bi-chevron-left"></i> Prev
        </button>
        <span class="accounts-page-info">Showing ${startIdx + 1}&ndash;${endIdx} of ${totalFiltered} &middot; Page ${categoryCurrentPage} of ${totalPages}</span>
        <button type="button" class="btn btn-secondary btn-sm" data-page="next" ${categoryCurrentPage >= totalPages ? 'disabled' : ''}>
            Next <i class="bi bi-chevron-right"></i>
        </button>`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', initAddCaseCategoryPage);
