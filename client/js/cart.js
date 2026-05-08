const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('userInfo'));
    return user ? user.token : null;
};

const fetchCartItems = async () => {
    const wrapper = document.getElementById('cart-items-wrapper');
    const badge = document.getElementById('cart-count-badge');
    const subtotalEl = document.getElementById('subtotal-amount');
    const totalEl = document.getElementById('total-amount');
    const token = getAuthToken();

    if (!token) return;

    try {
        const res = await fetch('/api/cart', { headers: { 'Authorization': `Bearer ${token}` } });
        const cart = await res.json();
        const items = cart.cartItems || [];

        if (badge) badge.innerText = `(${items.length} Items)`;

        if (items.length === 0) {
            if (wrapper) wrapper.innerHTML = `<div class="bg-white p-20 rounded-[3rem] text-center border border-dashed border-gray-200"><h2 class="text-2xl font-black">Your cart is empty</h2><a href="/" class="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black mt-8 inline-block shadow-lg">Browse Products</a></div>`;
            if (subtotalEl) subtotalEl.innerText = "$0.00";
            if (totalEl) totalEl.innerText = "$0.00";
            return;
        }

        let subtotal = 0;
        if (wrapper) {
            wrapper.innerHTML = items.map(item => {
                subtotal += item.price * item.qty;
                return `
                <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6 mb-4">
                    <img src="${item.image}" class="h-20 w-20 object-contain rounded-xl">
                    <div class="flex-1">
                        <h4 class="font-bold text-gray-800">${item.name}</h4>
                        <p class="text-blue-600 font-black">$${item.price.toFixed(2)}</p>
                    </div>
                    
                    <!-- QUANTITY CONTROL -->
                    <div class="flex items-center bg-gray-100 rounded-2xl p-1">
                        <button onclick="changeQty('${item.product}', ${item.qty - 1})" class="h-10 w-10 bg-white rounded-xl shadow-sm hover:bg-red-500 hover:text-white transition font-black">-</button>
                        <span class="px-6 font-black text-gray-800">${item.qty}</span>
                        <button onclick="changeQty('${item.product}', ${item.qty + 1})" class="h-10 w-10 bg-white rounded-xl shadow-sm hover:bg-blue-600 hover:text-white transition font-black">+</button>
                    </div>

                    <button onclick="handleRemoveItem('${item.product}')" class="text-red-500 hover:bg-red-50 p-3 rounded-xl transition">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>`;
            }).join('');
        }

        if(subtotalEl) subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
        if(totalEl) totalEl.innerText = `$${subtotal.toFixed(2)}`;

    } catch (err) { console.error(err); }
};

// Function to update Quantity
window.changeQty = async (productId, newQty) => {
    if (newQty < 1) return window.handleRemoveItem(productId);

    const token = getAuthToken();
    try {
        const res = await fetch('/api/cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ productId, qty: newQty })
        });
        if (res.ok) {
            fetchCartItems();
            if (window.updateProfileDropdown) window.updateProfileDropdown();
        }
    } catch (err) { console.error(err); }
};

window.handleRemoveItem = async (productId) => {
    const token = getAuthToken();
    if (!confirm("Remove item?")) return;
    const res = await fetch(`/api/cart/${productId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
        fetchCartItems();
        if (window.updateProfileDropdown) window.updateProfileDropdown();
        if (window.showToast) window.showToast("Item removed from cart", "error");
    }
};

document.addEventListener('DOMContentLoaded', fetchCartItems);