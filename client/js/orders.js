/**
 * ORDER & INVOICE ENGINE
 */

const getToken = () => JSON.parse(localStorage.getItem('userInfo'))?.token;

// 1. FETCH ALL ORDERS (For history page)
const fetchMyOrders = async () => {
    const list = document.getElementById('orders-list');
    if (!list) return;

    try {
        const res = await fetch('/api/orders/myorders', {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const result = await res.json();
        const orders = result.data;

        if (orders.length === 0) {
            list.innerHTML = `<div class="bg-white p-12 rounded-3xl text-center text-gray-400 font-bold border border-dashed border-gray-200">No orders found.</div>`;
            return;
        }

        list.innerHTML = orders.map(order => {
            const date = new Date(order.createdAt).toLocaleDateString();
            const statusColor = order.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600';
            
            return `
            <div class="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 hover:border-blue-500 transition-all">
                <div class="bg-gray-50 h-16 w-16 rounded-2xl flex items-center justify-center text-blue-600">
                    <i class="fa-solid fa-box-archive text-2xl"></i>
                </div>
                <div class="flex-1 text-center md:text-left">
                    <p class="text-xs font-black text-gray-400 uppercase tracking-widest">Order ID: ${order._id.substring(0, 10)}...</p>
                    <h3 class="text-lg font-black text-gray-800 mt-1">${order.orderItems.length} Products Ordered</h3>
                    <p class="text-sm font-bold text-gray-500 mt-1">Placed on ${date}</p>
                </div>
                <div class="text-center md:text-right">
                    <p class="text-2xl font-black text-slate-900">$${order.totalPrice.toFixed(2)}</p>
                    <span class="inline-block mt-2 px-4 py-1 rounded-full text-[10px] font-black uppercase ${statusColor}">
                        ${order.status}
                    </span>
                </div>
                <a href="order-details.html?id=${order._id}" class="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-black transition">
                    View Details
                </a>
            </div>
            `;
        }).join('');

    } catch (err) { console.error(err); }
};

// 2. FETCH SINGLE ORDER (For invoice page)
const fetchOrderDetails = async () => {
    const card = document.getElementById('invoice-card');
    if (!card) return;

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    try {
        const res = await fetch(`/api/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const result = await res.json();
        const order = result.data;

        card.innerHTML = `
            <div class="p-8 md:p-12 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start gap-8 bg-gray-50/50">
                <div>
                    <h2 class="text-3xl font-black text-blue-600 tracking-tighter">ElectroMart</h2>
                    <p class="text-gray-400 text-sm mt-1">Official Purchase Invoice</p>
                </div>
                <div class="text-left md:text-right">
                    <p class="text-xs font-black text-gray-400 uppercase tracking-widest">Order Receipt</p>
                    <p class="text-lg font-black text-gray-800 mt-1">#${order._id}</p>
                    <p class="text-sm font-bold text-gray-500">${new Date(order.createdAt).toLocaleString()}</p>
                </div>
            </div>

            <div class="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <h4 class="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">Customer Details</h4>
                    <p class="font-black text-gray-800 text-xl">${order.user.name}</p>
                    <p class="text-gray-500 font-medium">${order.user.email}</p>
                    <p class="text-gray-500 font-medium mt-1">${order.shippingAddress.phone}</p>
                </div>
                <div>
                    <h4 class="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">Shipping Destination</h4>
                    <p class="text-gray-800 font-bold leading-relaxed">${order.shippingAddress.address}</p>
                    <p class="text-gray-800 font-bold">${order.shippingAddress.city}, ${order.shippingAddress.postalCode}</p>
                </div>
            </div>

            <div class="px-8 md:px-12 pb-12">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                            <th class="py-4">Product Name</th>
                            <th class="py-4 text-center">Qty</th>
                            <th class="py-4 text-right">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.orderItems.map(item => `
                            <tr class="border-b border-gray-50">
                                <td class="py-5 font-bold text-gray-800">${item.name}</td>
                                <td class="py-5 text-center font-black text-gray-500">${item.qty}</td>
                                <td class="py-5 text-right font-black text-gray-900">$${(item.price * item.qty).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="mt-8 flex justify-end">
                    <div class="w-full md:w-64 space-y-3">
                        <div class="flex justify-between text-gray-400 font-bold">
                            <span>Subtotal:</span>
                            <span class="text-gray-800">$${order.totalPrice.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between text-gray-400 font-bold">
                            <span>Shipping:</span>
                            <span class="text-green-500">FREE</span>
                        </div>
                        <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                            <span class="text-lg font-black text-gray-800">Total:</span>
                            <span class="text-3xl font-black text-blue-600">$${order.totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="p-6 bg-blue-600 text-white text-center text-xs font-black uppercase tracking-widest">
                Payment Status: ${order.paymentMethod} - ${order.isPaid ? 'PAID' : 'DUE ON DELIVERY'}
            </div>
        `;

    } catch (err) { 
        console.error(err);
        card.innerHTML = `<div class="p-20 text-center text-red-500 font-bold">Order Not Found.</div>`;
    }
};

// INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    fetchMyOrders();
    fetchOrderDetails();
});