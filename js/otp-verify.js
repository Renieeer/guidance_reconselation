// Shared "enter the 6-digit code we emailed you" modal, used by both the
// registration flow (register.js) and the login flow (auth.js) — a login
// attempt on an unverified account gets the same modal as registration
// does, just with a different next step after success. Reuses the existing
// .password-modal-overlay/.password-modal-content styles from style.css
// rather than adding new CSS, since it's the same generic modal shell.
const OTP_API_BASE = (function () {
    const src = document.currentScript && document.currentScript.src;
    if (src) {
        return src.replace(/\/js\/[^/]+\.js(?:[?#].*)?$/, '');
    }
    return window.location.origin;
})();

let otpOverlay = null;
let otpResendTimer = null;

function buildOtpModal() {
    if (otpOverlay) {
        return otpOverlay;
    }

    otpOverlay = document.createElement('div');
    otpOverlay.className = 'password-modal-overlay';
    otpOverlay.id = 'otpModalOverlay';
    otpOverlay.innerHTML = `
        <div class="password-modal-content">
            <div class="modal-header">
                <h3>Verify Your Email</h3>
                <button type="button" class="modal-close" id="otpModalClose"><i class="bi bi-x"></i></button>
            </div>
            <div class="modal-body">
                <p id="otpModalIntro" style="margin-top:0;"></p>
                <div class="form-group">
                    <label for="otpCodeInput">6-digit code</label>
                    <div class="input-wrapper">
                        <input type="text" id="otpCodeInput" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="123456" autocomplete="one-time-code">
                    </div>
                </div>
                <div id="otpModalError" class="error-alert"></div>
                <div id="otpModalSuccess" class="success-alert"></div>
                <button type="button" class="btn btn-auth-primary btn-block" id="otpVerifyBtn">Verify</button>
                <p class="text-muted" style="text-align:center; margin-top: 16px; font-size: 13px;">
                    Didn't get a code? <a href="#" class="auth-link" id="otpResendLink">Resend code</a>
                </p>
            </div>
        </div>
    `;
    document.body.appendChild(otpOverlay);

    otpOverlay.querySelector('#otpModalClose').addEventListener('click', hideOtpModal);
    otpOverlay.addEventListener('click', function (e) {
        if (e.target === otpOverlay) {
            hideOtpModal();
        }
    });

    return otpOverlay;
}

function clearOtpMessages() {
    const err = document.getElementById('otpModalError');
    const ok = document.getElementById('otpModalSuccess');
    if (err) { err.textContent = ''; err.classList.remove('show'); }
    if (ok) { ok.textContent = ''; ok.classList.remove('show'); }
}

function showOtpError(message) {
    const el = document.getElementById('otpModalError');
    if (el) {
        el.textContent = message;
        el.classList.add('show');
    }
}

function showOtpSuccess(message) {
    const el = document.getElementById('otpModalSuccess');
    if (el) {
        el.textContent = message;
        el.classList.add('show');
    }
}

function startOtpResendCooldown(seconds) {
    const link = document.getElementById('otpResendLink');
    if (!link) {
        return;
    }
    if (otpResendTimer) {
        clearInterval(otpResendTimer);
    }
    let remaining = seconds;
    link.style.pointerEvents = 'none';
    link.style.opacity = '0.5';
    link.textContent = `Resend code (${remaining}s)`;
    otpResendTimer = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
            clearInterval(otpResendTimer);
            link.textContent = 'Resend code';
            link.style.pointerEvents = '';
            link.style.opacity = '';
        } else {
            link.textContent = `Resend code (${remaining}s)`;
        }
    }, 1000);
}

function showOtpModal(email, options) {
    options = options || {};
    const modal = buildOtpModal();
    clearOtpMessages();
    document.getElementById('otpCodeInput').value = '';
    document.getElementById('otpModalIntro').textContent =
        `We've sent a 6-digit verification code to ${email}. Enter it below to verify your account.`;
    modal.classList.add('show');

    // Rebuild the verify/resend buttons via cloneNode so old listeners from
    // a previous showOtpModal() call (a different email) don't stack up.
    const verifyBtn = document.getElementById('otpVerifyBtn');
    const resendLink = document.getElementById('otpResendLink');
    const codeInput = document.getElementById('otpCodeInput');

    const newVerifyBtn = verifyBtn.cloneNode(true);
    verifyBtn.parentNode.replaceChild(newVerifyBtn, verifyBtn);
    const newResendLink = resendLink.cloneNode(true);
    resendLink.parentNode.replaceChild(newResendLink, resendLink);
    startOtpResendCooldown(60);

    newVerifyBtn.addEventListener('click', async function () {
        clearOtpMessages();
        const code = codeInput.value.trim();
        if (!/^\d{6}$/.test(code)) {
            showOtpError('Enter the 6-digit code from your email.');
            return;
        }

        newVerifyBtn.disabled = true;
        const originalText = newVerifyBtn.textContent;
        newVerifyBtn.textContent = 'Verifying...';

        try {
            const response = await fetch(`${OTP_API_BASE}/api/verify-otp.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: code })
            });
            const data = await response.json();

            if (data.success) {
                showOtpSuccess('Email verified!');
                setTimeout(() => {
                    hideOtpModal();
                    if (typeof options.onVerified === 'function') {
                        options.onVerified();
                    }
                }, 1000);
            } else {
                showOtpError(data.message || 'Invalid or expired code.');
            }
        } catch (error) {
            showOtpError('Network error. Please try again.');
        } finally {
            newVerifyBtn.disabled = false;
            newVerifyBtn.textContent = originalText;
        }
    });

    newResendLink.addEventListener('click', async function (e) {
        e.preventDefault();
        if (newResendLink.style.pointerEvents === 'none') {
            return;
        }
        clearOtpMessages();
        try {
            const response = await fetch(`${OTP_API_BASE}/api/resend-otp.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (data.success) {
                showOtpSuccess(data.alreadyVerified ? data.message : 'A new code has been sent.');
                if (!data.alreadyVerified) {
                    startOtpResendCooldown(60);
                }
            } else {
                showOtpError(data.message || 'Could not resend code.');
            }
        } catch (error) {
            showOtpError('Network error. Please try again.');
        }
    });
}

function hideOtpModal() {
    if (otpOverlay) {
        otpOverlay.classList.remove('show');
    }
    if (otpResendTimer) {
        clearInterval(otpResendTimer);
    }
}
