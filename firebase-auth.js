// ============================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyBULd48Olrx6xSygbUnobqFWvSomPbA6Kk",
    authDomain: "byte-studio-76d70.firebaseapp.com",
    projectId: "byte-studio-76d70",
    storageBucket: "byte-studio-76d70.firebasestorage.app",
    messagingSenderId: "101716414946",
    appId: "1:101716414946:web:917fa1418ef23f829569bb",
    measurementId: "G-MJC1PL5PWX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ============================================
// ADMIN LOGIN FUNCTIONALITY
// ============================================

const loginForm = document.querySelector('.admin-overlay form');
if (loginForm) {
    const usernameInput = loginForm.querySelector('input[type="text"]');
    const passwordInput = loginForm.querySelector('input[type="password"]');
    const submitBtn = loginForm.querySelector('.submit-btn');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!email || !password) {
            showMessage('Please enter both email and password', 'error');
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        
        try {
            await auth.signInWithEmailAndPassword(email, password);
            showMessage('Login successful!', 'success');
            toggleAdmin();
            loginForm.reset();
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1000);
            
        } catch (error) {
            let errorMessage = 'Login failed. Please try again.';
            
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email format.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed attempts. Try again later.';
                    break;
            }
            
            showMessage(errorMessage, 'error');
            console.error('Login error:', error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login System';
        }
    });
}

// ============================================
// AUTH STATE OBSERVER
// ============================================

auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User logged in:', user.email);
        showAdminContent();
        addLogoutButton();
    } else {
        console.log('User logged out');
        hideAdminContent();
    }
});

// ============================================
// ADMIN CONTENT MANAGEMENT
// ============================================

function showAdminContent() {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        el.style.display = 'block';
    });
    
    // Change admin button to redirect to dashboard
    const adminBtn = document.querySelector('.admin-login-btn');
    if (adminBtn) {
        adminBtn.innerHTML = 'ADMIN PANEL 🔓';
        // Remove the toggleAdmin onclick, add dashboard redirect
        adminBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = 'admin-dashboard.html';
        };
    }
}

function hideAdminContent() {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        el.style.display = 'none';
    });
    
    const adminBtn = document.querySelector('.admin-login-btn');
    if (adminBtn) {
        adminBtn.innerHTML = 'ADMIN LOGIN 🔒';
        // Restore the toggleAdmin onclick
        adminBtn.onclick = (e) => {
            e.preventDefault();
            toggleAdmin();
        };
    }
}

// ============================================
// LOGOUT FUNCTIONALITY
// ============================================

function addLogoutButton() {
    const navBottom = document.querySelector('.nav-bottom');
    
    if (document.querySelector('.logout-btn')) return;
    
    const logoutBtn = document.createElement('a');
    logoutBtn.href = '#';
    logoutBtn.className = 'logout-btn hover-target';
    logoutBtn.style.gridColumn = 'span 2';
    logoutBtn.style.background = '#ff0000';
    logoutBtn.style.color = '#fff';
    logoutBtn.textContent = 'LOGOUT ✕';
    logoutBtn.onclick = handleLogout;
    
    navBottom.appendChild(logoutBtn);
}

async function handleLogout(e) {
    e.preventDefault();
    
    try {
        await auth.signOut();
        showMessage('Logged out successfully', 'success');
        
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) logoutBtn.remove();
        
        // Redirect to home if on admin page
        if (window.location.pathname.includes('admin-dashboard')) {
            window.location.href = 'index.html';
        }
        
    } catch (error) {
        showMessage('Error logging out', 'error');
        console.error('Logout error:', error);
    }
}

// ============================================
// MESSAGE NOTIFICATION SYSTEM
// ============================================

function showMessage(message, type = 'info') {
    const existingMsg = document.querySelector('.auth-message');
    if (existingMsg) existingMsg.remove();
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `auth-message ${type}`;
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
        animation: 'slideDown 0.3s ease'
    });
    
    document.body.appendChild(msgDiv);
    
    setTimeout(() => {
        msgDiv.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => msgDiv.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, -100%); opacity: 0; }
    }
    .admin-only {
        display: none;
    }
`;
document.head.appendChild(style);