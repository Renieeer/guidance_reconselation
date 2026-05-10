<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Referrals Management - Guidance Management System (Other School)</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-other-school.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Page Hero -->
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-diagram-3"></i> Case Management</div>
                    <h2 class="page-hero-title">Referrals</h2>
                    <p class="page-hero-text">Track and manage student referrals from your school in the district guidance system.</p>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <!-- Filter Section -->
                <div class="content-section">
                    <div class="filter-controls">
                        <div class="filter-group">
                            <label for="filterStage">Filter by Stage:</label>
                            <select id="filterStage" class="form-control">
                                <option value="">All Stages</option>
                                <option value="1">Submitted</option>
                                <option value="2">Under Review</option>
                                <option value="3">Follow Up</option>
                                <option value="4">Counseling</option>
                                <option value="5">In Progress</option>
                                <option value="6">Closed</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="searchBox">Search:</label>
                            <input type="text" id="searchBox" class="form-control" placeholder="Search by student name or ID...">
                        </div>
                    </div>
                </div>

                <!-- Referrals Table -->
                <div class="content-section">
                    <h2>All Referrals</h2>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Student Name</th>
                                <th>Reason</th>
                                <th>Submitted By</th>
                                <th>Date Submitted</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="referralsBody">
                            <tr>
                                <td colspan="7" style="text-align: center; padding: 30px; color: #999;">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script src="../../js/utils.js"></script>
    <script src="../../js/auth.js"></script>
    <script src="referrals.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', loadReferrals);
    </script>
</body>
</html>
