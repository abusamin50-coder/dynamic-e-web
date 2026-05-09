/**
 * MASTER ADMIN ENGINE - VERSION 4.0 (URL & LOGIN FIX)
 */

// --- 1. CONFIGURATION & SECURITY ---
const getAdminData = () => {
    const user = localStorage.getItem('userInfo');
    try {
        return user ? JSON.parse(user) : null;
    } catch (e) { return null; }
};

// এই ফাংশনটি শুধুমাত্র তখনই কাজ করবে যখন আপনি অ্যাডমিন ফোল্ডারের ভেতর থাকবেন
const verifyAdminAccess = () => {
    const admin = getAdminData();
    // যদি আপনি অ্যাডমিন পেজে থাকেন কিন্তু লগইন করা নেই অথবা আপনি অ্যাডমিন নন
    if (window.location.pathname.includes('/admin/')) {
        if (!admin || admin.role !== 'admin') {
            console.log("Access Denied. Redirecting...");
            window.location.href = '/'; 
        }
    }
};

const getAuthHeaders = () => {
    const admin = getAdminData();
    if (!admin) return {};
    return { 
        'Authorization': `Bearer ${admin.token}`,
        'Content-Type': 'application/json' 
    };
};

// --- 2. CATEGORY MANAGEMENT ---
const fetchAdminCategories = async () => {
    const select = document.getElementById('category-select');
    const tbody = document.getElementById('category-table-body');
    try {
        const res = await fetch('/api/categories');
        const result = await res.json();
        if (select) {
            select.innerHTML = '<option value="">Select Category</option>' + 
                result.data.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
        }
        if (tbody) {
            tbody.innerHTML = result.data.map(c => `
                <tr class="border-b hover:bg-slate-50 transition">
                    <td class="p-4 font-bold text-slate-800">${c.name}</td>
                    <td class="p-4 text-gray-500 text-sm">${c.description}</td>
                    <td class="p-4 text-right">
                        <a href="edit-category.html?id=${c._id}" class="text-blue-500 mr-4 transition"><i class="fa-solid fa-pen"></i></a>
                        <button onclick="deleteCategory('${c._id}')" class="text-red-500 transition"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`).join('');
        }
    } catch (e) { console.error("Category Fetch Error:", e); }
};

// --- 3. PRODUCT MANAGEMENT (URL VERSION) ---
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
    } catch (e) { console.error("Product Fetch Error:", e); }
};

// --- 4. FORM SUBMISSIONS (ADD & EDIT) ---

// Add Product
document.getElementById('add-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const data = {
        name: f.name.value,
        description: f.description.value,
        price: f.price.value,
        countInStock: f.countInStock.value,
        brand: f.brand.value,
        category: f.category.value,
        images: [f.images.value] // URL Array
    };

    const res = await fetch('/api/products', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    if (res.ok) { alert("Success: Product Published!"); window.location.href = 'products.html'; }
    else { const err = await res.json(); alert("Error: " + err.message); }
});

// Edit Product
document.getElementById('edit-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = new URLSearchParams(window.location.search).get('id');
    const f = e.target;
    const data = {
        name: f.name.value,
        description: f.description.value,
        price: f.price.value,
        countInStock: f.countInStock.value,
        brand: f.brand.value,
        category: f.category.value,
        images: [f.images.value]
    };

    const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    if (res.ok) { alert("Product Updated!"); window.location.href = 'products.html'; }
});

// --- 5. INITIALIZE ---
const loadPageContent = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    // Load Data based on page visibility
    if (document.getElementById('product-table-body')) fetchAdminProducts();
    if (document.getElementById('category-table-body')) fetchAdminCategories();
    if (document.getElementById('category-select')) fetchAdminCategories();

    // Fill Edit Forms
    if (id && document.getElementById('edit-product-form')) {
        const res = await fetch(`/api/products/${id}`);
        const result = await res.json();
        const p = result.data;
        const f = document.getElementById('edit-product-form');
        f.name.value = p.name;
        f.price.value = p.price;
        f.brand.value = p.brand;
        f.countInStock.value = p.countInStock;
        f.description.value = p.description;
        f.images.value = p.images[0];
        f.category.value = p.category._id;
    }
};

// --- GLOBAL ACTIONS ---
window.deleteProduct = async (id) => { if(confirm("Delete Product?")) { await fetch(`/api/products/${id}`, { method: 'DELETE', headers: getAuthHeaders() }); fetchAdminProducts(); }};
window.deleteCategory = async (id) => { if(confirm("Delete Category?")) { await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: getAuthHeaders() }); fetchAdminCategories(); }};
window.handleLogout = () => { localStorage.removeItem('userInfo'); window.location.href = '/'; };

// --- RUN ---
document.addEventListener('DOMContentLoaded', () => {
    verifyAdminAccess(); // Security check only for admin pages
    loadPageContent();
});