/**
 * MASTER ADMIN ENGINE - VERSION 9.0 (EDIT FIX)
 * Handles: Dashboard, User Management, Orders, Product & Category CRUD
 */

const getAdmin = () => JSON.parse(localStorage.getItem('userInfo'));

const getAuthHeaders = (isJson = true) => {
    const admin = getAdmin();
    if (!admin) return {};
    const headers = { 'Authorization': `Bearer ${admin.token}` };
    if (isJson) headers['Content-Type'] = 'application/json';
    return headers;
};

const checkAdminAccess = () => {
    const admin = getAdmin();
    if (!window.location.pathname.includes('login.html') && (!admin || admin.role !== 'admin')) {
        window.location.href = '/';
    }
};

// --- 1. DASHBOARD & USER MANAGEMENT (KEPT FROM VER 8.0) ---
const fetchDashboardData = async () => {
    const userTable = document.getElementById('user-table-body');
    const userCountDisplay = document.getElementById('total-users-count');
    const revenueDisplay = document.getElementById('total-revenue-count');
    if (!userTable) return;

    try {
        const res = await fetch('/api/users', { headers: getAuthHeaders() });
        const result = await res.json();
        const users = result.data || [];
        if (userCountDisplay) userCountDisplay.innerText = users.length;

        let totalSiteRevenue = 0;
        userTable.innerHTML = users.map(u => {
            const isSelf = u._id === getAdmin()._id;
            const spent = u.totalSpent || 0;
            totalSiteRevenue += spent;
            const status = u.status || 'active';
            let badgeStyle = status === 'suspended' ? "bg-amber-100 text-amber-600" : (status === 'blocked' ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600");

            return `
            <tr class="border-b hover:bg-slate-50 transition text-sm">
                <td class="p-6">
                    <div class="flex items-center space-x-3">
                        <div class="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black uppercase text-xs">${(u.name || 'U').charAt(0)}</div>
                        <div><p class="font-black text-slate-800">${u.name || 'Unknown'} ${isSelf ? '<span class="text-[8px] bg-blue-600 text-white px-2 py-0.5 rounded ml-1">YOU</span>' : ''}</p><p class="text-[11px] text-slate-400 font-medium">${u.email}</p></div>
                    </div>
                </td>
                <td class="p-6 font-black text-slate-900">$${spent.toFixed(2)}</td>
                <td class="p-6"><span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${badgeStyle}">${status}</span></td>
                <td class="p-6">
                    <div class="flex items-center justify-center space-x-2">
                        ${!isSelf ? `
                            <button onclick="changeStatus('${u._id}', '${status === 'active' ? 'suspended' : 'active'}')" class="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition"><i class="fa-solid ${status === 'active' ? 'fa-user-slash' : 'fa-user-check'}"></i></button>
                            <button onclick="changeStatus('${u._id}', 'blocked')" class="p-2 bg-slate-900 text-white rounded-lg hover:bg-black transition"><i class="fa-solid fa-ban"></i></button>
                            <button onclick="removeUser('${u._id}')" class="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition"><i class="fa-solid fa-trash"></i></button>
                        ` : '<span class="text-xs text-slate-300 italic">Protected</span>'}
                    </div>
                </td>
            </tr>`;
        }).join('');
        if (revenueDisplay) revenueDisplay.innerText = `$${totalSiteRevenue.toFixed(2)}`;
    } catch (e) { console.error(e); }
};

// --- 2. PRODUCT & CATEGORY CRUD ---

// A. Product Update
document.getElementById('edit-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = new URLSearchParams(window.location.search).get('id');
    const f = e.target;
    const data = { 
        name: f.name.value, 
        description: f.description.value, 
        price: Number(f.price.value), 
        countInStock: Number(f.countInStock.value), 
        brand: f.brand.value, 
        category: f.category.value, 
        images: [f.images.value] // Takes URL from text box
    };

    const res = await fetch(`/api/products/${id}`, { 
        method: 'PUT', 
        headers: getAuthHeaders(true), 
        body: JSON.stringify(data) 
    });
    if (res.ok) { alert("Product Updated!"); window.location.href = 'products.html'; }
});

// B. Category Update
document.getElementById('edit-category-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = new URLSearchParams(window.location.search).get('id');
    const f = e.target;
    const data = { name: f.name.value, description: f.description.value };

    const res = await fetch(`/api/categories/${id}`, { 
        method: 'PUT', 
        headers: getAuthHeaders(true), 
        body: JSON.stringify(data) 
    });
    if (res.ok) { alert("Category Updated!"); window.location.href = 'categories.html'; }
});

// C. Load Data into Edit Forms (CRITICAL FIX)
const loadEditPageData = async () => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;

    // Load Product Edit Form
    const prodForm = document.getElementById('edit-product-form');
    if (prodForm) {
        try {
            const res = await fetch(`/api/products/${id}`);
            const result = await res.json();
            const p = result.data;

            if (document.getElementById('product-id-badge')) document.getElementById('product-id-badge').innerText = `ID: ${p._id}`;
            
            prodForm.name.value = p.name;
            prodForm.price.value = p.price;
            prodForm.brand.value = p.brand;
            prodForm.countInStock.value = p.countInStock;
            prodForm.description.value = p.description;
            prodForm.images.value = p.images[0] || '';

            // IMPORTANT: Fetch categories first so the dropdown is full, then select the right one
            await fetchAdminCategories(); 
            prodForm.category.value = p.category._id || p.category;
        } catch (e) { console.error(e); }
    }

    // Load Category Edit Form
    const catForm = document.getElementById('edit-category-form');
    if (catForm) {
        try {
            const res = await fetch(`/api/categories/${id}`);
            const result = await res.json();
            const c = result.data;
            catForm.name.value = c.name;
            catForm.description.value = c.description;
        } catch (e) { console.error(e); }
    }
};

// --- 3. LIST FETCHERS ---
const fetchAdminProducts = async () => {
    const tbody = document.getElementById('product-table-body');
    if (!tbody) return;
    try {
        const res = await fetch('/api/products');
        const result = await res.json();
        tbody.innerHTML = result.data.map(p => `
            <tr class="border-b hover:bg-slate-50 transition">
                <td class="p-4 flex items-center space-x-3"><img src="${p.images[0]}" class="h-10 w-10 object-cover rounded shadow-sm" onerror="this.src='https://via.placeholder.com/50'"> <span class="font-bold text-slate-700">${p.name}</span></td>
                <td class="p-4 font-black text-blue-600">$${p.price.toFixed(2)}</td>
                <td class="p-4 font-bold ${p.countInStock > 0 ? 'text-green-600' : 'text-red-600'}">${p.countInStock}</td>
                <td class="p-4"><div class="flex space-x-2"><a href="edit-product.html?id=${p._id}" class="h-8 w-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center hover:bg-blue-600 hover:text-white transition"><i class="fa-solid fa-pen-to-square text-xs"></i></a><button onclick="deleteProduct('${p._id}')" class="h-8 w-8 bg-red-50 text-red-600 rounded flex items-center justify-center hover:bg-red-600 hover:text-white transition"><i class="fa-solid fa-trash text-xs"></i></button></div></td>
            </tr>`).join('');
    } catch (e) { console.error(e); }
};

const fetchAdminCategories = async () => {
    const tbody = document.getElementById('category-table-body');
    const select = document.getElementById('category-select');
    try {
        const res = await fetch('/api/categories');
        const result = await res.json();
        const cats = result.data || [];
        if (tbody) {
            tbody.innerHTML = cats.map(c => `
                <tr class="border-b hover:bg-slate-50 transition">
                    <td class="p-4 font-bold text-slate-800">${c.name}</td>
                    <td class="p-4 text-gray-500 text-xs">${c.description}</td>
                    <td class="p-4 text-right"><div class="flex justify-end space-x-2"><a href="edit-category.html?id=${c._id}" class="text-blue-500 hover:scale-110 transition"><i class="fa-solid fa-pen"></i></a><button onclick="deleteCategory('${c._id}')" class="text-red-500 hover:scale-110 transition"><i class="fa-solid fa-trash"></i></button></div></td>
                </tr>`).join('');
        }
        if (select) {
            select.innerHTML = '<option value="">Select Category</option>' + cats.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
        }
    } catch (e) { console.error(e); }
};

// --- 4. ORDERS ---
const fetchAdminOrders = async () => {
    const tbody = document.getElementById('admin-orders-body');
    if (!tbody) return;
    try {
        const res = await fetch('/api/orders', { headers: getAuthHeaders() });
        const result = await res.json();
        tbody.innerHTML = (result.data || []).map(order => `
            <tr class="border-b hover:bg-slate-50 transition text-sm">
                <td class="p-4 font-bold">#${order._id.substring(15)}</td>
                <td class="p-4">${order.user?.name || 'Customer'}</td>
                <td class="p-4 font-black text-blue-600">$${order.totalPrice.toFixed(2)}</td>
                <td class="p-4"><span class="px-2 py-1 rounded-full text-[9px] font-black uppercase ${order.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}">${order.status}</span></td>
                <td class="p-4"><select onchange="updateOrderStatus('${order._id}', this.value)" class="bg-slate-100 text-[10px] font-black p-2 rounded-lg outline-none cursor-pointer"><option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option><option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option><option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option></select></td>
                <td class="p-4 text-center"><a href="../order-details.html?id=${order._id}" class="text-blue-500 hover:scale-110 transition"><i class="fa-solid fa-file-invoice text-lg"></i></a></td>
            </tr>`).join('');
    } catch (e) { console.error(e); }
};

window.updateOrderStatus = async (id, status) => {
    await fetch(`/api/orders/${id}/status`, { method: 'PUT', headers: getAuthHeaders(true), body: JSON.stringify({ status }) });
    fetchAdminOrders();
};

// --- 5. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess();
    
    const sidebarToggle = document.getElementById('admin-sidebar-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    sidebarToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-hidden');
        sidebar.classList.toggle('sidebar-visible');
    });

    fetchDashboardData();
    fetchAdminProducts();
    fetchAdminCategories();
    fetchAdminOrders();
    loadEditPageData(); // Logic for loading forms
});

// Global Handlers
window.changeStatus = async (id, status) => { if (confirm(`Change to ${status}?`)) { await fetch(`/api/users/${id}/status`, { method: 'PUT', headers: getAuthHeaders(true), body: JSON.stringify({ status }) }); fetchDashboardData(); }};
window.removeUser = async (id) => { if (confirm("Delete User?")) { await fetch(`/api/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() }); fetchDashboardData(); }};
window.deleteProduct = async (id) => { if(confirm("Delete Product?")) { await fetch(`/api/products/${id}`, { method: 'DELETE', headers: getAuthHeaders() }); fetchAdminProducts(); }};
window.deleteCategory = async (id) => { if(confirm("Delete Category?")) { await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: getAuthHeaders() }); fetchAdminCategories(); }};
window.handleLogout = () => { localStorage.removeItem('userInfo'); window.location.href = '/'; };