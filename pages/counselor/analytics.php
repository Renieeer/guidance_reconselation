<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reports - Guidance Management System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-counselor.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Page Hero -->
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-bar-chart"></i> Reports</div>
                    <h2 class="page-hero-title">Reports Dashboard</h2>
                    <p class="page-hero-text">Generate and export counseling, appointment, referral, and student case reports for your school.</p>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <div class="tabs" id="reportTabs"></div>
                <div id="reportPanel"></div>
            </div>
        </div>
    </div>

    <script src="../../js/auth.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="analytics.js"></script>
</body>
</html>
