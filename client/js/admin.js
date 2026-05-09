/**
 * MASTER ADMIN ENGINE - RESTORED & UPGRADED
 */

const getAdmin = () => {
    const user = localStorage.getItem('userInfo');
    return user ? JSON.parse(user) : null;
};

const getAuthHeaders = (isJson = true) => {
    const admin = getAdmin();
    const headers = { 'Authorization': `Bearer ${admin?.token}` };
    if (isJson) headers['Content-Type'] = 'application/json';
    return headers;
};

const checkAdminAccess = () => {
    const admin = getAdmin();
    if (!window.location.pathname.includes('login.html') && (!admin || admin.role !== 'admin')) {
        window.location.href = '/';
    }
};

// --- 1. DASHBOARD & USERS (UPDATED WITH SUSPEND/BLOCK) ---
const fetchDashboard = async () => {
    const userTable = document.getElementById('user-table-body');
    const uCount = document.getElementById('total-users-count');
    const revCount = document.getElementById('total-revenue-count');
    if (!userTable) return;

    try {
        const res = await fetch('/api/users', { headers: getAuthHeaders() });
        const result = await res.json();
        const users = result.data;
        
        if (uCount) uCount.innerText = users.length;

        let totalRevenue = 0;

        userTable.innerHTML = users.map(u => {
            const isSelf = u._id === getAdmin()._id;
            totalRevenue += u.totalSpent;

            // Define Status Colors
            let statusClass = "bg-green-100 text-green-600";
            if (u.status === 'suspended') statusClass = "bg-amber-100 text-amber-600";
            if (u.status === 'blocked') statusClass = "bg-red-100 text-red-600";

            return `
            <tr class="border-b hover:bg-slate-50 transition">
                <td class="p-6">
                    <p class="font-bold text-slate-800">${u.name} ${isSelf ? '<span class="text-[8px] bg-blue-600 text-white px-2 py-0.5 rounded ml-1">YOU</span>' : ''}</p>
                    <p class="text-[10px] text-slate-400">${u.email}</p>
                </td>
                <td class="p-6 font-black text-blue-600">$${u.totalSpent.toFixed(2)}</td>
                <td class="p-6"><span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${statusClass}">${u.status}</span></td>
                <td class="p-6">
                    <div class="flex items-center justify-center space-x-2">
                        ${!isSelf ? `
                            <!-- Suspend / Unsuspend -->
                            <button onclick="updateStatus('${u._id}', '${u.status === 'active' ? 'suspended' : 'active'}')" 
                                class="p-2 ${u.status === 'active' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'} rounded-lg transition" title="Suspend/Unsuspend">
                                <i class="fa-solid ${u.status === 'active' ? 'fa-user-slash' : 'fa-user-check'}"></i>
                            </button>
                            <!-- Block -->
                            <button onclick="updateStatus('${u._id}', 'blocked')" class="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition" title="Block User">
                                <i class="fa-solid fa-ban"></i>
                            </button>
                            <!-- Remove -->
                            <button onclick="deleteUser('${u._id}')" class="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition" title="Delete User">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        ` : '<span class="text-xs text-slate-300 italic">No Actions</span>'}
                    </div>
                </td>
            </tr>`;
        }).join('');

        if (revCount) revCount.innerText = `$${totalRevenue.toFixed(2)}`;

    } catch (e) { console.error(e); }
};

window.updateStatus = async (id, status) => {
    if (!confirm(`Are you sure you want to change user status to ${status}?`)) return;
    await fetch(`/api/users/${id}/status`, { 
        method: 'PUT', 
        headers: getAuthHeaders(true), 
        body: JSON.stringify({ status }) 
    });
    fetchDashboard();
};

window.deleteUser = async (id) => {
    if (confirm("Delete User Permanently?")) {
        await fetch(`/api/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        fetchDashboard();
    }
};

// --- 2. PRODUCTS & CATEGORIES (UNTOUCHED) ---
const fetchProducts = async () => {
    const tbody = document.getElementById('product-table-body');
    if (!tbody) return;
    const res = await fetch('/api/products');
    const result = await res.json();
    tbody.innerHTML = result.data.map(p => `
        <tr class="border-b hover:bg-slate-50 transition">
            <td class="p-4 flex items-center space-x-3">
                <img src="${p.images[0]}" class="h-10 w-10 object-cover rounded shadow-sm" onerror="this.src='https://via.placeholder.com/50'"> 
                <span class="font-bold text-slate-700">${p.name}</span>
            </td>
            <td class="p-4 font-black text-blue-600">$${p.price.toFixed(2)}</td>
            <td class="p-4 font-bold ${p.countInStock > 0 ? 'text-green-600' : 'text-red-600'}">${p.countInStock}</td>
            <td class="p-4 text-center">
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
            <tr class="border-b transition">
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
        <tr class="border-b hover:bg-slate-50 transition">
            <td class="p-4 font-bold">#${order._id.substring(15)}</td>
            <td class="p-4 text-sm">${order.user?.name || 'Guest'}</td>
            <td class="p-4 font-black text-blue-600">$${order.totalPrice.toFixed(2)}</td>
            <td class="p-4">
                <select onchange="updateOrderStatus('${order._id}', this.value)" class="bg-slate-100 text-[10px] font-black p-2 rounded-lg outline-none cursor-pointer">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            </td>
            <td class="p-4 text-center"><a href="../order-details.html?id=${order._id}" class="text-blue-500"><i class="fa-solid fa-file-invoice text-lg"></i></a></td>
        </tr>`).join('');
};

window.updateOrderStatus = async (id, status) => {
    await fetch(`/api/orders/${id}/status`, { method: 'PUT', headers: getAuthHeaders(true), body: JSON.stringify({ status }) });
    fetchOrders();
};

// --- 4. FORM LOGIC ---
document.getElementById('add-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const data = { name: f.name.value, description: f.description.value, price: f.price.value, countInStock: f.countInStock.value, brand: f.brand.value, category: f.category.value, images: [f.images.value] };
    const res = await fetch('/api/products', { method: 'POST', headers: getAuthHeaders(true), body: JSON.stringify(data) });
    if (res.ok) { alert("Product Published!"); window.location.href = 'products.html'; }
});

document.getElementById('edit-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = new URLSearchParams(window.location.search).get('id');
    const f = e.target;
    const data = { name: f.name.value, description: f.description.value, price: f.price.value, countInStock: f.countInStock.value, brand: f.brand.value, category: f.category.value, images: [f.images.value] };
    const res = await fetch(`/api/products/${id}`, { method: 'PUT', headers: getAuthHeaders(true), body: JSON.stringify(data) });
    if (res.ok) { alert("Product Updated!"); window.location.href = 'products.html'; }
});

// Sidebar Mobile Logic
const setupSidebar = () => {
    const toggleBtn = document.getElementById('admin-sidebar-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    toggleBtn?.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-hidden');
        sidebar.classList.toggle('sidebar-visible');
    });
};

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess();
    setupSidebar();
    fetchDashboard();
    fetchProducts();
    fetchCategories();
    fetchOrders();
    // loadEditData helper can be added here if needed
});

window.handleLogout = () => { localStorage.removeItem('userInfo'); window.location.href = '/'; };