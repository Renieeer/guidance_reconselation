<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guidance Management System - Register</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body class="auth-page">
    <nav id="navbar">
        <a class="nav-brand" href="index.php">
            <span class="nav-dot"></span> Guidance Portal
        </a>
        <button class="nav-toggle" id="navToggle" aria-label="Menu">
            <i class="bi bi-list"></i>
        </button>
        <ul class="nav-links" id="navLinks">
            <li><a href="index.php#features">Features</a></li>
            <li><a href="index.php#roles">Roles</a></li>
            <li><a href="index.php#about">About</a></li>
            <li><a href="login.php">Log In</a></li>
            <li><a href="register.php" class="btn-nav">Register</a></li>
        </ul>
    </nav>

    <div class="auth-container">
        <div class="auth-left">
            <div class="auth-brand">
                <div class="brand-icon">
                    <i class="bi bi-heart-handshake"></i>
                </div>
                <h2>Guidance Management</h2>
                <p>Comprehensive Student Counselling & Referral System</p>
            </div>
            
            <div class="auth-features">
                <div class="feature">
                    <i class="bi bi-shield-check"></i>
                    <span>Secure Registration</span>
                </div>
                <div class="feature">
                    <i class="bi bi-building"></i>
                    <span>School-based Access</span>
                </div>
                <div class="feature">
                    <i class="bi bi-people-fill"></i>
                    <span>Safe Environment</span>
                </div>
            </div>
        </div>

        <div class="auth-right">
            <div class="auth-box auth-register-box">
                <h1>Create Your Account</h1>
                <p class="auth-subtitle">Join our guidance management community today</p>

                <form id="registerForm" class="auth-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="firstName">First Name *</label>
                            <div class="input-wrapper">
                                <input type="text" id="firstName" name="firstName" placeholder="John" required>
                            </div>
                            <small class="error-text"></small>
                        </div>

                        <div class="form-group">
                            <label for="lastName">Last Name *</label>
                            <div class="input-wrapper">
                                <input type="text" id="lastName" name="lastName" placeholder="Doe" required>
                            </div>
                            <small class="error-text"></small>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="email">Email Address *</label>
                        <div class="input-wrapper">
                            <input type="email" id="email" name="email" placeholder="your@email.com" required>
                        </div>
                        <small class="error-text"></small>
                    </div>

                    <div class="form-group">
                        <label for="school">School <span id="schoolRequired" style="color: #ef4444;">*</span></label>
                        <div class="input-wrapper">
                            <select id="school" name="school" required>
                                <option value="">Loading schools...</option>
                            </select>
                        </div>
                        <small class="error-text"></small>
                    </div>

                    <div class="form-group">
                        <label for="role">Your Role *</label>
                        <div class="input-wrapper">
                            <select id="role" name="role" required>
                                <option value="">Select your role...</option>
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="counselor">Counselor</option>
                                <option value="coordinator">Coordinator</option>
                                <option value="counselor-and-coordinator">Counselor & Coordinator</option>
                                <!-- <option value="sdo">SDO (School District Officer)</option> -->
                            </select>
                        </div>
                        <small class="error-text"></small>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="password">Password * 
                                <button type="button" class="password-help-btn" id="passwordHelpBtn">
                                    <i class="bi bi-question-circle"></i>
                                </button>
                            </label>
                            <div class="input-wrapper password-wrapper">
                                <input type="password" id="password" name="password" placeholder="••••••••" required>
                                <button type="button" class="toggle-password" id="togglePassword">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                            <small class="error-text"></small>
                        </div>

                        <div class="form-group">
                            <label for="confirmPassword">Confirm Password *</label>
                            <div class="input-wrapper password-wrapper">
                                <input type="password" id="confirmPassword" name="confirmPassword" placeholder="••••••••" required>
                                <button type="button" class="toggle-password" id="toggleConfirmPassword">
                                    <i class="bi bi-eye"></i>
                                </button>

                            </div>
                            <small class="error-text"></small>
                        </div>
                    </div>

                    <div id="registerError" class="error-alert"></div>
                    <div id="registerSuccess" class="success-alert"></div>

                    <button type="submit" class="btn btn-auth-primary btn-block">
                        <span>Create Account</span>
                        <i class="bi bi-arrow-right"></i>
                    </button>
                </form>

                <!-- Password Requirements Modal -->
                <div id="passwordModal" class="password-modal-overlay">
                    <div class="password-modal-content">
                        <div class="modal-header">
                            <h3>Password Requirements</h3>
                            <button type="button" class="modal-close" id="closePasswordModal">
                                <i class="bi bi-x"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div id="passwordRequirements" class="password-requirements-list">
                                <div class="requirement-item">
                                    <i class="bi bi-check-circle requirement-icon"></i>
                                    <span>At least 8 characters</span>
                                </div>
                                <div class="requirement-item">
                                    <i class="bi bi-check-circle requirement-icon"></i>
                                    <span>One uppercase letter (A-Z)</span>
                                </div>
                                <div class="requirement-item">
                                    <i class="bi bi-check-circle requirement-icon"></i>
                                    <span>One lowercase letter (a-z)</span>
                                </div>
                                <div class="requirement-item">
                                    <i class="bi bi-check-circle requirement-icon"></i>
                                    <span>One number (0-9)</span>
                                </div>
                                <div class="requirement-item">
                                    <i class="bi bi-check-circle requirement-icon"></i>
                                    <span>One special character (!@#$%^&*)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="auth-divider">
                    <span>Already have an account?</span>
                    <a href="login.php" class="auth-link">Sign In Here <i class="bi bi-arrow-right"></i></a>
                </div>
            </div>
        </div>
    </div>

    <script src="js/register.js"></script>
    <script>
        const navToggle = document.getElementById('navToggle');
        const navLinks = document.getElementById('navLinks');

        if (navToggle && navLinks) {
            navToggle.addEventListener('click', () => {
                navLinks.classList.toggle('open');
            });
        }
    </script>
</body>
</html>
