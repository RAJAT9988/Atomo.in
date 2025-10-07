document.addEventListener('DOMContentLoaded', () => {
    const buyButtons = document.querySelectorAll('.buy-button');
    const popup = document.getElementById('subscription-popup');
    const subscribeButton = document.getElementById('subscribe-button');
    const emailInput = document.getElementById('email-input');

    // Show popup when any Buy button is clicked
    buyButtons.forEach(button => {
        button.addEventListener('click', () => {
            popup.classList.add('active');
        });
    });

    // Hide popup when clicking outside the popup content
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.classList.remove('active');
        }
    });

    // Handle subscription to send data to backend
    subscribeButton.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        if (!email) {
            alert('Please enter a valid email address.');
            return;
        }
        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            const result = await response.json();
            if (result.success) {
                alert('Thank you for subscribing!');
                emailInput.value = ''; // Clear the input
                popup.classList.remove('active'); // Close the popup
            } else {
                alert('Subscription failed: ' + result.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
});