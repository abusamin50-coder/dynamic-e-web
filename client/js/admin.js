/**
 * MASTER ADMIN ENGINE - VERSION 3.1 (Render Optimized)
 * Handles: Dashboard, User Management, Orders, Product CRUD, and Category CRUD.
 */

// --- 1. CONFIGURATION & HELPERS ---
const getAdmin = () => {
    const user = localStorage.getItem('userInfo');
    return user ? JSON.parse(user) : null;
};

const getAuthHeaders = (isJson = true) => {
    const admin = getAdmin();
    if (!admin || !admin.token) return {};
    
    const headers = { 'Authorization': `Bearer ${admin.token}` };
    if (isJson) headers['Content-Type'] = 'application/json';
    return headers;
};

const checkAdminAuth = () => {
    const user = getAdmin();
    if (!user || user.role !== 'admin') {
        window.location.href = '/';
    }
};

// --- 2. DATA LOADING (FOR EDIT PAGES) ---
const loadEditPageData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) return;

    // A. PRODUCT EDIT SYNC
    const prodForm = document.getElementById('edit-product-form');
    if (prodForm) {
        try {
            const res = await fetch(`/api/products/${id}`);
            const result = await res.json();
            const p = result.data;

            const badge = document.getElementById('product-id-badge');
            if (badge) badge.innerText = `Product ID: ${p._id}`;

            prodForm.name.value = p.name || '';
            prodForm.price.value = p.price || '';
            prodForm.brand.value = p.brand || '';
            prodForm.countInStock.value = p.countInStock || '';
            prodForm.description.value = p.description || '';

            await fetchAdminCategories();
            const select = document.getElementById('category-select');
            if (select && p.category) select.value = p.category._id || p.category;
            
        } catch (e) { console.error("Sync Error:", e); }
    }

    // B. CATEGORY EDIT SYNC
    const catForm = document.getElementById('edit-category-form');
    if (catForm) {
        try {
            const res = await fetch(`/api/categories/${id}`);
            const result = await res.json();
            const c = result.data;
            catForm.name.value = c.name || '';
            catForm.description.value = c.description || '';
        } catch (e) { console.error("Sync Error:", e); }
    }
};

// --- 3. DASHBOARD STATS & USER MANAGEMENT ---
const fetchDashboardData = async () => {
    const userTable = document.getElementById('user-table-body');
    if (!userTable) return;

    try {
        const uRes = await fetch('/api/users', { headers: getAuthHeaders() });
        const uData = await uRes.json();
        
        const userCount = document.getElementById('total-users-count');
        if (userCount) userCount.innerText = uData.data.length;

        userTable.innerHTML = uData.data.map(u => {
            const isSelf = u._id === getAdmin()._id;
            return `
            <tr class="border-b hover:bg-slate-50 transition">
                <td class="p-4 font-bold">${u.name}<br><span class="text-[10px] text-slate-400">${u.email}</span></td>
                <td class="p-4 font-black text-blue-600">$${u.totalSpent?.toFixed(2) || '0.00'}</td>
                <td class="p-4"><span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">${u.status}</span></td>
                <td class="p-4">
                    ${!isSelf ? `
                        <button onclick="toggleUserStatus('${u._id}', '${u.status}')" class="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white mr-2"><i class="fa-solid fa-user-slash"></i></button>
                        <button onclick="deleteUser('${u._id}')" class="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white"><i class="fa-solid fa-trash"></i></button>
                    ` : '<span class="text-xs text-slate-300 italic">Self</span>'}
                </td>
            </tr>`;
        }).join('');

        const pRes = await fetch('/api/products');
        const pData = await pRes.json();
        const prodCount = document.getElementById('total-products-count');
        if (prodCount) prodCount.innerText = pData.count;
    } catch (e) { console.error(e); }
};

window.toggleUserStatus = async (id, status) => {
    const newStatus = status === 'active' ? 'banned' : 'active';
    if (!confirm(`Change user status to ${newStatus}?`)) return;
    await fetch(`/api/users/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ status: newStatus })
    });
    fetchDashboardData();
};

window.deleteUser = async (id) => {
    if (confirm("Permanently delete this user?")) {
        await fetch(`/api/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        fetchDashboardData();
    }
};

// --- 4. PRODUCT MANAGEMENT ---
const fetchAdminProducts = async () => {
    const tbody = document.getElementById('product-table-body');
    if (!tbody) return;
    try {
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
                <td class="p-4">
                    <a href="edit-product.html?id=${p._id}" class="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition mr-2"><i class="fa-solid fa-pen-to-square"></i></a>
                    <button onclick="deleteProduct('${p._id}')" class="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-600 hover:text-white transition"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`).join('');
    } catch (e) { console.error(e); }
};

// --- 5. CATEGORY MANAGEMENT ---
const fetchAdminCategories = async () => {
    const tbody = document.getElementById('category-table-body');
    const select = document.getElementById('category-select');
    try {
        const res = await fetch('/api/categories');
        const result = await res.json();
        if (tbody) {
            tbody.innerHTML = result.data.map(c => `
                <tr class="border-b">
                    <td class="p-4 font-bold text-slate-800">${c.name}</td>
                    <td class="p-4 text-gray-500 text-sm">${c.description}</td>
                    <td class="p-4 text-right">
                        <a href="edit-category.html?id=${c._id}" class="text-blue-500 mr-4 transition"><i class="fa-solid fa-pen"></i></a>
                        <button onclick="deleteCategory('${c._id}')" class="text-red-500 transition"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`).join('');
        }
        if (select) {
            select.innerHTML = '<option value="">Select Category</option>' + 
                result.data.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
        }
    } catch (e) { console.error(e); }
};

// --- 6. ORDER MANAGEMENT ---
const fetchAdminOrders = async () => {
    const tbody = document.getElementById('admin-orders-body');
    if (!tbody) return;
    try {
        const res = await fetch('/api/orders', { headers: getAuthHeaders() });
        const result = await res.json();
        tbody.innerHTML = result.data.map(order => `
            <tr class="border-b hover:bg-slate-50 transition">
                <td class="p-4 font-bold">#${order._id.substring(15)}<br><span class="text-[10px] text-slate-400 font-black">${new Date(order.createdAt).toLocaleDateString()}</span></td>
                <td class="p-4 text-sm font-bold text-slate-600">${order.user?.name || 'Customer'}</td>
                <td class="p-4 font-black text-blue-600">$${order.totalPrice.toFixed(2)}</td>
                <td class="p-4"><span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${order.isPaid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">${order.isPaid ? 'Paid' : 'Unpaid'}</span></td>
                <td class="p-4">
                    <select onchange="updateOrderStatus('${order._id}', this.value)" class="bg-slate-100 text-[10px] font-black p-2 rounded-lg outline-none cursor-pointer">
                        <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td class="p-4 text-center"><a href="../order-details.html?id=${order._id}" class="text-blue-500"><i class="fa-solid fa-file-invoice text-lg"></i></a></td>
            </tr>`).join('');
    } catch (e) { console.error(e); }
};

window.updateOrderStatus = async (id, status) => {
    await fetch(`/api/orders/${id}/status`, { 
        method: 'PUT', 
        headers: getAuthHeaders(true), 
        body: JSON.stringify({ status }) 
    });
    fetchAdminOrders();
};

// --- 7. FORM SUBMISSIONS ---

// Add Category
document.getElementById('add-category-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = { name: e.target.name.value, description: e.target.description.value };
    const res = await fetch('/api/categories', { 
        method: 'POST', 
        headers: getAuthHeaders(true), 
        body: JSON.stringify(body) 
    });
    if (res.ok) { alert("Category Added!"); window.location.href = 'categories.html'; }
    else { const err = await res.json(); alert("Error: " + err.message); }
});

// Add Product
document.getElementById('add-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const res = await fetch('/api/products', { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${getAdmin().token}` }, 
        body: formData 
    });
    if (res.ok) { alert("Product Published!"); window.location.href = 'products.html'; }
    else { const error = await res.json(); alert("Error: " + error.message); }
});

// Edit Category Update
document.getElementById('edit-category-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = new URLSearchParams(window.location.search).get('id');
    const body = { name: e.target.name.value, description: e.target.description.value };
    const res = await fetch(`/api/categories/${id}`, { 
        method: 'PUT', 
        headers: getAuthHeaders(true), 
        body: JSON.stringify(body) 
    });
    if (res.ok) { alert("Category Updated!"); window.location.href = 'categories.html'; }
});

// Edit Product Update
document.getElementById('edit-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = new URLSearchParams(window.location.search).get('id');
    const formData = new FormData(e.target);
    const res = await fetch(`/api/products/${id}`, { 
        method: 'PUT', 
        headers: { 'Authorization': `Bearer ${getAdmin().token}` }, 
        body: formData 
    });
    if (res.ok) { alert("Product Updated!"); window.location.href = 'products.html'; }
});

// --- 8. GLOBAL ACTIONS & INIT ---
window.deleteProduct = async (id) => { if(confirm("Delete Product?")) { await fetch(`/api/products/${id}`, { method: 'DELETE', headers: getAuthHeaders(false) }); fetchAdminProducts(); }};
window.deleteCategory = async (id) => { if(confirm("Delete Category?")) { await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: getAuthHeaders(false) }); fetchAdminCategories(); }};
window.handleLogout = () => { localStorage.removeItem('userInfo'); window.location.href = '/'; };

const setupAdminSidebar = () => {
    const toggleBtn = document.getElementById('admin-sidebar-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    if (!toggleBtn || !sidebar) return;
    
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-hidden');
        sidebar.classList.toggle('sidebar-visible');
    });

    window.addEventListener('click', (e) => {
        if (window.innerWidth < 1024 && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
            sidebar.classList.add('sidebar-hidden');
            sidebar.classList.remove('sidebar-visible');
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    setupAdminSidebar();
    fetchDashboardData();
    fetchAdminProducts();
    fetchAdminCategories();
    fetchAdminOrders();
    loadEditPageData();
});