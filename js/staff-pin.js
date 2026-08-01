// Staff access-code gate for staff-login.php — keeps the real login form
// hidden from students until the shared staff access code is entered.
(function() {
    const gate = document.getElementById('staffPinGate');
    const loginBox = document.getElementById('staffLoginBox');
    const pinForm = document.getElementById('staffPinForm');
    const pinInput = document.getElementById('staffPin');
    const pinError = document.getElementById('staffPinError');
    const togglePinBtn = document.getElementById('toggleStaffPin');

    if (!gate || !loginBox || !pinForm || !pinInput) {
        return;
    }

    function unlock() {
        gate.style.display = 'none';
        loginBox.style.display = 'block';
    }

    // Verified once per browser session so staff aren't re-prompted on
    // every page load/back-navigation within the same tab session.
    if (sessionStorage.getItem('staffPinVerified') === 'true') {
        unlock();
    }

    togglePinBtn?.addEventListener('click', function() {
        const icon = togglePinBtn.querySelector('i');
        if (pinInput.type === 'password') {
            pinInput.type = 'text';
            icon.classList.remove('bi-eye');
            icon.classList.add('bi-eye-slash');
        } else {
            pinInput.type = 'password';
            icon.classList.remove('bi-eye-slash');
            icon.classList.add('bi-eye');
        }
    });

    pinForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        pinError.textContent = '';
        pinError.classList.remove('show');

        const pin = pinInput.value.trim();
        if (!pin) {
            return;
        }

        const submitBtn = pinForm.querySelector('button[type="submit"]');
        const originalHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Checking...</span>';

        try {
            const response = await fetch('api/verify-staff-pin.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });
            const data = await response.json();

            if (data.success) {
                sessionStorage.setItem('staffPinVerified', 'true');
                unlock();
            } else {
                pinError.textContent = data.message || 'Incorrect access code.';
                pinError.classList.add('show');
                pinInput.value = '';
                pinInput.focus();
            }
        } catch (error) {
            pinError.textContent = 'Network error. Please try again.';
            pinError.classList.add('show');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHtml;
        }
    });
})();
