document.addEventListener('DOMContentLoaded', function() {
    // Hamburger Menu Functionality
    function initializeHamburgerMenu() {
        const hamburger = document.getElementById('hamburger');
        const navList = document.querySelector('#navbar ul');

        if (!hamburger || !navList) {
            console.warn('Hamburger or navList not found!');
            return;
        }

        hamburger.addEventListener('click', function () {
            navList.classList.toggle('active');
            this.classList.toggle('open');

            const navItems = document.querySelectorAll('#navbar ul li');
            navItems.forEach((item, index) => {
                if (navList.classList.contains('active')) {
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, index * 100);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(-10px)';
                }
            });
        });

        const navLinks = document.querySelectorAll('#navbar a');
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                navList.classList.remove('active');
                hamburger.classList.remove('open');
                const navItems = document.querySelectorAll('#navbar ul li');
                navItems.forEach(item => {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(-10px)';
                });
            });
        });
    }

    const captchaCheckbox = document.getElementById('captchaCheckbox');
    const submitBtn = document.getElementById('submitBtn');
    const contactForm = document.getElementById('contactForm');
    let captchaVerified = false;

    // Toggle captcha checkbox
    captchaCheckbox.addEventListener('click', function() {
        this.classList.toggle('checked');
        captchaVerified = this.classList.contains('checked');
        updateSubmitButton();
    });

    // Update submit button state
    function updateSubmitButton() {
        if (captchaVerified) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        } else {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.6';
            submitBtn.style.cursor = 'not-allowed';
        }
    }

    // Form submission
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!captchaVerified) {
            alert('Please verify that you are not a robot.');
            return;
        }

        // Validate required fields
        const requiredFields = contactForm.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.style.borderColor = '#e74c3c';
            } else {
                field.style.borderColor = '#ddd';
            }
        });

        if (!isValid) {
            alert('Please fill in all required fields.');
            return;
        }

        // Prepare form data
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            company: document.getElementById('company').value,
            website: document.getElementById('website').value,
            email: document.getElementById('email').value,
            mobile: document.getElementById('mobile').value,
            city: document.getElementById('city').value,
            country: document.getElementById('country').value,
            useCase: document.getElementById('useCase').value,
            additionalInfo: document.getElementById('additionalInfo').value,
            consent: document.getElementById('consent').checked,
        };

        try {
            const response = await fetch('/api/support', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            if (result.success) {
                alert('Form submitted successfully! We will contact you soon.');
                contactForm.reset();
                captchaCheckbox.classList.remove('checked');
                captchaVerified = false;
                updateSubmitButton();
            } else {
                alert('Submission failed: ' + result.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });

    // Initialize components
    initializeHamburgerMenu();
    updateSubmitButton();
});
