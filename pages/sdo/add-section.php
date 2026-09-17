<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Section - Guidance Management System</title>
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
                    <h2 class="page-hero-title">Add Section</h2>
                    <p class="page-hero-text">Create new case sections and manage the ones already in the system.</p>
                </div>
            </div>

            <div class="page-content">
                <!-- Add Section Form -->
                <div class="card mb-5">
                    <div class="card-header">
                        <h2 class="card-title mb-0">New Section</h2>
                    </div>
                    <form id="addSectionForm" style="padding: 20px;">
                        <div class="form-group">
                            <label for="sectionNameInput">Section Name</label>
                            <input type="text" id="sectionNameInput" placeholder="e.g. Poor Study Habits" required autocomplete="off">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary" id="addSectionSubmitBtn">
                                <i class="bi bi-plus-lg"></i> Add Section
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Sections Table -->
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title mb-0">All Sections</h2>
                    </div>

                    <div class="table-toolbar">
                        <label>
                            Show
                            <select id="sectionsPageSizeSelect">
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="all">All</option>
                            </select>
                            entries
                        </label>
                        <label>
                            Search:
                            <input type="text" id="sectionSearchInput" placeholder="Search section name...">
                        </label>
                    </div>

                    <div class="account-table-container">
                        <table class="accounts-table" id="sectionsTable">
                            <thead>
                                <tr>
                                    <th style="width: 80px;">#</th>
                                    <th>Section Name</th>
                                    <th style="width: 100px;" class="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody id="sectionsTableBody">
                                <tr>
                                    <td colspan="3" class="no-accounts">
                                        <i class="bi bi-hourglass-split" style="font-size: 24px; margin-bottom: 10px;"></i>
                                        <p>Loading sections...</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div id="sectionsPagination" class="accounts-pagination"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Section Modal -->
    <div id="editSectionModal" class="modal">
        <div class="modal-content" style="max-width: 480px;">
            <div class="modal-header">
                <h2>Edit Section</h2>
                <span class="modal-close" onclick="closeEditSectionModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="editSectionForm">
                    <input type="hidden" id="editSectionId">
                    <div class="form-group">
                        <label for="editSectionNameInput">Section Name</label>
                        <input type="text" id="editSectionNameInput" required autocomplete="off">
                    </div>
                    <div class="form-actions" style="margin-top: 20px;">
                        <button type="submit" class="btn btn-success">Save Changes</button>
                        <button type="button" class="btn btn-secondary" onclick="closeEditSectionModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="add-section.js?v=<?php echo filemtime(__DIR__ . '/add-section.js'); ?>"></script>
</body>
</html>
