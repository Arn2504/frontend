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

    // Admin View Elements
    const toggleAdminBtn = document.getElementById('toggle-admin-btn');
    const studentView = document.getElementById('student-view');
    const adminView = document.getElementById('admin-view');
    const attendeesTableBody = document.getElementById('attendees-table-body');
    const noAttendeesMsg = document.getElementById('no-attendees-msg');
    const navEvents = document.getElementById('nav-events');
    const navRegister = document.getElementById('nav-register');

    // Strict university email pattern: something before @, domain must be exactly univ.edu.ph
    const EMAIL_PATTERN = /^[^\s@]+@univ\.edu\.ph$/i;

    // Respect users who have reduced motion turned on
    const scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth';

    // Tracks the first invalid field so focus can be moved to it
    let firstInvalid = null;

    // Load persisted registrations from localStorage
    let registrations = JSON.parse(localStorage.getItem('campusRegistrations')) || [];

    // Helper to prevent XSS output in Admin table
    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (m) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        })[m]);
    }

    // Render registered attendees into Admin Table
    function renderAdminTable() {
        if (!attendeesTableBody) return;
        attendeesTableBody.innerHTML = '';

        if (registrations.length === 0) {
            if (noAttendeesMsg) noAttendeesMsg.style.display = 'block';
        } else {
            if (noAttendeesMsg) noAttendeesMsg.style.display = 'none';
            registrations.forEach((reg, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${escapeHtml(reg.fullName)}</td>
                    <td>${escapeHtml(reg.email)}</td>
                    <td>${escapeHtml(reg.studentId)}</td>
                    <td>${escapeHtml(reg.eventName)}</td>
                    <td>${escapeHtml(reg.timestamp)}</td>
                `;
                attendeesTableBody.appendChild(row);
            });
        }
    }

    // Toggle between Student View and Admin View
    if (toggleAdminBtn) {
        toggleAdminBtn.addEventListener('click', () => {
            const isAdminVisible = !adminView.classList.contains('hidden');

            if (isAdminVisible) {
                adminView.classList.add('hidden');
                studentView.classList.remove('hidden');
                toggleAdminBtn.textContent = 'Admin View';
                if (navEvents) navEvents.style.display = 'inline';
                if (navRegister) navRegister.style.display = 'inline';
            } else {
                renderAdminTable();
                studentView.classList.add('hidden');
                adminView.classList.remove('hidden');
                toggleAdminBtn.textContent = 'Student View';
                if (navEvents) navEvents.style.display = 'none';
                if (navRegister) navRegister.style.display = 'none';
            }
        });
    }

    // Set accessibility attributes for status message container
    if (statusMessage) {
        statusMessage.setAttribute('aria-live', 'polite');
        statusMessage.setAttribute('role', 'status');
    }

    // Helper: Returns the number of seats left for an event (0 if unknown)
    function getSeatsRemaining(eventId) {
        const seatElement = document.getElementById(`seats-${eventId}`);
        return seatElement ? parseInt(seatElement.textContent, 10) : 0;
    }

    // Helper: Update UI for sold-out events and buttons
    function updateEventAvailability(eventId) {
        const remaining = getSeatsRemaining(eventId);
        if (remaining <= 0) {
            // Disable event selection option if available
            const option = eventSelect.querySelector(`option[value="${eventId}"]`);
            if (option) {
                option.disabled = true;
                if (!option.textContent.includes('(Sold Out)')) {
                    option.textContent += ' (Sold Out)';
                }
            }

            // Disable corresponding register button on event cards
            const targetButton = document.querySelector(`.btn-register[data-event-id="${eventId}"]`);
            if (targetButton) {
                targetButton.disabled = true;
                targetButton.textContent = 'Sold Out';
                targetButton.classList.add('btn-disabled');
            }
        }
    }

    // Check initial seats on page load
    Array.from(eventSelect.options).forEach(option => {
        if (option.value) {
            updateEventAvailability(option.value);
        }
    });

    // Preselect Event and Scroll to Form
    registerButtons.forEach(button => {
        button.addEventListener('click', () => {
            const eventId = button.getAttribute('data-event-id');
            if (eventId && eventSelect) {
                if (getSeatsRemaining(eventId) <= 0) return;

                eventSelect.value = eventId;
                clearError(eventSelect, eventError);

                const formSection = document.getElementById('registration-form-section');
                if (formSection) {
                    formSection.scrollIntoView({ behavior: scrollBehavior });
                }

                // preventScroll stops focus() from cancelling smooth scroll
                fullNameInput.focus({ preventScroll: true });
            }
        });
    });

    // Inline Error Helpers
    function showError(inputElement, errorElement, message) {
        if (errorElement) errorElement.textContent = message;
        inputElement.classList.add('input-invalid');
        inputElement.setAttribute('aria-invalid', 'true');
        if (!firstInvalid) {
            firstInvalid = inputElement;
        }
    }

    function clearError(inputElement, errorElement) {
        if (errorElement) errorElement.textContent = '';
        inputElement.classList.remove('input-invalid');
        inputElement.removeAttribute('aria-invalid');
    }

    function clearAllErrors() {
        clearError(fullNameInput, nameError);
        clearError(studentEmailInput, emailError);
        clearError(studentIdInput, idError);
        clearError(eventSelect, eventError);
        if (statusMessage) {
            statusMessage.textContent = '';
            statusMessage.className = 'status-container';
        }
        firstInvalid = null;
    }

    // Input listeners to clear errors on change
    fullNameInput.addEventListener('input', () => clearError(fullNameInput, nameError));
    studentEmailInput.addEventListener('input', () => clearError(studentEmailInput, emailError));
    studentIdInput.addEventListener('input', () => clearError(studentIdInput, idError));
    eventSelect.addEventListener('change', () => clearError(eventSelect, eventError));

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

    // Form Reset Event Handler
    form.addEventListener('reset', () => {
        clearAllErrors();
    });

    // Form Submit Handler
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (validateForm()) {
            const selectedEventId = eventSelect.value;
            const selectedEventOption = eventSelect.options[eventSelect.selectedIndex].text;
            const seatElement = document.getElementById(`seats-${selectedEventId}`);

            // Deduct seat count
            const remainingSeats = getSeatsRemaining(selectedEventId) - 1;
            if (seatElement) {
                seatElement.textContent = remainingSeats.toString();
            }

            // Update disabled status if sold out
            updateEventAvailability(selectedEventId);

            // Save record locally for Admin View
            const newRecord = {
                fullName: fullNameInput.value.trim(),
                email: studentEmailInput.value.trim(),
                studentId: studentIdInput.value.trim(),
                eventName: selectedEventOption,
                timestamp: new Date().toLocaleString()
            };

            registrations.push(newRecord);
            localStorage.setItem('campusRegistrations', JSON.stringify(registrations));

            // Set success message
            if (statusMessage) {
                statusMessage.className = 'status-container status-success';
                statusMessage.textContent = `Registration successful! You are registered for ${selectedEventOption}.`;
                statusMessage.scrollIntoView({ behavior: scrollBehavior });
            }

            form.reset();
        }
    });

    // Initial load call
    renderAdminTable();
});