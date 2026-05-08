/**
 * PROFESSIONAL PROFILE ENGINE
 * Optimized for isolated Name and Password updates.
 */

const getAuthToken = () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo).token : null;
};

// 1. Fetch & Display Data
const loadProfileData = async () => {
    const token = getAuthToken();
    if (!token) { window.location.href = '/pages/login.html'; return; }

    try {
        const res = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await res.json();

        if(document.getElementById('avatar-circle')) document.getElementById('avatar-circle').innerText = user.name.charAt(0).toUpperCase();
        if(document.getElementById('display-name')) document.getElementById('display-name').innerText = user.name;
        if(document.getElementById('display-email')) document.getElementById('display-email').innerText = user.email;
        if(document.getElementById('input-name')) document.getElementById('input-name').value = user.name;
        if(document.getElementById('input-email')) document.getElementById('input-email').value = user.email;
    } catch (err) { console.error(err); }
};

// 2. Handle Name Update
const nameForm = document.getElementById('profile-update-form');
if (nameForm) {
    nameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = getAuthToken();
        const newName = document.getElementById('input-name').value;

        try {
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: newName }) // Sends ONLY name
            });

            const data = await res.json();
            if (res.ok) {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                userInfo.name = data.name;
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
                
                if (window.showToast) window.showToast("Account name updated!", "success");
                loadProfileData();
                if (window.updateProfileDropdown) window.updateProfileDropdown();
            } else {
                if (window.showToast) window.showToast(data.message || "Error", "error");
            }
        } catch (err) { console.error(err); }
    });
}

// 3. Handle Password Update
const passForm = document.getElementById('password-update-form');
if (passForm) {
    passForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = getAuthToken();
        const pass = document.getElementById('input-password').value;
        const confirm = document.getElementById('input-confirm-password').value;

        if (pass !== confirm) {
            if (window.showToast) window.showToast("Passwords do not match!", "error");
            return;
        }

        try {
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ password: pass }) // Sends ONLY password
            });

            const data = await res.json();
            if (res.ok) {
                if (window.showToast) window.showToast("Password updated securely!", "success");
                passForm.reset();
            } else {
                if (window.showToast) window.showToast(data.message || "Failed", "error");
            }
        } catch (err) { console.error(err); }
    });
}

document.addEventListener('DOMContentLoaded', loadProfileData);