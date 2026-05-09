/**
 * MASTER ADMIN ENGINE - CATEGORY & PRODUCT FIX
 */

const getAdminInfo = () => {
    const user = localStorage.getItem('userInfo');
    return user ? JSON.parse(user) : null;
};

const getAuthHeaders = (isJson = true) => {
    const admin = getAdminInfo();
    if (!admin) return {};
    const headers = { 'Authorization': `Bearer ${admin.token}` };
    if (isJson) headers['Content-Type'] = 'application/json';
    return headers;
};

// --- CATEGORY ADD LOGIC (FIXED) ---
const addCatForm = document.getElementById('add-category-form');
if (addCatForm) {
    addCatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            name: addCatForm.name.value,
            description: addCatForm.description.value
        };

        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: getAuthHeaders(true),
                body: JSON.stringify(data)
            });

            if (res.ok) {
                alert("Category Created!");
                window.location.href = 'categories.html';
            } else {
                const err = await res.json();
                alert("Error: " + err.message);
            }
        } catch (e) { console.error(e); }
    });
}

// --- CATEGORY EDIT LOGIC (FIXED) ---
const editCatForm = document.getElementById('edit-category-form');
if (editCatForm) {
    editCatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = new URLSearchParams(window.location.search).get('id');
        const data = {
            name: editCatForm.name.value,
            description: editCatForm.description.value
        };

        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(true),
                body: JSON.stringify(data)
            });

            if (res.ok) {
                alert("Category Updated!");
                window.location.href = 'categories.html';
            }
        } catch (e) { console.error(e); }
    });
}

// --- PRODUCT ADD/EDIT LOGIC (SYNCED WITH URL IMAGES) ---
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
        images: [f.images.value] 
    };
    const res = await fetch('/api/products', { method: 'POST', headers: getAuthHeaders(true), body: JSON.stringify(data) });
    if (res.ok) { alert("Product Published!"); window.location.href = 'products.html'; }
});

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
    const res = await fetch(`/api/products/${id}`, { method: 'PUT', headers: getAuthHeaders(true), body: JSON.stringify(data) });
    if (res.ok) { alert("Product Updated!"); window.location.href = 'products.html'; }
});

// --- DATA FETCHERS ---
const fetchAdminCategories = async () => {
    const tbody = document.getElementById('category-table-body');
    const select = document.getElementById('category-select');
    try {
        const res = await fetch('/api/categories');
        const result = await res.json();
        const cats = result.data;
        if (tbody) {
            tbody.innerHTML = cats.map(c => `
                <tr class="border-b hover:bg-slate-50 transition">
                    <td class="p-4 font-bold text-slate-800">${c.name}</td>
                    <td class="p-4 text-slate-400 text-xs">${c.description}</td>
                    <td class="p-4 text-right">
                        <a href="edit-category.html?id=${c._id}" class="text-blue-500 mr-4"><i class="fa-solid fa-pen"></i></a>
                        <button onclick="deleteCategory('${c._id}')" class="text-red-500"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`).join('');
        }
        if (select) {
            select.innerHTML = '<option value="">Select Category</option>' + 
                cats.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
        }
    } catch (e) { console.error(e); }
};

const loadPageData = async () => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;

    if (document.getElementById('edit-category-form')) {
        const res = await fetch(`/api/categories/${id}`);
        const result = await res.json();
        const c = result.data;
        document.getElementById('edit-category-form').name.value = c.name;
        document.getElementById('edit-category-form').description.value = c.description;
    }

    if (document.getElementById('edit-product-form')) {
        const res = await fetch(`/api/products/${id}`);
        const result = await res.json();
        const p = result.data;
        const f = document.getElementById('edit-product-form');
        f.name.value = p.name; f.price.value = p.price; f.brand.value = p.brand; f.countInStock.value = p.countInStock; f.description.value = p.description; f.images.value = p.images[0];
        await fetchAdminCategories(); 
        f.category.value = p.category._id || p.category;
    }
};

// --- INITIALIZE ---
window.deleteCategory = async (id) => { if(confirm("Delete?")) { await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: getAuthHeaders(false) }); fetchAdminCategories(); }};
window.handleLogout = () => { localStorage.removeItem('userInfo'); window.location.href = '/'; };

document.addEventListener('DOMContentLoaded', () => {
    fetchAdminCategories();
    // Assuming you have fetchAdminProducts and fetchDashboard logic elsewhere or will add it back
    loadPageData();
});