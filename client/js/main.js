/**
 * MAIN WEBSITE ENGINE - RESPONSIVE ENHANCED
 */

const getStoredUser = () => JSON.parse(localStorage.getItem('userInfo'));

// --- MOBILE MENU LOGIC ---
const setupMobileMenu = () => {
    const overlay = document.getElementById('mobile-menu-overlay');
    const openBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('close-menu-btn');

    const toggleMenu = (show) => {
        if (show) {
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.add('opacity-100'), 10);
        } else {
            overlay.classList.remove('opacity-100');
            setTimeout(() => overlay.classList.add('hidden'), 300);
        }
    };

    openBtn?.addEventListener('click', () => toggleMenu(true));
    closeBtn?.addEventListener('click', () => toggleMenu(false));
    overlay?.addEventListener('click', (e) => {
        if(e.target === overlay) toggleMenu(false);
    });
};

// --- DATA FETCHERS (UNTOUCHED LOGIC) ---
const fetchCategories = async () => {
    const container = document.getElementById('category-container');
    if (!container) return;
    try {
        const res = await fetch('/api/categories');
        const result = await res.json();
        container.innerHTML = result.data.map(cat => `
            <div onclick="window.filterByCategory('${cat._id}')" class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:border-blue-500 transition-all cursor-pointer group">
                <div class="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><i class="fa-solid fa-microchip"></i></div>
                <div><h3 class="font-black text-gray-800 text-sm md:text-base">${cat.name}</h3><p class="text-[9px] text-gray-400 font-bold uppercase">Explore Items</p></div>
            </div>`).join('');
    } catch (e) {}
};

const fetchProducts = async (query = '') => {
    const container = document.getElementById('product-container');
    if (!container) return;
    try {
        const res = await fetch(`/api/products${query}`);
        const result = await res.json();
        container.innerHTML = result.data.map(p => {
            const out = p.countInStock <= 0;
            return `
            <div class="bg-white rounded-3xl border border-gray-100 p-3 md:p-4 transition-all hover:shadow-xl relative flex flex-col h-full">
                <div class="relative bg-gray-50 rounded-2xl overflow-hidden aspect-square flex items-center justify-center cursor-pointer mb-4" onclick="window.location.href='/pages/product-details.html?id=${p._id}'">
                    <img src="${p.images[0]}" class="w-full h-full object-contain p-4 ${out ? 'grayscale' : ''}">
                </div>
                <div class="flex-1 flex flex-col px-1">
                    <h3 class="font-bold text-gray-800 text-xs md:text-lg line-clamp-2 leading-tight">${p.name}</h3>
                    <div class="mt-auto pt-4 flex flex-col md:flex-row md:items-center justify-between">
                        <p class="text-lg md:text-2xl font-black text-slate-900">$${p.price}</p>
                        <button onclick="window.globalAddToCart('${p._id}', ${out})" class="mt-2 md:mt-0 h-10 md:h-12 w-full md:w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95">
                            <i class="fa-solid fa-cart-plus md:text-xl"></i>
                            <span class="md:hidden ml-2 font-bold text-xs uppercase">Add</span>
                        </button>
                    </div>
                </div>
            </div>`;}).join('');
    } catch (e) {}
};

// --- GLOBAL ACTIONS ---
window.updateProfileDropdown = async () => {
    const menu = document.getElementById('profile-menu');
    if (!menu) return;
    const user = getStoredUser();
    if (user) {
        let cartCount = 0;
        try {
            const res = await fetch('/api/cart', { headers: { 'Authorization': `Bearer ${user.token}` } });
            const cartData = await res.json();
            cartCount = cartData.cartItems ? cartData.cartItems.reduce((acc, i) => acc + i.qty, 0) : 0;
        } catch (e) {}

        menu.innerHTML = `
            <div class="px-5 py-3 border-b mb-2"><p class="text-sm font-bold text-slate-800">${user.name}</p></div>
            <div class="px-2 space-y-1">
                ${user.role === 'admin' ? `<a href="/pages/admin/dashboard.html" class="flex items-center px-4 py-2 text-sm text-blue-600 font-bold hover:bg-blue-50 rounded-xl">Admin Panel</a>` : ''}
                <a href="/pages/profile.html" class="block px-4 py-2 text-sm hover:bg-slate-50 rounded-xl">Profile</a>
                <a href="/pages/cart.html" class="flex justify-between px-4 py-2 text-sm hover:bg-slate-50 rounded-xl"><span>My Cart</span><span class="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full">${cartCount}</span></a>
            </div>
            <div class="mt-3 border-t p-2"><button onclick="window.handleLogout()" class="w-full text-left px-4 py-2 text-sm text-red-600 font-bold">Logout</button></div>`;
    } else {
        menu.innerHTML = `<div class="p-4"><a href="/pages/login.html" class="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-bold">Login</a></div>`;
    }
};

window.filterByCategory = (id) => fetchProducts(`?category=${id}`);
window.handleLogout = () => { localStorage.removeItem('userInfo'); window.location.reload(); };

// INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    setupMobileMenu();
    fetchCategories();
    fetchProducts();
    window.updateProfileDropdown();
    
    // Desktop Dropdown
    const btn = document.getElementById('profile-btn'), menu = document.getElementById('profile-menu');
    btn?.addEventListener('click', (e) => { e.stopPropagation(); menu?.classList.toggle('hidden'); });
    window.addEventListener('click', () => menu?.classList.add('hidden'));
});