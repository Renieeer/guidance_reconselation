// Teacher Referral Form Script

function initReferralForm() {
    initPage();
    setTodayDate('referralDate');
    document.getElementById('referralForm').addEventListener('submit', submitReferralForm);
}

function submitReferralForm(e) {
    e.preventDefault();

    const user = getCurrentUser();
    const formData = new FormData(document.getElementById('referralForm'));
    
    // Create referral object
    const referral = {
        id: 'REF-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        studentName: formData.get('studentName'),
        studentId: formData.get('studentId'),
        grade: formData.get('grade'),
        section: formData.get('section'),
        age: formData.get('age'),
        gender: formData.get('gender'),
        referralReason: formData.get('referralReason'),
        description: formData.get('description'),
        interventionAttempts: formData.get('interventionAttempts'),
        observedBehaviors: formData.get('observedBehaviors'),
        parentGuardian: formData.get('parentGuardian'),
        parentContact: formData.get('parentContact'),
        parentEmail: formData.get('parentEmail'),
        familyBackground: formData.get('familyBackground'),
        referralDate: formData.get('referralDate'),
        urgency: formData.get('urgency'),
        attachments: formData.get('attachments'),
        submittedBy: user.email,
        submittedByName: user.name,
        dateSubmitted: new Date().toISOString(),
        stage: 1, // Stage 1: Submitted
        status: 'pending',
        followUpForms: [] // Will be populated at stage 3
    };

    // Save to localStorage
    let referrals = getData('referrals') || [];
    referrals.push(referral);
    saveData('referrals', referrals);

    // Redirect to dashboard with success message
    window.location.href = 'dashboard.html?submitted=true';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initReferralForm);
