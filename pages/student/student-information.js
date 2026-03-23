// Current step tracker
let currentStep = 1;
const totalSteps = 6;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateStepIndicator();
    updateNavigationButtons();
});

// Change step function
function changeStep(direction) {
    // Validate current step before moving to next
    if (direction === 1 && !validateCurrentStep()) {
        return;
    }

    currentStep += direction;

    // Boundary checks
    if (currentStep < 1) currentStep = 1;
    if (currentStep > totalSteps) currentStep = totalSteps;

    updateStepIndicator();
    updateNavigationButtons();
    scrollToTop();
}

// Update step indicator and form display
function updateStepIndicator() {
    // Hide all forms
    const forms = document.querySelectorAll('.step-form');
    forms.forEach(form => form.classList.remove('active'));

    // Show current form
    document.querySelector(`.step-form[data-step="${currentStep}"]`).classList.add('active');

    // Update step indicators
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active', 'completed');

        if (stepNumber < currentStep) {
            step.classList.add('completed');
        } else if (stepNumber === currentStep) {
            step.classList.add('active');
        }
    });

    // Update progress text
    document.getElementById('currentStep').textContent = `Step ${currentStep}`;
}

// Update navigation buttons
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // Disable previous button on first step
    prevBtn.disabled = currentStep === 1;

    // Change last button to submit
    if (currentStep === totalSteps) {
        nextBtn.innerHTML = '<i class="fas fa-save"></i> Submit Form';
        nextBtn.className = 'btn btn-submit';
        nextBtn.onclick = submitForm;
    } else {
        nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        nextBtn.className = 'btn btn-next';
        nextBtn.onclick = () => changeStep(1);
    }
}

// Validate current step
function validateCurrentStep() {
    const currentForm = document.querySelector(`.step-form[data-step="${currentStep}"]`);
    const requiredFields = currentForm.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });

    if (!isValid) {
        showNotification('Please fill in all required fields', 'error');
    }

    return isValid;
}

// Submit form
function submitForm(e) {
    e.preventDefault();

    // Final validation
    if (!validateCurrentStep()) {
        return;
    }

    // Submit the form
    document.getElementById('studentForm').submit();
}

// Scroll to top of form
function scrollToTop() {
    document.querySelector('.wizard-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#e74c3c' : '#4caf50'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations to the document
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============== DYNAMIC SECTION FUNCTIONS ==============

// Education Functions
function addEducation() {
    const container = document.getElementById('educationContainer');
    const sections = container.querySelectorAll('.dynamic-section');
    const newIndex = sections.length;

    const newSection = document.createElement('div');
    newSection.className = 'dynamic-section';
    newSection.innerHTML = `
        <table class="form-table">
            <tr>
                <th>Grade Level</th>
                <td><input type="text" name="education[${newIndex}][GradeLevel]" placeholder="e.g., Grade 7"></td>
                <th>School Attended</th>
                <td><input type="text" name="education[${newIndex}][SchoolAttended]"></td>
            </tr>
            <tr>
                <th>Inclusive Years</th>
                <td><input type="text" name="education[${newIndex}][InclusiveYes]" placeholder="e.g., 2020-2024"></td>
                <th>Plan After High School</th>
                <td><textarea rows="2" name="education[${newIndex}][PlaceAndSchool]"></textarea></td>
            </tr>
        </table>
        <button type="button" class="remove-section-btn" onclick="removeEducation(${newIndex})">
            <i class="fas fa-trash"></i> Remove School
        </button>
    `;

    container.appendChild(newSection);
    updateRemoveButtons('educationContainer');
}

function removeEducation(index) {
    const container = document.getElementById('educationContainer');
    const sections = container.querySelectorAll('.dynamic-section');
    if (sections.length > 1) {
        sections[index].remove();
        updateRemoveButtons('educationContainer');
        showNotification('School removed', 'info');
    } else {
        showNotification('You must have at least one school entry', 'error');
    }
}

// Organization Functions
function addOrganization() {
    const container = document.getElementById('organizationContainer');
    const sections = container.querySelectorAll('.dynamic-section');
    const newIndex = sections.length;

    const newSection = document.createElement('div');
    newSection.className = 'dynamic-section';
    newSection.innerHTML = `
        <table class="form-table">
            <tr>
                <th>Organization Name</th>
                <td><input type="text" name="organization[${newIndex}][OrganizationName]"></td>
                <th>Position Title</th>
                <td><input type="text" name="organization[${newIndex}][PositionTitle]"></td>
            </tr>
            <tr>
                <th>In Campus?</th>
                <td colspan="3">
                    <select name="organization[${newIndex}][inCampus]">
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                    </select>
                </td>
            </tr>
        </table>
        <button type="button" class="remove-section-btn" onclick="removeOrganization(${newIndex})">
            <i class="fas fa-trash"></i> Remove Organization
        </button>
    `;

    container.appendChild(newSection);
    updateRemoveButtons('organizationContainer');
}

function removeOrganization(index) {
    const container = document.getElementById('organizationContainer');
    const sections = container.querySelectorAll('.dynamic-section');
    if (sections.length > 1) {
        sections[index].remove();
        updateRemoveButtons('organizationContainer');
        showNotification('Organization removed', 'info');
    } else {
        showNotification('You must have at least one organization entry', 'error');
    }
}

// Sibling Functions
function addSibling() {
    const container = document.getElementById('siblingsContainer');
    const sections = container.querySelectorAll('.dynamic-section');
    const newIndex = sections.length;

    const newSection = document.createElement('div');
    newSection.className = 'dynamic-section';
    newSection.innerHTML = `
        <table class="form-table">
            <tr>
                <th>First Name</th>
                <td><input type="text" name="sibling[${newIndex}][FirstName]"></td>
                <th>Middle Name</th>
                <td><input type="text" name="sibling[${newIndex}][MiddleName]"></td>
            </tr>
            <tr>
                <th>Last Name</th>
                <td><input type="text" name="sibling[${newIndex}][LastName]"></td>
                <th>Nickname</th>
                <td><input type="text" name="sibling[${newIndex}][NickName]"></td>
            </tr>
            <tr>
                <th>Age</th>
                <td><input type="number" name="sibling[${newIndex}][Age]"></td>
                <th>Birth Order</th>
                <td><input type="text" name="sibling[${newIndex}][BirthOrder]" placeholder="e.g., 1st, 2nd"></td>
            </tr>
            <tr>
                <th>School ID</th>
                <td colspan="3"><input type="text" name="sibling[${newIndex}][SchoolId]"></td>
            </tr>
        </table>
        <button type="button" class="remove-section-btn" onclick="removeSibling(${newIndex})">
            <i class="fas fa-trash"></i> Remove Sibling
        </button>
    `;

    container.appendChild(newSection);
    updateRemoveButtons('siblingsContainer');
}

function removeSibling(index) {
    const container = document.getElementById('siblingsContainer');
    const sections = container.querySelectorAll('.dynamic-section');
    if (sections.length > 1) {
        sections[index].remove();
        updateRemoveButtons('siblingsContainer');
        showNotification('Sibling removed', 'info');
    } else {
        showNotification('You must have at least one sibling entry', 'error');
    }
}

// Friend Functions
function addFriend() {
    const container = document.getElementById('friendsContainer');
    const sections = container.querySelectorAll('.dynamic-section');
    const newIndex = sections.length;

    const newSection = document.createElement('div');
    newSection.className = 'dynamic-section';
    newSection.innerHTML = `
        <table class="form-table">
            <tr>
                <th>In School?</th>
                <td>
                    <select name="friend[${newIndex}][In_school]">
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                    </select>
                </td>
                <th>First Name</th>
                <td><input type="text" name="friend[${newIndex}][FirstName]"></td>
            </tr>
            <tr>
                <th>Middle Name</th>
                <td><input type="text" name="friend[${newIndex}][MiddleName]"></td>
                <th>Last Name</th>
                <td><input type="text" name="friend[${newIndex}][LastName]"></td>
            </tr>
        </table>
        <button type="button" class="remove-section-btn" onclick="removeFriend(${newIndex})">
            <i class="fas fa-trash"></i> Remove Friend
        </button>
    `;

    container.appendChild(newSection);
    updateRemoveButtons('friendsContainer');
}

function removeFriend(index) {
    const container = document.getElementById('friendsContainer');
    const sections = container.querySelectorAll('.dynamic-section');
    if (sections.length > 1) {
        sections[index].remove();
        updateRemoveButtons('friendsContainer');
        showNotification('Friend removed', 'info');
    } else {
        showNotification('You must have at least one friend entry', 'error');
    }
}

// Helper function to show/hide remove buttons
function updateRemoveButtons(containerId) {
    const container = document.getElementById(containerId);
    const sections = container.querySelectorAll('.dynamic-section');
    const removeButtons = container.querySelectorAll('.remove-section-btn');

    removeButtons.forEach(btn => {
        btn.style.display = sections.length > 1 ? 'inline-block' : 'none';
    });
}

// Initialize remove button visibility on page load
window.addEventListener('load', () => {
    updateRemoveButtons('educationContainer');
    updateRemoveButtons('organizationContainer');
    updateRemoveButtons('siblingsContainer');
    updateRemoveButtons('friendsContainer');

    // Add event listeners to required fields for real-time validation clearing
    document.querySelectorAll('[required]').forEach(field => {
        field.addEventListener('input', () => {
            if (field.value.trim()) {
                field.classList.remove('error');
            }
        });
    });
});
