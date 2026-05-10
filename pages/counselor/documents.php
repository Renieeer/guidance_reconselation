<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Documents - Guidance System</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
    <style>
        .document-container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .search-section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: var(--shadow);
            margin-bottom: 24px;
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }

        .search-input {
            flex: 1;
            min-width: 200px;
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            font-family: inherit;
        }

        .search-btn {
            background: #3b82f6;
            color: white;
            padding: 10px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: var(--transition);
        }

        .search-btn:hover {
            background: #2563eb;
        }

        .documents-section {
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: var(--shadow);
        }

        .documents-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }

        .documents-table th {
            background: #f1f5f9;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: var(--primary-color);
            border-bottom: 2px solid #e2e8f0;
            font-size: 13px;
            text-transform: uppercase;
        }

        .documents-table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
        }

        .documents-table tr:hover {
            background: #f8fafc;
        }

        .doc-type-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .badge-inventory {
            background: #dbeafe;
            color: #1e40af;
        }

        .badge-referral {
            background: #fce7f3;
            color: #be185d;
        }

        .badge-follow-up {
            background: #dbeafe;
            color: #0369a1;
        }

        .badge-case {
            background: #fecdd3;
            color: #7c1c2f;
        }

        .action-buttons {
            display: flex;
            gap: 8px;
        }

        .action-btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: var(--transition);
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }

        .btn-view {
            background: #e0f2fe;
            color: #0369a1;
        }

        .btn-view:hover {
            background: #bae6fd;
        }

        .btn-delete {
            background: #fee2e2;
            color: #dc2626;
        }

        .btn-delete:hover {
            background: #fecaca;
        }

        .empty-state {
            text-align: center;
            padding: 48px 24px;
            color: #94a3b8;
        }

        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
        }

        .modal.show {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-content {
            background: white;
            padding: 0;
            border-radius: 8px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow: auto;
        }

        .modal-header {
            padding: 20px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #64748b;
        }

        .modal-body {
            padding: 20px;
            text-align: center;
        }

        .modal-body img {
            max-width: 100%;
            max-height: 80vh;
            object-fit: contain;
        }

        @media (max-width: 768px) {
            .search-section {
                flex-direction: column;
            }

            .documents-table {
                font-size: 12px;
            }

            .documents-table th,
            .documents-table td {
                padding: 8px;
            }

            .action-buttons {
                flex-direction: column;
            }

            .action-btn {
                width: 100%;
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-counselor.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Page Hero -->
            <div class="page-hero">
                <div>
                    <div class="page-hero-eyebrow"><i class="bi bi-folder-check"></i> Resources</div>
                    <h2 class="page-hero-title">Document Library</h2>
                    <p class="page-hero-text">Access guidance documents, forms, and resources for counseling activities.</p>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <div class="document-container">
                    <!-- Search Section -->
                    <div class="search-section">
                        <input type="text" id="studentSearch" class="search-input" placeholder="Search by Student ID or Name...">
                        <button class="search-btn" onclick="searchDocuments()">
                            <i class="fas fa-search"></i> Search
                        </button>
                    </div>

                    <!-- Documents Section -->
                    <div class="documents-section">
                        <h3><i class="fas fa-folder"></i> Documents</h3>
                        <table class="documents-table" id="documentsTable">
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Document Type</th>
                                    <th>File Name</th>
                                    <th>Uploaded</th>
                                    <th>Size</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="tableBody">
                                <tr>
                                    <td colspan="6" class="empty-state">
                                        <i class="fas fa-inbox" style="font-size: 24px; margin-bottom: 8px;"></i>
                                        <p>Search for a student to view their documents</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Image Preview Modal -->
    <div id="previewModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h4>Document Preview</h4>
                <button class="modal-close" onclick="closePreview()">&times;</button>
            </div>
            <div class="modal-body">
                <img id="previewImage" src="" alt="Document preview">
            </div>
        </div>
    </div>

    <script src="../../js/utils.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            setupUserInfo();
            document.getElementById('logoutBtn').addEventListener('click', logout);
        });

        function setupUserInfo() {
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}') || JSON.parse(sessionStorage.getItem('user') || '{}');
            const userName = user.name || sessionStorage.getItem('userName');
            const userRole = user.role || sessionStorage.getItem('userRole');
            const userNameElement = document.getElementById('userName');
            const userRoleElement = document.getElementById('userRole');
            const userAvatar = document.getElementById('userAvatar');

            if (userName) {
                userNameElement.textContent = userName;
                if (userRoleElement) {
                    userRoleElement.textContent = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1).replace('-', ' ') : 'Counselor';
                }
                const initials = userName.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
                if (userAvatar) userAvatar.textContent = initials;
            }
        }

        async function searchDocuments() {
            const studentId = document.getElementById('studentSearch').value.trim();

            if (!studentId) {
                showNotification('Please enter a Student ID', 'error');
                return;
            }

            const userType = sessionStorage.getItem('userType');
            const schoolAttended = sessionStorage.getItem('schoolAttended');

            try {
                const response = await fetch(`../../api/list-documents.php?student_id=${studentId}&user_type=${userType}&school_attended=${schoolAttended}`);
                const data = await response.json();

                if (data.success && data.documents.length > 0) {
                    displayDocuments(data.documents);
                } else {
                    showNotification('No documents found for this student', 'info');
                    clearTable();
                }
            } catch (error) {
                showNotification('Error: ' + error.message, 'error');
            }
        }

        function displayDocuments(documents) {
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = '';

            const docTypeLabels = {
                'inventory': 'Individual Inventory',
                'referral': 'Referral Form',
                'follow-up': 'Follow-up Form',
                'case': 'Case Document'
            };

            documents.forEach(doc => {
                const uploadDate = new Date(doc.uploaded_at).toLocaleDateString();
                const sizeKB = (doc.file_size / 1024).toFixed(2);
                const docType = docTypeLabels[doc.document_type] || doc.document_type;
                const badgeClass = `badge-${doc.document_type}`;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${doc.student_id}</strong></td>
                    <td><span class="doc-type-badge ${badgeClass}">${docType}</span></td>
                    <td>${doc.original_filename}</td>
                    <td>${uploadDate}</td>
                    <td>${sizeKB} KB</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn btn-view" onclick="viewDocument(${doc.document_id})">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="action-btn btn-delete" onclick="deleteDocument(${doc.document_id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        function clearTable() {
            document.getElementById('tableBody').innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-inbox" style="font-size: 24px; margin-bottom: 8px;"></i>
                        <p>No documents found</p>
                    </td>
                </tr>
            `;
        }

        function viewDocument(documentId) {
            const userType = sessionStorage.getItem('userType');
            const schoolAttended = sessionStorage.getItem('schoolAttended');

            const imageUrl = `../../api/download-document.php?document_id=${documentId}&user_type=${userType}&school_attended=${schoolAttended}&user_id=${sessionStorage.getItem('userId') || 0}`;
            
            document.getElementById('previewImage').src = imageUrl;
            document.getElementById('previewModal').classList.add('show');
        }

        function closePreview() {
            document.getElementById('previewModal').classList.remove('show');
        }

        async function deleteDocument(documentId) {
            if (!confirm('Are you sure you want to delete this document?')) {
                return;
            }

            const userType = sessionStorage.getItem('userType');
            const schoolAttended = sessionStorage.getItem('schoolAttended');
            const userId = sessionStorage.getItem('userId');

            try {
                const response = await fetch('../../api/delete-document.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        document_id: documentId,
                        user_type: userType,
                        school_attended: schoolAttended,
                        user_id: userId
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showNotification('Document deleted successfully', 'success');
                    const studentId = document.getElementById('studentSearch').value;
                    if (studentId) searchDocuments();
                } else {
                    showNotification(data.message || 'Delete failed', 'error');
                }
            } catch (error) {
                showNotification('Error: ' + error.message, 'error');
            }
        }

        function logout() {
            sessionStorage.clear();
            window.location.href = '../../index.html';
        }
    </script>
</body>
</html>
