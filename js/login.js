document.addEventListener('DOMContentLoaded', function() {
    setupFormHandlers();
});

function setupFormHandlers() {
    const loginForm = document.querySelector('#loginForm form');
    const signupForm = document.querySelector('#signupForm form');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => handleSubmit(e, 'login'));
    }
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => handleSubmit(e, 'signup'));
    }
}

async function handleSubmit(event, formType) {
    event.preventDefault();
    const form = event.target;
    const button = form.querySelector('.login-btn');
    button.classList.add('loading');

    try {
        const formData = new FormData(form);
        const userData = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        if (!userData.username || !userData.password) {
            throw new Error('Please fill in all fields');
        }

        const response = await fetch(`http://localhost:5000/api/${formType}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'An error occurred');
        }

        if (formType === 'login') {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', userData.username);
            window.location.href = 'stocks.html';
        } else {
            showNotification('Account created successfully! Please sign in.', 'success');
            switchForm('login');
            form.reset();
        }

    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        button.classList.remove('loading');
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const backgroundColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    
    notification.className = `fixed top-4 right-4 ${backgroundColor} text-white px-6 py-3 rounded-lg shadow-lg transform translate-y-[-100%] transition-transform duration-300`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.style.transform = 'translateY(0)';
    });
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateY(-100%)';
        notification.addEventListener('transitionend', () => {
            notification.remove();
        });
    }, 3000);
}

function switchForm(type) {
    const container = document.querySelector('.slide-container');
    const tabs = document.querySelectorAll('.auth-tab');
    const authOptions = document.querySelector('.auth-options');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update sliding background
    authOptions.dataset.active = type;
    
    // Smooth sliding transition
    if (type === 'signup') {
        container.style.transform = 'translateX(-50%)';
    } else {
        container.style.transform = 'translateX(0)';
    }
}

// Add form validation indicators
document.querySelectorAll('.login-input').forEach(input => {
    input.addEventListener('invalid', (e) => {
        e.preventDefault();
        input.classList.add('border-red-500');
    });
    
    input.addEventListener('input', () => {
        input.classList.remove('border-red-500');
    });
});