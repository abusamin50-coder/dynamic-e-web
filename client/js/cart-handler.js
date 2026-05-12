/**
 * GLOBAL UI NOTIFICATIONS & CART HANDLER
 */
const CartHandler = {
    // 1. THE POPUP SYSTEM (TOAST) - RESPONSIVE VERSION
    showToast: (message, type = 'success') => {
        // Remove old ones first
        const existing = document.querySelector('.toast-popup');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        // Added responsive classes: bottom-5 left-5 right-5 for mobile, fixed position for desktop
        toast.className = `toast-popup fixed bottom-5 md:bottom-10 md:right-10 md:left-auto left-5 right-5 px-6 py-4 rounded-2xl text-white font-black shadow-2xl z-[10000] transition-all duration-500 transform translate-y-20 flex items-center space-x-3`;

        // Success = Blue (Professional), Error = Red
        toast.style.backgroundColor = type === 'success' ? '#2563eb' : '#dc2626';

        const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
        toast.innerHTML = `<i class="fa-solid ${icon} text-lg"></i> <span class="text-sm font-medium">${message}</span>`;

        document.body.appendChild(toast);

        // Slide Up Animation
        setTimeout(() => toast.classList.remove('translate-y-20'), 100);

        // Auto Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-10');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    },

    getToken: () => {
        const user = JSON.parse(localStorage.getItem('userInfo'));
        return user ? user.token : null;
    }
};

// EXPOSE TO ALL OTHER JS FILES
window.showToast = CartHandler.showToast;

window.globalAddToCart = async (productId, isOutOfStock) => {
    if (isOutOfStock) return;
    const token = CartHandler.getToken();
    if (!token) { window.showAuthModal('Cart'); return; }

    try {
        const res = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ productId, qty: 1 })
        });
        if (res.ok) {
            window.showToast("Product added to cart!");
            if (window.updateProfileDropdown) await window.updateProfileDropdown();
        }
    } catch (err) { console.error(err); }
};

// NEW FUNCTION FOR BUY NOW
window.globalBuyNow = async (productId, isOutOfStock) => {
    if (isOutOfStock) return;
    const token = CartHandler.getToken();
    if (!token) { window.showAuthModal('purchase'); return; }

    try {
        const res = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ productId, qty: 1 })
        });
        
        if (res.ok) {
            window.showToast("Product added to cart. Redirecting...");
            setTimeout(() => {
                window.location.href = '/pages/cart.html';
            }, 1000);
        } else {
            window.showToast("Failed to add to cart.", "error");
        }
    } catch (err) { 
        console.error(err); 
        window.showToast("Something went wrong.", "error");
    }
};