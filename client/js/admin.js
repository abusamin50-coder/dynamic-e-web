/**
 * MASTER ADMIN ENGINE - RENDER EDITION
 * Handles: Stats, Users, Orders, Products, Categories
 */

const getAdmin = () => {
    const user = localStorage.getItem('userInfo');
    return user ? JSON.parse(user) : null;
};

// RELATIVE PATH API CALLS (Works on Localhost and Render)
const getAuthHeaders = () => {
    const admin = getAdmin();
    return { 
        'Authorization': `Bearer ${admin?.token}`,
        'Content-Type': 'application/json'
    };
};

const checkAdminAccess = () => {
    const admin = getAdmin();
    if (!window.location.pathname.includes('login.html') && (!admin || admin.role !== 'admin')) {
        window.location.href = '/';
    }
};

// --- 1. DASHBOARD & USERS ---
const fetchDashboard = async () => {
    const userTable = document.getElementById('user-table-body');
    const uCount = document.getElementById('total-users-count');
    const pCount = document.getElementById('total-products-count');
    if (!userTable) return;

    try {
        const res = await fetch('/api/users', { headers: getAuthHeaders() });
        const result = await res.json();
        if (uCount) uCount.innerText = result.data.length;

        userTable.innerHTML = result.data.map(u => {
            const isSelf = u._id === getAdmin()._id;
            return `
            <tr class="border-b hover:bg-slate-50 transition">
                <td class="p-4 font-bold text-slate-800">${u.name}<br><span class="text-[10px] text-slate-400 font-normal">${u.email}</span></td>
                <td class="p-4 font-black text-blue-600">$${u.totalSpent?.toFixed(2) || '0.00'}</td>
                <td class="p-4"><span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">${u.status}</span></td>
                <td class="p-4">
                    ${!isSelf ? `
                        <button onclick="toggleUserStatus('${u._id}', '${u.status}')" class="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white mr-2"><i class="fa-solid fa-user-slash"></i></button>
                        <button onclick="deleteUser('${u._id}')" class="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white"><i class="fa-solid fa-trash"></i></button>
                    ` : '<span class="text-xs text-slate-300 italic">Protected</span>'}
                </td>
            </tr>`;
        }).join('');

        const pRes = await fetch('/api/products');
        const pData = await pRes.json();
        if (pCount) pCount.innerText = pData.count;
    } catch (e) { console.error(e); }
};

window.toggleUserStatus = async (id, status) => {
    const newStatus = status === 'active' ? 'banned' : 'active';
    await fetch(`/api/users/${id}/status`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ status: newStatus }) });
    fetchDashboard();
};

window.deleteUser = async (id) => {
    if (confirm("Delete User?")) {
        await fetch(`/api/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        fetchDashboard();
    }
};

// --- 2. PRODUCTS & CATEGORIES ---
const fetchProducts = async () => {
    const tbody = document.getElementById('product-table-body');
    if (!tbody) return;
    const res = await fetch('/api/products');
    const result = await res.json();
    tbody.innerHTML = result.data.map(p => `
        <tr class="border-b hover:bg-slate-50">
            <td class="p-4 flex items-center space-x-3">
                <img src="${p.images[0]}" class="h-10 w-10 object-cover rounded shadow-sm" onerror="this.src='https://via.placeholder.com/50'"> 
                <span class="font-bold text-slate-700">${p.name}</span>
            </td>
            <td class="p-4 font-black text-blue-600">$${p.price.toFixed(2)}</td>
            <td class="p-4 font-bold ${p.countInStock > 0 ? 'text-green-600' : 'text-red-600'}">${p.countInStock}</td>
            <td class="p-4">
                <a href="edit-product.html?id=${p._id}" class="text-blue-500 mr-3"><i class="fa-solid fa-pen-to-square"></i></a>
                <button onclick="deleteProduct('${p._id}')" class="text-red-500"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`).join('');
};

const fetchCategories = async () => {
    const tbody = document.getElementById('category-table-body');
    const select = document.getElementById('category-select');
    const res = await fetch('/api/categories');
    const result = await res.json();
    if (tbody) {
        tbody.innerHTML = result.data.map(c => `
            <tr class="border-b">
                <td class="p-4 font-bold text-slate-800">${c.name}</td>
                <td class="p-4 text-gray-400 text-xs">${c.description}</td>
                <td class="p-4 text-right">
                    <a href="edit-category.html?id=${c._id}" class="text-blue-500 mr-4 transition"><i class="fa-solid fa-pen"></i></a>
                    <button onclick="deleteCategory('${c._id}')" class="text-red-500 transition"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`).join('');
    }
    if (select) {
        select.innerHTML = '<option value="">Select Category</option>' + result.data.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
    }
};

// --- 3. ORDERS ---
const fetchOrders = async () => {
    const tbody = document.getElementById('admin-orders-body');
    if (!tbody) return;
    const res = await fetch('/api/orders', { headers: getAuthHeaders() });
    const result = await res.json();
    tbody.innerHTML = result.data.map(order => `
        <tr class="border-b hover:bg-slate-50">
            <td class="p-4 font-bold">#${order._id.substring(15)}</td>
            <td class="p-4 text-sm">${order.user?.name || 'Guest'}</td>
            <td class="p-4 font-black text-blue-600">$${order.totalPrice.toFixed(2)}</td>
            <td class="p-4">
                <select onchange="updateOrderStatus('${order._id}', this.value)" class="bg-slate-100 text-[10px] font-black p-2 rounded-lg outline-none cursor-pointer">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            </td>
            <td class="p-4 text-center"><a href="../order-details.html?id=${order._id}" class="text-blue-500"><i class="fa-solid fa-file-invoice"></i></a></td>
        </tr>`).join('');
};

window.updateOrderStatus = async (id, status) => {
    await fetch(`/api/orders/${id}/status`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ status }) });
    fetchOrders();
};

// --- 4. ADD/EDIT SUBMISSIONS ---
document.getElementById('add-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const data = { name: f.name.value, description: f.description.value, price: f.price.value, countInStock: f.countInStock.value, brand: f.brand.value, category: f.category.value, images: [f.images.value] };
    const res = await fetch('/api/products', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    if (res.ok) { alert("Product Published!"); window.location.href = 'products.html'; }
});

document.getElementById('edit-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = new URLSearchParams(window.location.search).get('id');
    const f = e.target;
    const data = { name: f.name.value, description: f.description.value, price: f.price.value, countInStock: f.countInStock.value, brand: f.brand.value, category: f.category.value, images: [f.images.value] };
    const res = await fetch(`/api/products/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
    if (res.ok) { alert("Product Updated!"); window.location.href = 'products.html'; }
});

// Load Edit Data
const loadEditData = async () => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;
    if (document.getElementById('edit-product-form')) {
        const res = await fetch(`/api/products/${id}`);
        const result = await res.json();
        const p = result.data;
        const f = document.getElementById('edit-product-form');
        f.name.value = p.name; f.price.value = p.price; f.brand.value = p.brand; f.countInStock.value = p.countInStock; f.description.value = p.description; f.images.value = p.images[0];
        await fetchCategories(); 
        f.category.value = p.category._id || p.category;
    }
};

// --- GLOBAL ACTIONS ---
window.deleteProduct = async (id) => { if(confirm("Delete Product?")) { await fetch(`/api/products/${id}`, { method: 'DELETE', headers: getAuthHeaders() }); fetchProducts(); }};
window.deleteCategory = async (id) => { if(confirm("Delete Category?")) { await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: getAuthHeaders() }); fetchCategories(); }};
window.handleLogout = () => { localStorage.removeItem('userInfo'); window.location.href = '/'; };

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess();
    fetchDashboard();
    fetchProducts();
    fetchCategories();
    fetchOrders();
    loadEditData();
});