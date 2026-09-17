<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Case Category - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css?v=<?php echo filemtime(__DIR__ . '/../../css/style.css'); ?>">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <?php include '../../includes/sidebar-sdo.php'; ?>

        <div class="main-content">
            <!-- Page Hero -->
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-folder2-open"></i> Case Management</div>
                    <h2 class="page-hero-title">Add Case Category</h2>
                    <p class="page-hero-text">Create new case categories under a section and manage the ones already in the system.</p>
                </div>
            </div>

            <div class="page-content">
                <!-- Add Case Category Form -->
                <div class="card mb-5">
                    <div class="card-header">
                        <h2 class="card-title mb-0">New Case Category</h2>
                    </div>
                    <form id="addCaseCategoryForm" style="padding: 20px;">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="categorySectionSelect">Section</label>
                                <select id="categorySectionSelect" required>
                                    <option value="">Select a section</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="categoryNameInput">Category Name</label>
                                <input type="text" id="categoryNameInput" placeholder="e.g. Truancy" required autocomplete="off">
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary" id="addCaseCategorySubmitBtn">
                                <i class="bi bi-plus-lg"></i> Add Case Category
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Case Categories Table -->
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title mb-0">All Case Categories</h2>
                    </div>

                    <div class="table-toolbar">
                        <label>
                            Show
                            <select id="categoriesPageSizeSelect">
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="all">All</option>
                            </select>
                            entries
                        </label>
                        <label>
                            Search:
                            <input type="text" id="categorySearchInput" placeholder="Search category or section...">
                        </label>
                    </div>

                    <div class="account-table-container">
                        <table class="accounts-table" id="categoriesTable">
                            <thead>
                                <tr>
                                    <th style="width: 80px;">#</th>
                                    <th>Section</th>
                                    <th>Category Name</th>
                                </tr>
                            </thead>
                            <tbody id="categoriesTableBody">
                                <tr>
                                    <td colspan="3" class="no-accounts">
                                        <i class="bi bi-hourglass-split" style="font-size: 24px; margin-bottom: 10px;"></i>
                                        <p>Loading case categories...</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div id="categoriesPagination" class="accounts-pagination"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="add-case-category.js?v=<?php echo filemtime(__DIR__ . '/add-case-category.js'); ?>"></script>
</body>
</html>
