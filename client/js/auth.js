// Register Functionality
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();

            if (res.ok) {
                alert('Registration Successful!');
                localStorage.setItem('userInfo', JSON.stringify(data));
                window.location.href = '/'; // Redirect to home
            } else {
                alert(data.message || 'Registration Failed');
            }
        } catch (err) {
            console.error(err);
            alert('Something went wrong');
        }
    });
}

// Login Functionality
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                alert('Login Successful!');
                localStorage.setItem('userInfo', JSON.stringify(data));
                window.location.href = '/'; // Redirect to home
            } else {
                alert(data.message || 'Invalid Credentials');
            }
        } catch (err) {
            console.error(err);
            alert('Login Failed');
        }
    });
}