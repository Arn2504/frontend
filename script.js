// script.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registration-form');
    const fullNameInput = document.getElementById('full-name');
    const studentEmailInput = document.getElementById('student-email');
    const studentIdInput = document.getElementById('student-id');
    const eventSelect = document.getElementById('event-select');

    const nameError = document.getElementById('name-error');
    const emailError = document.getElementById('email-error');
    const idError = document.getElementById('id-error');
    const eventError = document.getElementById('event-error');
    const statusMessage = document.getElementById('status-message');

    const registerButtons = document.querySelectorAll('.btn-register');

    // Strict university email pattern: something before @, domain must be exactly univ.edu.ph
    const EMAIL_PATTERN = /^[^\s@]+@univ\.edu\.ph$/i;

    // Respect users who have reduced motion turned on
    const scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth';

    // Tracks the first invalid field so focus can be moved to it
    let firstInvalid = null;

    // Preselect Event and Scroll to Form
    registerButtons.forEach(button => {
        button.addEventListener('click', () => {
            const eventId = button.getAttribute('data-event-id');
            if (eventId && eventSelect) {
                eventSelect.value = eventId;
                clearError(eventSelect, eventError);

                const formSection = document.getElementById('registration-form-section');
                formSection.scrollIntoView({ behavior: scrollBehavior });

                // preventScroll stops focus() from cancelling the smooth scroll above
                fullNameInput.focus({ preventScroll: true });
            }
        });
    });

    // Inline Error Helpers
    function showError(inputElement, errorElement, message) {
        errorElement.textContent = message;
        inputElement.classList.add('input-invalid');
        inputElement.setAttribute('aria-invalid', 'true');
        if (!firstInvalid) {
            firstInvalid = inputElement;
        }
    }

    function clearError(inputElement, errorElement) {
        errorElement.textContent = '';
        inputElement.classList.remove('input-invalid');
        inputElement.removeAttribute('aria-invalid');
    }

    function clearAllErrors() {
        clearError(fullNameInput, nameError);
        clearError(studentEmailInput, emailError);
        clearError(studentIdInput, idError);
        clearError(eventSelect, eventError);
        statusMessage.textContent = '';
        statusMessage.className = 'status-container';
        firstInvalid = null;
    }

    // Input listeners to clear errors on change
    fullNameInput.addEventListener('input', () => clearError(fullNameInput, nameError));
    studentEmailInput.addEventListener('input', () => clearError(studentEmailInput, emailError));
    studentIdInput.addEventListener('input', () => clearError(studentIdInput, idError));
    eventSelect.addEventListener('change', () => clearError(eventSelect, eventError));

    // Returns the number of seats left for an event (0 if unknown)
    function getSeatsRemaining(eventId) {
        const seatElement = document.getElementById(`seats-${eventId}`);
        return seatElement ? parseInt(seatElement.textContent, 10) : 0;
    }

    // Form Validation Logic
    function validateForm() {
        let isValid = true;
        clearAllErrors();

        // Full Name Validation
        if (!fullNameInput.value.trim()) {
            showError(fullNameInput, nameError, 'Full Name is required.');
            isValid = false;
        }

        // Student Email Validation
        const emailValue = studentEmailInput.value.trim();
        if (!emailValue) {
            showError(studentEmailInput, emailError, 'Student Email is required.');
            isValid = false;
        } else if (!EMAIL_PATTERN.test(emailValue)) {
            showError(studentEmailInput, emailError, 'Enter a valid email address ending with @univ.edu.ph.');
            isValid = false;
        }

        // Student ID Validation
        if (!studentIdInput.value.trim()) {
            showError(studentIdInput, idError, 'Student ID is required.');
            isValid = false;
        }

        // Event Select Validation (including seat availability)
        if (!eventSelect.value) {
            showError(eventSelect, eventError, 'Please select an event.');
            isValid = false;
        } else if (getSeatsRemaining(eventSelect.value) <= 0) {
            showError(eventSelect, eventError, 'No seats remaining for this event. Please choose another event.');
            isValid = false;
        }

        // Move keyboard and screen reader focus to the first field with an error
        if (!isValid && firstInvalid) {
            firstInvalid.focus();
        }

        return isValid;
    }

    // Form Submit Handler
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (validateForm()) {
            const selectedEventId = eventSelect.value;
            const selectedEventOption = eventSelect.options[eventSelect.selectedIndex].text;
            const seatElement = document.getElementById(`seats-${selectedEventId}`);

            // Validation already confirmed at least one seat is available
            seatElement.textContent = (getSeatsRemaining(selectedEventId) - 1).toString();

            statusMessage.className = 'status-container status-success';
            statusMessage.textContent = `Registration successful! You are registered for ${selectedEventOption}.`;

            form.reset();
            statusMessage.scrollIntoView({ behavior: scrollBehavior });
        }
    });
});