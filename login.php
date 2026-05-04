<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guidance Management System - Login</title>
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
                    <span>Secure & Private</span>
                </div>
                <div class="feature">
                    <i class="bi bi-people-fill"></i>
                    <span>Student Support</span>
                </div>
                <div class="feature">
                    <i class="bi bi-graph-up"></i>
                    <span>Track Progress</span>
                </div>
            </div>
        </div>

        <div class="auth-right">
            <div class="auth-box">
                <h1>Welcome Back</h1>
                <p class="auth-subtitle">Sign in to your account to continue</p>

                <form id="loginForm" class="auth-form">
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

                    <div id="loginError" class="error-alert"></div>

                    <button type="submit" class="btn btn-auth-primary">
                        <span>Sign In</span>
                        <i class="bi bi-arrow-right"></i>
                    </button>
                </form>

                <div class="auth-divider">
                    <span>Don't have an account?</span>
                    <a href="register.php" class="auth-link">Create New Account <i class="bi bi-arrow-right"></i></a>
                </div>

               
            </div>
        </div>
    </div>

    <script src="js/auth.js"></script>
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
