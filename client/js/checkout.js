/**
 * CHECKOUT ENGINE
 */

const getAuthUser = () => JSON.parse(localStorage.getItem('userInfo'));

let checkoutItems = [];
let totalOrderPrice = 0;

// 1. Load Current Bag for Summary
const loadBag = async () => {
    const user = getAuthUser();
    const list = document.getElementById('checkout-items-list');
    const subtotalEl = document.getElementById('summary-subtotal');
    const totalEl = document.getElementById('summary-total');

    if (!user) { window.location.href = '/pages/login.html'; return; }

    try {
        const res = await fetch('/api/cart', { headers: { 'Authorization': `Bearer ${user.token}` } });
        const cart = await res.json();
        checkoutItems = cart.cartItems || [];

        if (checkoutItems.length === 0) { window.location.href = '/pages/cart.html'; return; }

        let subtotal = 0;
        list.innerHTML = checkoutItems.map(item => {
            subtotal += item.price * item.qty;
            return `
                <div class="flex items-center space-x-4">
                    <img src="${item.image}" class="h-12 w-12 object-contain bg-white rounded-lg p-1">
                    <div class="flex-1">
                        <p class="text-sm font-bold line-clamp-1">${item.name}</p>
                        <p class="text-[10px] text-slate-400 font-black">${item.qty} x $${item.price.toFixed(2)}</p>
                    </div>
                </div>
            `;
        }).join('');

        totalOrderPrice = subtotal;
        subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
        totalEl.innerText = `$${subtotal.toFixed(2)}`;

    } catch (err) { console.error(err); }
};

// 2. Form Submission
document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = getAuthUser();

    const orderData = {
        orderItems: checkoutItems,
        shippingAddress: {
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            postalCode: document.getElementById('postalCode').value,
            phone: document.getElementById('phone').value
        },
        paymentMethod: 'Cash on Delivery',
        totalPrice: totalOrderPrice
    };

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify(orderData)
        });

        if (res.ok) {
            alert("Order Placed Successfully!");
            // Redirect to Order Success or History
            window.location.href = '/pages/order-history.html';
        } else {
            alert("Error placing order. Please try again.");
        }
    } catch (err) { console.error(err); }
});

document.addEventListener('DOMContentLoaded', loadBag);