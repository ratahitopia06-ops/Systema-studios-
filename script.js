document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('audit-form');
    const statusMsg = document.getElementById('form-status');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const inputs = form.querySelectorAll('input[required]');
        let isValid = true;

        // Reset states
        inputs.forEach(input => {
            input.classList.remove('invalid');
        });
        statusMsg.className = 'status-msg';
        statusMsg.textContent = '';
        statusMsg.style.display = 'none';

        // Simple validation
        inputs.forEach(input => {
            if (!input.value || (input.type === 'email' && !input.value.includes('@'))) {
                input.classList.add('invalid');
                isValid = false;
            }
        });

        if (!isValid) {
            statusMsg.textContent = 'Please correct the highlighted errors.';
            statusMsg.classList.add('error');
            statusMsg.style.display = 'block';
            return;
        }

        // Processing state
        submitBtn.disabled = true;
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Processing...';

        const payload = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            website: document.getElementById('website').value.trim(),
            message: document.getElementById('message').value.trim()
        };

        try {
            // Attempt real API call
            const response = await fetch('/api/audit-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                showSuccess();
            } else {
                // If it's a validation error from server
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Submission failed.');
            }
        } catch (err) {
            // Always report failures truthfully in public environments.
            console.warn('API submission failed:', err);
            statusMsg.textContent = err.message || 'Could not submit right now. Please try again.';
            statusMsg.classList.add('error');
            statusMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }

        function showSuccess() {
            statusMsg.textContent = 'Audit request submitted successfully! Our lead analyst will be in touch shortly.';
            statusMsg.classList.add('success');
            statusMsg.style.display = 'block';
            form.reset();
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;

            // Fade out success message
            setTimeout(() => {
                statusMsg.style.opacity = '0';
                setTimeout(() => {
                    statusMsg.style.display = 'none';
                    statusMsg.style.opacity = '1';
                }, 500);
            }, 8000);
        }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
