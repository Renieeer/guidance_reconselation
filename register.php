<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guidance Management System - Register</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body class="auth-page">
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
                    <i class="bi bi-people-fill"></i>
                    <span>Safe Environment</span>
                </div>
                <div class="feature">
                    <i class="bi bi-graph-up"></i>
                    <span>Professional Support</span>
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
                        <label for="school">School Attended *</label>
                        <div class="input-wrapper">
                         
                            <input type="text" id="school" name="school" placeholder="e.g., Butucan National High School" required>
                        </div>
                        <small class="error-text"></small>
                    </div>

                    <div class="form-group">
                        <label for="role">Select Your Role *</label>
                        <div class="input-wrapper">
                        
                            <select id="role" name="role" required>
                                <option value="">Choose your role...</option>
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="coordinator">Coordinator</option>
                                <option value="counselor">Counselor</option>
                                <option value="other-school">Coordinator & Counselor (Other School)</option>
                            </select>
                        </div>
                        <small class="error-text"></small>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="password">Password *</label>
                            <div class="input-wrapper password-wrapper">
                              
                                <input type="password" id="password" name="password" placeholder="••••••••" required>
                                <button type="button" class="toggle-password" id="togglePassword">
                                   
                                </button>
                            </div>
                            <div class="password-hint">
                                <div style="color: #ef4444; font-weight: 600; font-size: 11px; margin-bottom: 4px;">Requirements:</div>
                                <span style="color: #ef4444">✓ 8+ chars</span> <span style="color: #ef4444">✓ Uppercase</span> <span style="color: #ef4444">✓ Lowercase</span><br>
                                <span style="color: #ef4444">✓ Number</span> <span style="color: #ef4444">✓ Special char (!@#$%^&*)</span>
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

                <div class="auth-divider">
                    <span>Already have an account?</span>
                </div>

                <a href="index.php" class="btn btn-auth-secondary btn-block">
                    <span>Sign In Here</span>
                    <i class="bi bi-arrow-right"></i>
                </a>
            </div>
        </div>
    </div>

    <script src="js/register.js"></script>
</body>
</html>
