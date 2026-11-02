// Sends the homepage contact form (#contactForm) to POST /api/contact.
(function () {
    'use strict';

    const form = document.getElementById('contactForm');
    if (!form) return;

    const statusMessage = document.getElementById('formStatus');
    const submitButton = form.querySelector('.form-submit');
    const apiBase = (window.TEQVORA_CONFIG && window.TEQVORA_CONFIG.API_BASE_URL) || '';

    let isSubmitting = false;

    function setStatus(message, kind) {
        statusMessage.textContent = message;
        statusMessage.classList.remove('success', 'error');
        if (kind) statusMessage.classList.add(kind);
    }

    function clearFieldErrors() {
        form.querySelectorAll('.form-group.has-error').forEach(function (group) {
            group.classList.remove('has-error');
            const message = group.querySelector('.field-error');
            if (message) message.remove();
        });
    }

    function showFieldErrors(errors) {
        Object.keys(errors).forEach(function (fieldName) {
            const field = form.elements[fieldName];
            const group = field && field.closest ? field.closest('.form-group') : null;
            if (!group) return;

            const message = document.createElement('span');
            message.className = 'field-error';
            message.textContent = errors[fieldName];
            group.classList.add('has-error');
            group.appendChild(message);
        });
    }

    function setLoading(isLoading) {
        isSubmitting = isLoading;
        submitButton.disabled = isLoading;
        submitButton.classList.toggle('is-loading', isLoading);
    }

    function readFormValues() {
        return {
            type: 'contact',
            name: form.elements.name.value,
            email: form.elements.email.value,
            service: form.elements.service.value,
            subject: form.elements.subject.value,
            message: form.elements.message.value,
            consent: form.elements.consent.checked,
            page: window.location.pathname
        };
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        if (isSubmitting) return;

        clearFieldErrors();
        setStatus('');

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        setLoading(true);
        setStatus('Sending your message...');

        try {
            const response = await fetch(apiBase + '/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(readFormValues())
            });
            const data = await response.json().catch(function () { return {}; });

            if (!response.ok) {
                if (data.errors) showFieldErrors(data.errors);
                setStatus(data.message || 'We could not send your message. Please try again.', 'error');
                return;
            }

            form.reset();
            setStatus(data.message, 'success');
        } catch (error) {
            console.error('Contact form request failed:', error);
            setStatus('Could not reach the server. Check your connection and try again.', 'error');
        } finally {
            setLoading(false);
        }
    });
})();
