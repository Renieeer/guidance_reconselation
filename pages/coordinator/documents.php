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
            max-width: 1200px;
            margin: 0 auto;
        }

        .upload-section {
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: var(--shadow);
            margin-bottom: 24px;
        }

        .upload-section h3 {
            color: var(--primary-color);
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: var(--text-color);
        }

        .form-group select,
        .form-group input[type="text"],
        .form-group textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            font-family: inherit;
            font-size: 14px;
        }

        .form-group textarea {
            resize: vertical;
            min-height: 80px;
        }

        .file-input-wrapper {
            position: relative;
            overflow: hidden;
            display: inline-block;
            width: 100%;
        }

        .file-input-label {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
            border: 2px dashed #3b82f6;
            border-radius: 8px;
            background: #f0f9ff;
            cursor: pointer;
            transition: var(--transition);
            color: #3b82f6;
            font-weight: 600;
        }

        .file-input-label:hover {
            background: #e0f2fe;
            border-color: #2563eb;
        }

        .file-input-label i {
            margin-right: 10px;
            font-size: 24px;
        }

        input[type="file"] {
            display: none;
        }

        .upload-btn {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 10px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: var(--transition);
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .upload-btn:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            transform: translateY(-2px);
        }

        .upload-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .documents-section {
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: var(--shadow);
        }

        .documents-section h3 {
            color: var(--primary-color);
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .document-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 0;
            flex-wrap: wrap;
        }

        .document-tab {
            padding: 12px 20px;
            border: none;
            background: none;
            cursor: pointer;
            color: #64748b;
            font-weight: 600;
            border-bottom: 3px solid transparent;
            transition: var(--transition);
        }

        .document-tab.active {
            color: #3b82f6;
            border-bottom-color: #3b82f6;
        }

        .document-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
        }

        .document-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            transition: var(--transition);
            position: relative;
        }

        .document-card:hover {
            box-shadow: var(--shadow);
            border-color: #cbd5e1;
        }

        .document-icon {
            font-size: 48px;
            color: #3b82f6;
            margin-bottom: 10px;
            text-align: center;
        }

        .document-name {
            font-weight: 600;
            color: var(--text-color);
            margin-bottom: 8px;
            word-break: break-word;
            font-size: 13px;
        }

        .document-meta {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 12px;
        }

        .document-actions {
            display: flex;
            gap: 8px;
            justify-content: center;
        }

        .doc-btn {
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

        .doc-btn-view {
            background: #e0f2fe;
            color: #0369a1;
        }

        .doc-btn-view:hover {
            background: #bae6fd;
        }

        .doc-btn-delete {
            background: #fee2e2;
            color: #dc2626;
        }

        .doc-btn-delete:hover {
            background: #fecaca;
        }

        .empty-state {
            text-align: center;
            padding: 48px 24px;
            color: #94a3b8;
        }

        .empty-state i {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
        }

        .empty-state p {
            font-size: 14px;
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
            animation: fadeIn 0.3s ease;
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

        .upload-progress {
            margin-top: 16px;
            display: none;
        }

        .progress-bar {
            width: 100%;
            height: 6px;
            background: #e2e8f0;
            border-radius: 3px;
            overflow: hidden;
        }

        .progress-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #2563eb);
            width: 0%;
            transition: width 0.3s ease;
        }

        @media (max-width: 768px) {
            .form-row {
                grid-template-columns: 1fr;
            }

            .document-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            }

            .upload-section,
            .documents-section {
                padding: 16px;
            }

            .form-group {
                margin-bottom: 12px;
            }

            .document-tabs {
                flex-wrap: nowrap;
                overflow-x: auto;
            }

            .document-tab {
                padding: 10px 16px;
                font-size: 13px;
                white-space: nowrap;
            }
        }
    </style>
</head>
<body>
    <div class="main-wrapper">
        <!-- Sidebar -->
        <?php include '../../includes/sidebar-coordinator.php'; ?><!-- Main Content -->
        <div class="main-content">
            <!-- Topbar -->
            <div class="topbar">
                <div class="topbar-left">
                    <h1>Student Documents</h1>
                </div>
                <div class="topbar-right">
                    <div class="user-info">
                        <div class="user-avatar" id="userAvatar">CO</div>
                        <div>
                            <div style="font-weight: 600;" id="userName">Coordinator</div>
                            <small style="color: #64748b;" id="userRole">Coordinator</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                <div class="document-container">
                    <!-- Upload Section -->
                    <div class="upload-section">
                        <h3><i class="fas fa-cloud-upload-alt"></i> Upload Document for Student</h3>
                        <form id="uploadForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="studentId">Student ID <span style="color: #ef4444;">*</span></label>
                                    <input type="text" id="studentId" name="student_id" placeholder="e.g., STU001" required>
                                </div>

                                <div class="form-group">
                                    <label for="documentType">Document Type <span style="color: #ef4444;">*</span></label>
                                    <select id="documentType" name="document_type" required>
                                        <option value="">Select Document Type</option>
                                        <option value="inventory">Individual Inventory Form</option>
                                        <option value="referral">Referral Form</option>
                                        <option value="follow-up">Follow-up Form</option>
                                        <option value="case">Case Document</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="fileInput">Select Image File <span style="color: #ef4444;">*</span></label>
                                <div class="file-input-wrapper">
                                    <label for="fileInput" class="file-input-label">
                                        <i class="fas fa-image"></i>
                                        <span>Click to select or drag and drop images (JPG, PNG)</span>
                                    </label>
                                    <input type="file" id="fileInput" name="file" accept="image/*" required>
                                </div>
                                <small style="color: #64748b; margin-top: 8px; display: block;">
                                    Max file size: 10MB | Supported: JPG, PNG, GIF, WebP
                                </small>
                            </div>

                            <div class="form-group">
                                <label for="description">Description (Optional)</label>
                                <textarea id="description" name="description" placeholder="Add any notes or description..."></textarea>
                            </div>

                            <button type="submit" class="upload-btn">
                                <i class="fas fa-upload"></i> Upload Document
                            </button>

                            <div class="upload-progress">
                                <div class="progress-bar">
                                    <div class="progress-bar-fill"></div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Documents Section -->
                    <div class="documents-section">
                        <h3><i class="fas fa-folder"></i> Student Documents</h3>
                        
                        <div class="document-tabs">
                            <button class="document-tab active" data-filter="all">All Documents</button>
                            <button class="document-tab" data-filter="inventory">
                                <i class="fas fa-id-card"></i> Inventory
                            </button>
                            <button class="document-tab" data-filter="referral">
                                <i class="fas fa-clipboard"></i> Referrals
                            </button>
                            <button class="document-tab" data-filter="follow-up">
                                <i class="fas fa-tasks"></i> Follow-ups
                            </button>
                            <button class="document-tab" data-filter="case">
                                <i class="fas fa-briefcase"></i> Cases
                            </button>
                        </div>

                        <div id="documentGrid" class="document-grid">
                            <!-- Documents will be loaded here -->
                        </div>
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
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', () => {
            setupUserInfo();
            setupEventListeners();
        });

        // Setup user info
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
                    userRoleElement.textContent = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1).replace('-', ' ') : 'Coordinator';
                }
                const initials = userName.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
                if (userAvatar) userAvatar.textContent = initials;
            }
        }

        // Setup event listeners
        function setupEventListeners() {
            // Upload form
            document.getElementById('uploadForm').addEventListener('submit', handleUpload);

            // File input drag and drop
            const fileInput = document.getElementById('fileInput');
            const fileInputLabel = document.querySelector('.file-input-label');

            fileInputLabel.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileInputLabel.style.background = '#e0f2fe';
                fileInputLabel.style.borderColor = '#2563eb';
            });

            fileInputLabel.addEventListener('dragleave', () => {
                fileInputLabel.style.background = '#f0f9ff';
                fileInputLabel.style.borderColor = '#3b82f6';
            });

            fileInputLabel.addEventListener('drop', (e) => {
                e.preventDefault();
                fileInputLabel.style.background = '#f0f9ff';
                fileInputLabel.style.borderColor = '#3b82f6';
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    fileInput.files = files;
                }
            });

            // Document filter tabs
            document.querySelectorAll('.document-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.document-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    filterDocuments(tab.dataset.filter);
                });
            });

            // Logout
            document.getElementById('logoutBtn').addEventListener('click', logout);
        }

        // Handle file upload
        async function handleUpload(e) {
            e.preventDefault();

            const form = document.getElementById('uploadForm');
            const studentId = document.getElementById('studentId').value.trim();
            const documentType = document.getElementById('documentType').value;
            const fileInput = document.getElementById('fileInput');
            const description = document.getElementById('description').value;
            const uploadBtn = form.querySelector('.upload-btn');
            const progressDiv = form.querySelector('.upload-progress');

            if (!studentId || !documentType || !fileInput.files.length) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('student_id', studentId);
            formData.append('document_type', documentType);
            formData.append('file', fileInput.files[0]);
            formData.append('description', description);

            uploadBtn.disabled = true;
            progressDiv.style.display = 'block';

            try {
                const response = await fetch('../../api/upload-document.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    showNotification('Document uploaded successfully!', 'success');
                    form.reset();
                    document.getElementById('fileInput').value = '';
                    progressDiv.style.display = 'none';
                    loadDocuments(studentId);
                } else {
                    showNotification(data.message || 'Upload failed', 'error');
                }
            } catch (error) {
                showNotification('Error: ' + error.message, 'error');
            } finally {
                uploadBtn.disabled = false;
                progressDiv.style.display = 'none';
            }
        }

        // Load documents
        async function loadDocuments(studentId) {
            if (!studentId) {
                showEmptyState('Enter a Student ID to view documents');
                return;
            }

            const userType = sessionStorage.getItem('userType');
            const schoolAttended = sessionStorage.getItem('schoolAttended');

            try {
                const response = await fetch(`../../api/list-documents.php?student_id=${studentId}&user_type=${userType}&school_attended=${schoolAttended || ''}`);
                const data = await response.json();

                if (data.success && data.documents.length > 0) {
                    displayDocuments(data.documents);
                } else {
                    showEmptyState('No documents found for this student');
                }
            } catch (error) {
                console.error('Error loading documents:', error);
                showEmptyState('Error loading documents');
            }
        }

        // Display documents
        function displayDocuments(documents) {
            const grid = document.getElementById('documentGrid');
            grid.innerHTML = '';

            const docTypeIcons = {
                'inventory': 'fa-id-card',
                'referral': 'fa-clipboard',
                'follow-up': 'fa-tasks',
                'case': 'fa-briefcase'
            };

            documents.forEach(doc => {
                const card = document.createElement('div');
                card.className = 'document-card';
                card.dataset.type = doc.document_type;

                const icon = docTypeIcons[doc.document_type] || 'fa-file';
                const uploadDate = new Date(doc.uploaded_at).toLocaleDateString();

                card.innerHTML = `
                    <div class="document-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="document-name">${doc.original_filename}</div>
                    <div class="document-meta">
                        <div><strong>${doc.document_type.replace('-', ' ').toUpperCase()}</strong></div>
                        <div>${uploadDate}</div>
                        <div style="font-size: 11px; margin-top: 4px;">${(doc.file_size / 1024).toFixed(2)} KB</div>
                    </div>
                    ${doc.description ? `<div class="document-meta">${doc.description}</div>` : ''}
                    <div class="document-actions">
                        <button class="doc-btn doc-btn-view" onclick="viewDocument(${doc.document_id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="doc-btn doc-btn-delete" onclick="deleteDocument(${doc.document_id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        // Filter documents
        function filterDocuments(filter) {
            const cards = document.querySelectorAll('.document-card');
            
            if (filter === 'all') {
                cards.forEach(card => card.style.display = '');
            } else {
                cards.forEach(card => {
                    card.style.display = card.dataset.type === filter ? '' : 'none';
                });
            }
        }

        // View document
        function viewDocument(documentId) {
            const studentId = document.getElementById('studentId').value;
            const userType = sessionStorage.getItem('userType');
            const schoolAttended = sessionStorage.getItem('schoolAttended');

            const imageUrl = `../../api/download-document.php?document_id=${documentId}&student_id=${studentId}&user_type=${userType}&school_attended=${schoolAttended || ''}&user_id=${sessionStorage.getItem('userId') || 0}`;
            
            document.getElementById('previewImage').src = imageUrl;
            document.getElementById('previewModal').classList.add('show');
        }

        // Close preview
        function closePreview() {
            document.getElementById('previewModal').classList.remove('show');
        }

        // Delete document
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
                    const studentId = document.getElementById('studentId').value;
                    loadDocuments(studentId);
                } else {
                    showNotification(data.message || 'Delete failed', 'error');
                }
            } catch (error) {
                showNotification('Error: ' + error.message, 'error');
            }
        }

        // Show empty state
        function showEmptyState(message = 'No documents yet') {
            document.getElementById('documentGrid').innerHTML = `
                <div style="grid-column: 1/-1;">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>${message}</p>
                    </div>
                </div>
            `;
        }

        // Logout
        function logout() {
            sessionStorage.clear();
            window.location.href = '../../index.html';
        }
    </script>
</body>
</html>
