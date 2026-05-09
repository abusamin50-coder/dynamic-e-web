/**
 * MASTER ADMIN ENGINE - VERSION 7.0 (FULL SYNC)
 * Handles: Dashboard Stats, User Management, Products & Categories
 */

// --- 1. HELPERS & SECURITY ---
const getAdmin = () => {
    const user = localStorage.getItem('userInfo');
    return user ? JSON.parse(user) : null;
};

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

// --- 2. DASHBOARD: USER MANAGEMENT & STATS ---
const fetchDashboardData = async () => {
    const userTable = document.getElementById('user-table-body');
    const userCountDisplay = document.getElementById('total-users-count');
    const revenueDisplay = document.getElementById('total-revenue-count');

    if (!userTable) return; // Logic for Dashboard only

    try {
        const res = await fetch('/api/users', { headers: getAuthHeaders() });
        const result = await res.json();
        const users = result.data;

        if (userCountDisplay) userCountDisplay.innerText = users.length;

        let totalSiteRevenue = 0;

        userTable.innerHTML = users.map(u => {
            const isSelf = u._id === getAdmin()._id;
            totalSiteRevenue += u.totalSpent;

            // Dynamic Badge Styles
            let statusBadge = '';
            if (u.status === 'active') statusBadge = `<span class="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-600">Active</span>`;
            else if (u.status === 'suspended') statusBadge = `<span class="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-600">Suspended</span>`;
            else if (u.status === 'blocked') statusBadge = `<span class="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-600">Blocked</span>`;

            return `
            <tr class="border-b hover:bg-slate-50 transition text-sm">
                <td class="p-6">
                    <div class="flex items-center space-x-3">
                        <div class="h-10 w-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-black uppercase text-xs">${u.name.charAt(0)}</div>
                        <div>
                            <p class="font-black text-slate-800">${u.name} ${isSelf ? '<span class="text-[8px] bg-blue-600 text-white px-2 py-0.5 rounded ml-1">YOU</span>' : ''}</p>
                            <p class="text-[11px] text-slate-400 font-medium">${u.email}</p>
                        </div>
                    </div>
                </td>
                <td class="p-6 font-black text-slate-900">$${u.totalSpent.toFixed(2)}</td>
                <td class="p-6">${statusBadge}</td>
                <td class="p-6">
                    <div class="flex items-center justify-center space-x-2">
                        ${!isSelf ? `
                            <!-- Suspend / Unsuspend Toggle -->
                            <button onclick="updateUserStatus('${u._id}', '${u.status === 'active' ? 'suspended' : 'active'}')" 
                                class="p-2 ${u.status === 'active' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'} rounded-lg hover:shadow-md transition" title="Toggle Suspend">
                                <i class="fa-solid ${u.status === 'active' ? 'fa-user-slash' : 'fa-user-check'}"></i>
                            </button>
                            
                            <!-- Block Action -->
                            <button onclick="updateUserStatus('${u._id}', 'blocked')" class="p-2 bg-slate-900 text-white rounded-lg hover:bg-black transition" title="Block User">
                                <i class="fa-solid fa-ban"></i>
                            </button>

                            <!-- Remove Action -->
                            <button onclick="removeUserPermanently('${u._id}')" class="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition" title="Delete User">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        ` : '<span class="text-xs text-slate-300 italic">Protected</span>'}
                    </div>
                </td>
            </tr>`;
        }).join('');

        if (revenueDisplay) revenueDisplay.innerText = `$${totalSiteRevenue.toFixed(2)}`;

    } catch (e) { console.error("Stats Error:", e); }
};

window.updateUserStatus = async (id, newStatus) => {
    if (!confirm(`Confirm status change to ${newStatus}?`)) return;
    const res = await fetch(`/api/users/${id}/status`, { 
        method: 'PUT', 
        headers: getAuthHeaders(true), 
        body: JSON.stringify({ status: newStatus }) 
    });
    if (res.ok) fetchDashboardData();
};

window.removeUserPermanently = async (id) => {
    if (!confirm("Are you sure? This will delete the user and all their records.")) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (res.ok) fetchDashboardData();
};

// --- 3. PRODUCTS & CATEGORIES LISTING ---
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
                <td class="p-4 text-center">
                    <a href="edit-product.html?id=${p._id}" class="text-blue-500 mr-3 transition-transform hover:scale-110 inline-block"><i class="fa-solid fa-pen-to-square"></i></a>
                    <button onclick="deleteProduct('${p._id}')" class="text-red-500 hover:scale-110 transition-transform"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`).join('');
    } catch (e) { console.error(e); }
};

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
                    <td class="p-4 text-gray-400 text-xs">${c.description}</td>
                    <td class="p-4 text-right">
                        <a href="edit-category.html?id=${c._id}" class="text-blue-500 mr-4 inline-block"><i class="fa-solid fa-pen"></i></a>
                        <button onclick="deleteCategory('${c._id}')" class="text-red-500"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`).join('');
        }
        if (select) {
            select.innerHTML = '<option value="">Select Category</option>' + 
                result.data.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
        }
    } catch (e) { console.error(e); }
};

// --- 4. DATA SYNC (ADD/EDIT) ---
const loadEditPageSync = async () => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;

    if (document.getElementById('edit-product-form')) {
        const res = await fetch(`/api/products/${id}`);
        const result = await res.json();
        const p = result.data;
        const f = document.getElementById('edit-product-form');
        f.name.value = p.name; f.price.value = p.price; f.brand.value = p.brand; f.countInStock.value = p.countInStock; f.description.value = p.description; f.images.value = p.images[0];
        await fetchAdminCategories(); f.category.value = p.category._id || p.category;
    }

    if (document.getElementById('edit-category-form')) {
        const res = await fetch(`/api/categories/${id}`);
        const result = await res.json();
        const f = document.getElementById('edit-category-form');
        f.name.value = result.data.name; f.description.value = result.data.description;
    }
};

// --- 5. INITIALIZE ---
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess();
    
    // Sidebar Mobile Toggle
    const toggleBtn = document.getElementById('admin-sidebar-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    toggleBtn?.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-hidden');
        sidebar.classList.toggle('sidebar-visible');
    });

    fetchDashboardData();
    fetchAdminProducts();
    fetchAdminCategories();
    loadEditPageSync();
});

// Global Actions
window.deleteProduct = async (id) => { if(confirm("Delete?")) { await fetch(`/api/products/${id}`, { method: 'DELETE', headers: getAuthHeaders(false) }); fetchAdminProducts(); }};
window.deleteCategory = async (id) => { if(confirm("Delete?")) { await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: getAuthHeaders(false) }); fetchAdminCategories(); }};
window.handleLogout = () => { localStorage.removeItem('userInfo'); window.location.href = '/'; };