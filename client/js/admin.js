/**
 * MASTER ADMIN ENGINE - VERSION 8.0 (STABLE DATA MAPPING)
 */

const getAdmin = () => JSON.parse(localStorage.getItem('userInfo'));

const getAuthHeaders = (isJson = true) => {
    const admin = getAdmin();
    const headers = { 'Authorization': `Bearer ${admin?.token}` };
    if (isJson) headers['Content-Type'] = 'application/json';
    return headers;
};

// --- 1. DASHBOARD & USER MANAGEMENT ---
const fetchDashboardData = async () => {
    const userTable = document.getElementById('user-table-body');
    const userCountDisplay = document.getElementById('total-users-count');
    const revenueDisplay = document.getElementById('total-revenue-count');

    if (!userTable) return;

    try {
        const res = await fetch('/api/users', { headers: getAuthHeaders() });
        const result = await res.json();
        
        // Check if data exists
        if (!result.success || !result.data) {
            userTable.innerHTML = '<tr><td colspan="4" class="p-10 text-center text-slate-400">No user data found.</td></tr>';
            return;
        }

        const users = result.data;
        if (userCountDisplay) userCountDisplay.innerText = users.length;

        let totalSiteRevenue = 0;

        userTable.innerHTML = users.map(u => {
            const isSelf = u._id === getAdmin()._id;
            const spent = u.totalSpent || 0;
            totalSiteRevenue += spent;

            // Status Badge Logic
            const status = u.status || 'active';
            let badgeStyle = "bg-green-100 text-green-600";
            if (status === 'suspended') badgeStyle = "bg-amber-100 text-amber-600";
            if (status === 'blocked') badgeStyle = "bg-red-100 text-red-600";

            return `
            <tr class="border-b hover:bg-slate-50 transition text-sm">
                <td class="p-6">
                    <div class="flex items-center space-x-3">
                        <div class="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black uppercase text-xs">${(u.name || 'U').charAt(0)}</div>
                        <div>
                            <p class="font-black text-slate-800">${u.name || 'Unknown User'} ${isSelf ? '<span class="text-[8px] bg-blue-600 text-white px-2 py-0.5 rounded ml-1">YOU</span>' : ''}</p>
                            <p class="text-[11px] text-slate-400 font-medium">${u.email}</p>
                        </div>
                    </div>
                </td>
                <td class="p-6 font-black text-slate-900">$${spent.toFixed(2)}</td>
                <td class="p-6"><span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${badgeStyle}">${status}</span></td>
                <td class="p-6">
                    <div class="flex items-center justify-center space-x-2">
                        ${!isSelf ? `
                            <button onclick="changeStatus('${u._id}', '${status === 'active' ? 'suspended' : 'active'}')" 
                                class="p-2 ${status === 'active' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'} rounded-lg transition">
                                <i class="fa-solid ${status === 'active' ? 'fa-user-slash' : 'fa-user-check'}"></i>
                            </button>
                            <button onclick="changeStatus('${u._id}', 'blocked')" class="p-2 bg-slate-900 text-white rounded-lg hover:bg-black transition"><i class="fa-solid fa-ban"></i></button>
                            <button onclick="removeUser('${u._id}')" class="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition"><i class="fa-solid fa-trash"></i></button>
                        ` : '<span class="text-xs text-slate-300 italic">Protected</span>'}
                    </div>
                </td>
            </tr>`;
        }).join('');

        if (revenueDisplay) revenueDisplay.innerText = `$${totalSiteRevenue.toFixed(2)}`;

    } catch (e) { console.error("Dashboard Load Error:", e); }
};

window.changeStatus = async (id, newStatus) => {
    if (!confirm(`Are you sure you want to make this user ${newStatus}?`)) return;
    const res = await fetch(`/api/users/${id}/status`, { 
        method: 'PUT', 
        headers: getAuthHeaders(true), 
        body: JSON.stringify({ status: newStatus }) 
    });
    if (res.ok) fetchDashboardData();
};

window.removeUser = async (id) => {
    if (!confirm("Permanently delete user?")) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    fetchDashboardData();
};

// --- 2. PRODUCT MANAGEMENT (FIXED LOOP) ---
const fetchAdminProducts = async () => {
    const tbody = document.getElementById('product-table-body');
    if (!tbody) return;

    try {
        const res = await fetch('/api/products');
        const result = await res.json();
        const products = result.data || [];

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-10 text-center text-slate-400">No products published.</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(p => {
            // Check if images exist, otherwise use placeholder
            const img = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/50';
            
            return `
            <tr class="border-b hover:bg-slate-50 transition">
                <td class="p-4 flex items-center space-x-3">
                    <img src="${img}" class="h-10 w-10 object-cover rounded shadow-sm" onerror="this.src='https://via.placeholder.com/50'"> 
                    <span class="font-bold text-slate-700">${p.name}</span>
                </td>
                <td class="p-4 font-black text-blue-600">$${p.price ? p.price.toFixed(2) : '0.00'}</td>
                <td class="p-4 font-bold ${p.countInStock > 0 ? 'text-green-600' : 'text-red-600'}">${p.countInStock || 0}</td>
                <td class="p-4 text-center">
                    <div class="flex justify-center space-x-2">
                        <a href="edit-product.html?id=${p._id}" class="h-8 w-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center hover:bg-blue-600 hover:text-white transition"><i class="fa-solid fa-pen-to-square text-xs"></i></a>
                        <button onclick="deleteProduct('${p._id}')" class="h-8 w-8 bg-red-50 text-red-600 rounded flex items-center justify-center hover:bg-red-600 hover:text-white transition"><i class="fa-solid fa-trash text-xs"></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
        
        // Update product count on dashboard if element exists
        const prodCountDisplay = document.getElementById('total-products-count');
        if(prodCountDisplay) prodCountDisplay.innerText = products.length;

    } catch (e) { console.error("Product Table Error:", e); }
};

// --- 3. CATEGORY & ORDERS ---
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
                    <td class="p-4 text-gray-400 text-xs">${c.description}</td>
                    <td class="p-4 text-right">
                        <a href="edit-category.html?id=${c._id}" class="text-blue-500 mr-4 transition"><i class="fa-solid fa-pen"></i></a>
                        <button onclick="deleteCategory('${c._id}')" class="text-red-500 transition"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`).join('');
        }
        if (select) {
            select.innerHTML = '<option value="">Select Category</option>' + 
                cats.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
        }
    } catch (e) { console.error(e); }
};

const fetchAdminOrders = async () => {
    const tbody = document.getElementById('admin-orders-body');
    if (!tbody) return;
    try {
        const res = await fetch('/api/orders', { headers: getAuthHeaders() });
        const result = await res.json();
        const orders = result.data || [];
        tbody.innerHTML = orders.map(order => `
            <tr class="border-b hover:bg-slate-50 transition text-sm">
                <td class="p-4 font-bold">#${order._id.substring(15)}</td>
                <td class="p-4">${order.user?.name || 'Customer'}</td>
                <td class="p-4 font-black text-blue-600">$${order.totalPrice.toFixed(2)}</td>
                <td class="p-4"><span class="px-2 py-1 rounded-full text-[9px] font-black uppercase ${order.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}">${order.status}</span></td>
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
    await fetch(`/api/orders/${id}/status`, { method: 'PUT', headers: getAuthHeaders(true), body: JSON.stringify({ status }) });
    fetchAdminOrders();
};

// --- 4. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const user = getAdmin();
    if (!user || user.role !== 'admin') { 
        if (!window.location.pathname.includes('login.html')) window.location.href = '/'; 
        return; 
    }

    // Sidebar Mobile Toggle
    const toggleBtn = document.getElementById('admin-sidebar-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    toggleBtn?.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-hidden');
        sidebar.classList.toggle('sidebar-visible');
    });

    // Run functions
    fetchDashboardData();
    fetchAdminProducts();
    fetchAdminCategories();
    fetchAdminOrders();

    // Check for Edit IDs
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) {
        // You can add your loadEditData logic here if needed
    }
});

window.deleteProduct = async (id) => { if(confirm("Delete Product?")) { await fetch(`/api/products/${id}`, { method: 'DELETE', headers: getAuthHeaders() }); fetchAdminProducts(); }};
window.deleteCategory = async (id) => { if(confirm("Delete Category?")) { await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: getAuthHeaders() }); fetchAdminCategories(); }};
window.handleLogout = () => { localStorage.removeItem('userInfo'); window.location.href = '/'; };