// ============================================
// CONTACT FORM HANDLER
// ============================================

const contactForm = document.querySelector('.contact-section form');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nameInput = contactForm.querySelector('input[type="text"]');
        const emailInput = contactForm.querySelector('input[type="email"]');
        const messageInput = contactForm.querySelector('textarea');
        const submitBtn = contactForm.querySelector('.submit-btn');
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const message = messageInput.value.trim();
        
        // Validation
        if (!name || !email || !message) {
            showContactMessage('Please fill in all fields', 'error');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showContactMessage('Please enter a valid email address', 'error');
            return;
        }
        
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        try {
            // Save to Firebase
            await firebase.firestore().collection('messages').add({
                name: name,
                email: email,
                message: message,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                read: false,
                replied: false
            });
            
            showContactMessage('Message sent successfully! We\'ll get back to you soon.', 'success');
            
            // Reset form
            contactForm.reset();
            
        } catch (error) {
            console.error('Error sending message:', error);
            showContactMessage('Failed to send message. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message*';
        }
    });
}

// ============================================
// MESSAGE NOTIFICATION
// ============================================

function showContactMessage(message, type = 'info') {
    const existingMsg = document.querySelector('.contact-message');
    if (existingMsg) existingMsg.remove();
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `contact-message ${type}`;
    msgDiv.textContent = message;
    
    Object.assign(msgDiv.style, {
        position: 'fixed',
        top: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '1rem 2rem',
        background: type === 'error' ? '#ff0000' : type === 'success' ? '#00ff00' : '#ffff00',
        color: '#000',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.9rem',
        fontWeight: '700',
        zIndex: '10003',
        border: '2px solid #000',
        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
        animation: 'slideDown 0.3s ease',
        maxWidth: '90%',
        textAlign: 'center'
    });
    
    document.body.appendChild(msgDiv);
    
    setTimeout(() => {
        msgDiv.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => msgDiv.remove(), 300);
    }, 4000);
}