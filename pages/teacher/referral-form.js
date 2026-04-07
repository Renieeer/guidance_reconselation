// Teacher Referral Form Script

function initReferralForm() {
    initPage();
    setTodayDate('referralDate');
    populateTeacherSchool();
    document.getElementById('referralForm').addEventListener('submit', submitReferralForm);
}

// Populate teacher's school information
function populateTeacherSchool() {
    const user = getCurrentUser();
    const teacherSchool = user?.school_attended || localStorage.getItem('teacherSchool') || 'Default School';
    
    const schoolField = document.getElementById('studentSchool');
    if (schoolField) {
        schoolField.value = teacherSchool;
    }
    
    // Store school for later use
    localStorage.setItem('teacherSchool', teacherSchool);
}

function submitReferralForm(e) {
    e.preventDefault();

    const user = getCurrentUser();
    const teacherSchool = user.school_attended || localStorage.getItem('teacherSchool') || 'Default School';
    const formData = new FormData(document.getElementById('referralForm'));
    
    // Create referral object with school information
    const referral = {
        student_name: formData.get('studentName'),
        student_id: formData.get('studentId'),
        grade: formData.get('grade'),
        section: formData.get('section'),
        age: formData.get('age'),
        gender: formData.get('gender'),
        referral_reason: formData.get('referralReason'),
        description: formData.get('description'),
        intervention_attempts: formData.get('interventionAttempts'),
        observed_behaviors: formData.get('observedBehaviors'),
        parent_guardian: formData.get('parentGuardian'),
        parent_contact: formData.get('parentContact'),
        parent_email: formData.get('parentEmail'),
        family_background: formData.get('familyBackground'),
        urgency: formData.get('urgency'),
        teacher_id: user.id || null,
        teacher_name: user.name || user.email,
        school_attended: teacherSchool,
        student_school: formData.get('studentSchool') || teacherSchool,
        stage: 1, // Stage 1: Submitted
        status: 'pending'
    };

    // Save to database
    const apiUrl = '/guidancemanagment/api/referral.php';

    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(referral)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        if (result.success) {
            // Show success message
            showSuccessMessage('Referral submitted successfully! Student has been notified.');
            
            // Reset form after 1.5 seconds
            setTimeout(() => {
                document.getElementById('referralForm').reset();
                window.location.href = 'dashboard.php?submitted=true';
            }, 1500);
        } else {
            showErrorMessage(result.message || 'Failed to submit referral');
        }
    })
    .catch(error => {
        console.error('Error submitting referral:', error);
        showErrorMessage('Error submitting referral. Please try again.');
    });
}

function createReferralNotification(referral) {
    // Notification creation now handled by backend API
    // This function is kept for backward compatibility but no longer needed
}

function showSuccessMessage(message) {
    // Create a temporary success message
    const success = document.createElement('div');
    success.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-weight: 500;
    `;
    success.textContent = message;
    document.body.appendChild(success);
    
    setTimeout(() => success.remove(), 3000);
}

function showErrorMessage(message) {
    // Create a temporary error message
    const error = document.createElement('div');
    error.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-weight: 500;
    `;
    error.textContent = message;
    document.body.appendChild(error);
    
    setTimeout(() => error.remove(), 3000);
}


// Initialize on page load
document.addEventListener('DOMContentLoaded', initReferralForm);
