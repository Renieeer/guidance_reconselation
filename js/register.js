// Password validation and strength checker
function validatePassword(password) {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const requirements = {
        length: password.length >= minLength,
        uppercase: hasUppercase,
        lowercase: hasLowercase,
        number: hasNumber,
        special: hasSpecialChar,
        valid: password.length >= minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar
    };
    
    return requirements;
}

// Validate email format
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show password requirements
function showPasswordRequirements(password) {
    const requirements = validatePassword(password);
    const hints = document.querySelectorAll('.password-hint');
    
    hints.forEach(hint => {
        let text = '<div style="color: #ef4444; font-weight: 600; font-size: 11px; margin-bottom: 4px;">Requirements:</div>';
        text += `<span style="${requirements.length ? 'color: #10b981' : 'color: #ef4444'}">✓ 8+ chars</span> `;
        text += `<span style="${requirements.uppercase ? 'color: #10b981' : 'color: #ef4444'}">✓ Uppercase</span> `;
        text += `<span style="${requirements.lowercase ? 'color: #10b981' : 'color: #ef4444'}">✓ Lowercase</span><br>`;
        text += `<span style="${requirements.number ? 'color: #10b981' : 'color: #ef4444'}">✓ Number</span> `;
        text += `<span style="${requirements.special ? 'color: #10b981' : 'color: #ef4444'}">✓ Special char (!@#$%^&*)</span>`;
        hint.innerHTML = text;
    });
}

// Toggle password visibility
document.getElementById('togglePassword')?.addEventListener('click', function(e) {
    e.preventDefault();
    const passwordInput = document.getElementById('password');
    const icon = this.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
    }
});

document.getElementById('toggleConfirmPassword')?.addEventListener('click', function(e) {
    e.preventDefault();
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const icon = this.querySelector('i');
    
    if (confirmPasswordInput.type === 'password') {
        confirmPasswordInput.type = 'text';
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
    } else {
        confirmPasswordInput.type = 'password';
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
    }
});

// Real-time password validation feedback
document.getElementById('password')?.addEventListener('input', function(e) {
    showPasswordRequirements(this.value);
});

// Handle registration form submission
document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Clear previous messages
    document.getElementById('registerError').textContent = '';
    document.getElementById('registerSuccess').textContent = '';
    clearErrorMessages();

    // Get form data
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const school = document.getElementById('school').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;

    // Validate all fields
    let hasError = false;

    if (!firstName) {
        showFieldError('firstName', 'First name is required');
        hasError = true;
    }

    if (!lastName) {
        showFieldError('lastName', 'Last name is required');
        hasError = true;
    }

    if (!email) {
        showFieldError('email', 'Email is required');
        hasError = true;
    } else if (!validateEmail(email)) {
        showFieldError('email', 'Please enter a valid email address');
        hasError = true;
    }

    if (!school) {
        showFieldError('school', 'School attended is required');
        hasError = true;
    }

    if (!password) {
        showFieldError('password', 'Password is required');
        hasError = true;
    } else {
        const requirements = validatePassword(password);
        if (!requirements.valid) {
            let missing = [];
            if (!requirements.length) missing.push('at least 8 characters');
            if (!requirements.uppercase) missing.push('an uppercase letter');
            if (!requirements.lowercase) missing.push('a lowercase letter');
            if (!requirements.number) missing.push('a number');
            if (!requirements.special) missing.push('a special character (!@#$%^&*)');
            
            showFieldError('password', 'Password needs: ' + missing.join(', '));
            hasError = true;
        }
    }

    if (password !== confirmPassword) {
        showFieldError('confirmPassword', 'Passwords do not match');
        hasError = true;
    }

    if (!role) {
        showFieldError('role', 'Please select a role');
        hasError = true;
    }

    if (hasError) {
        showError('Please fix the errors above and try again');
        return;
    }

    // Disable submit button
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
        // Send registration data to backend
        const response = await fetch('http://localhost/guidancemanagment/api/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName: firstName,
                lastName: lastName,
                email: email,
                school: school,
                password: password,
                role: role
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Account created successfully! Redirecting to login...');
            setTimeout(() => {
                window.location.href = 'index.php';
            }, 2000);
        } else {
            // Show detailed error message
            let errorMsg = data.message || 'An error occurred during registration';
            
            // Handle specific error cases
            if (errorMsg.includes('already registered')) {
                showFieldError('email', 'This email is already registered. Please login instead.');
            } else if (errorMsg.includes('security requirements')) {
                showFieldError('password', 'Password does not meet security requirements');
            } else {
                showError(errorMsg);
            }
            
            console.error('Registration error details:', data);
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Network error. Please check your connection and try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const wrapper = field.parentElement;
    const errorText = wrapper.querySelector('.error-text') || wrapper.parentElement.querySelector('.error-text');
    
    if (errorText) {
        errorText.textContent = message;
        errorText.style.display = 'block';
    }
    
    if (field.classList) {
        field.classList.add('error');
    }
}

function clearErrorMessages() {
    const errorTexts = document.querySelectorAll('.error-text');
    errorTexts.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    const inputs = document.querySelectorAll('.error');
    inputs.forEach(el => {
        el.classList.remove('error');
    });
}

function showError(message) {
    const errorDiv = document.getElementById('registerError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        // Scroll to error
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('registerSuccess');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.classList.add('show');
    }
}
