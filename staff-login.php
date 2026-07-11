<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guidance Management System - Staff Login</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body class="auth-page" data-portal="staff">
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
            <li><a href="login.php">Student Login</a></li>
            <li><a href="staff-login.php" class="btn-nav">Staff Login</a></li>
        </ul>
    </nav>

    <div class="auth-container">
        <div class="auth-left">
            <div class="auth-brand">
                <div class="brand-icon">
                    <i class="bi bi-briefcase"></i>
                </div>
                <h2>Staff Portal</h2>
                <p>For Teachers, Counselors, and Coordinators</p>
            </div>

            <div class="auth-features">
                <div class="feature">
                    <i class="bi bi-person-workspace"></i>
                    <span>Teacher Referrals</span>
                </div>
                <div class="feature">
                    <i class="bi bi-clipboard2-pulse"></i>
                    <span>Counseling &amp; Cases</span>
                </div>
                <div class="feature">
                    <i class="bi bi-bar-chart-line"></i>
                    <span>Guidance Oversight</span>
                </div>
            </div>
        </div>

        <div class="auth-right">
            <!-- Access-code gate: shown first so students can't even reach
                 the actual staff login form below. -->
            <div class="auth-box" id="staffPinGate">
                <h1>Staff Access Code</h1>
                <p class="auth-subtitle">Enter the staff access code given by your SDO to continue.</p>

                <form id="staffPinForm" class="auth-form">
                    <div id="staffPinError" class="error-alert"></div>

                    <div class="form-group">
                        <label for="staffPin">Access Code</label>
                        <div class="input-wrapper password-wrapper">
                            <input type="password" id="staffPin" name="staffPin" placeholder="••••••" required autocomplete="off" inputmode="numeric">
                            <button type="button" class="toggle-password" id="toggleStaffPin">
                                <i class="bi bi-eye"></i>
                            </button>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-auth-primary">
                        <span>Continue</span>
                        <i class="bi bi-arrow-right"></i>
                    </button>
                </form>

                <p class="text-muted" style="text-align:center; margin-top: 16px; font-size: 13px;">
                    Not staff? <a href="login.php" class="auth-link">Go to Student Login</a>
                </p>
            </div>

            <!-- Real login form: hidden until the access code above is verified. -->
            <div class="auth-box" id="staffLoginBox" style="display:none;">
                <h1>Staff Sign In</h1>
                <p class="auth-subtitle">Sign in with your teacher, counselor, or coordinator account</p>

                <form id="loginForm" class="auth-form">
                    <div id="loginError" class="error-alert"></div>

                    <div class="form-group">
                        <label for="email">Email Address</label>
                        <div class="input-wrapper">
                            <input type="email" id="email" name="email" placeholder="your@email.com" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="password">Password</label>
                        <div class="input-wrapper password-wrapper">
                            <input type="password" id="password" name="password" placeholder="••••••••" required>
                            <button type="button" class="toggle-password" id="togglePassword">
                                <i class="bi bi-eye"></i>
                            </button>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-auth-primary">
                        <span>Sign In</span>
                        <i class="bi bi-arrow-right"></i>
                    </button>
                </form>

                <div class="auth-divider">
                    <span>New teacher?</span>
                    <a href="staff-register.php" class="auth-link">Create Teacher Account <i class="bi bi-arrow-right"></i></a>
                </div>

                <p class="text-muted" style="text-align:center; margin-top: 16px; font-size: 13px;">
                    Counselor and Coordinator accounts are created by the SDO.<br>
                    Not staff? <a href="login.php" class="auth-link">Go to Student Login</a>
                </p>
            </div>
        </div>
    </div>

    <script src="js/auth.js"></script>
    <script src="js/staff-pin.js"></script>
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
