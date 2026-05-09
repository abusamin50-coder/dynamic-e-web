/**
 * MASTER MAIN ENGINE - STABLE PRODUCTION VERSION
 * Handles: Homepage Data, Profile Dropdown, Search, and Cart Sync
 */

const getStoredUserInfo = () => {
    const user = localStorage.getItem('userInfo');
    try {
        return user ? JSON.parse(user) : null;
    } catch (e) { return null; }
};

// --- 1. FETCH & RENDER CATEGORIES ---
const fetchHomeCategories = async () => {
    const container = document.getElementById('category-container');
    if (!container) return;

    try {
        const res = await fetch('/api/categories');
        const result = await res.json();
        
        if (result.success && result.data.length > 0) {
            container.innerHTML = result.data.map(cat => `
                <div onclick="window.filterByCategory('${cat._id}')" 
                    class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md hover:border-blue-500 transition-all cursor-pointer group">
                    <div class="bg-blue-50 h-12 w-12 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-all duration-300">
                        <i class="fa-solid fa-microchip text-xl text-blue-600 group-hover:text-white"></i>
                    </div>
                    <div>
                        <h3 class="font-black text-gray-800 text-sm md:text-base">${cat.name}</h3>
                        <p class="text-[9px] text-gray-400 uppercase font-black tracking-widest">Explore Items</p>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<p class="text-gray-400 italic">No categories found.</p>`;
        }
    } catch (err) {
        console.error("Category Fetch Error:", err);
        container.innerHTML = `<p class="text-red-500">Error loading categories.</p>`;
    }
};

// --- 2. FETCH & RENDER PRODUCTS ---
const fetchHomeProducts = async (queryParam = '') => {
    const container = document.getElementById('product-container');
    if (!container) return;

    try {
        const res = await fetch(`/api/products${queryParam}`);
        const result = await res.json();
        const products = result.data || [];

        if (products.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-20 text-center">
                    <i class="fa-solid fa-magnifying-glass text-5xl text-gray-100 mb-4"></i>
                    <p class="text-gray-400 font-bold uppercase tracking-tighter">No products matched your search.</p>
                    <button onclick="fetchHomeProducts('')" class="text-blue-600 font-black mt-4 underline">Clear All Filters</button>
                </div>`;
            return;
        }

        container.innerHTML = products.map(prod => {
            const outOfStock = prod.countInStock <= 0;
            const img = (prod.images && prod.images.length > 0) ? prod.images[0] : 'https://via.placeholder.com/300';
            
            return `
            <div class="group bg-white rounded-3xl border border-gray-100 p-3 md:p-4 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 flex flex-col h-full relative">
                ${outOfStock ? `<div class="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-3xl pointer-events-none font-black text-red-600 text-[10px] uppercase">Out of Stock</div>` : ''}
                
                <button onclick="event.stopPropagation(); window.handleWishlistClick('${prod._id}')" class="absolute top-4 right-4 z-20 h-9 w-9 bg-white/80 backdrop-blur-md rounded-full shadow-sm flex items-center justify-center text-gray-300 hover:text-red-500 transition-all">
                    <i class="fa-solid fa-heart text-sm"></i>
                </button>

                <div class="relative bg-gray-50 rounded-2xl overflow-hidden aspect-square flex items-center justify-center cursor-pointer mb-4" onclick="window.location.href='/pages/product-details.html?id=${prod._id}'">
                    <img src="${img}" class="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-110 ${outOfStock ? 'grayscale' : ''}">
                </div>

                <div class="flex-1 flex flex-col px-1">
                    <h3 class="font-bold text-gray-800 text-xs md:text-base line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors cursor-pointer" onclick="window.location.href='/pages/product-details.html?id=${prod._id}'">
                        ${prod.name}
                    </h3>
                    <div class="mt-auto pt-4 flex flex-col md:flex-row md:items-center justify-between">
                        <p class="text-lg md:text-2xl font-black text-slate-900 tracking-tighter">$${prod.price}</p>
                        <button onclick="event.stopPropagation(); window.globalAddToCart('${prod._id}', ${outOfStock})" 
                            class="mt-3 md:mt-0 h-10 md:h-12 w-full md:w-12 rounded-xl flex items-center justify-center transition-all ${outOfStock ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-95'}">
                            <i class="fa-solid fa-cart-plus md:text-xl"></i>
                            <span class="md:hidden ml-2 font-bold text-xs uppercase">Add to Cart</span>
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        console.error("Product Fetch Error:", err);
    }
};

// --- 3. DYNAMIC PROFILE DROPDOWN ---
window.updateProfileDropdown = async () => {
    const menu = document.getElementById('profile-menu');
    if (!menu) return;
    const user = getStoredUserInfo();

    if (user) {
        let cartCount = 0;
        try {
            const res = await fetch('/api/cart', { headers: { 'Authorization': `Bearer ${user.token}` } });
            const cartData = await res.json();
            cartCount = cartData.cartItems ? cartData.cartItems.reduce((acc, i) => acc + i.qty, 0) : 0;
        } catch (e) { cartCount = 0; }

        let adminBtn = user.role === 'admin' ? `
            <a href="/pages/admin/dashboard.html" class="flex items-center px-4 py-2.5 text-sm text-blue-600 font-bold hover:bg-blue-50 rounded-xl transition">
                <i class="fa-solid fa-user-shield mr-3"></i> Admin Dashboard
            </a><hr class="my-2 border-gray-50">` : '';

        menu.innerHTML = `
            <div class="px-5 py-3 border-b border-gray-50 mb-2 font-bold text-gray-800 text-sm">${user.name}</div>
            <div class="px-2 space-y-1">
                ${adminBtn}
                <a href="/pages/profile.html" class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 rounded-xl font-bold transition">Profile</a>
                <a href="/pages/cart.html" class="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 rounded-xl font-bold transition">
                    <span>My Cart</span>
                    <span class="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black">${cartCount}</span>
                </a>
                <a href="/pages/order-history.html" class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 rounded-xl font-bold transition">My Orders</a>
            </div>
            <div class="mt-3 pt-2 border-t border-gray-50 px-2">
                <button onclick="window.handleLogout()" class="w-full text-left px-4 py-2 text-sm text-red-600 font-bold hover:bg-red-50 rounded-xl transition">Logout</button>
            </div>`;
    } else {
        menu.innerHTML = `
            <div class="p-4 space-y-2">
                <p class="text-xs text-gray-400 font-bold uppercase text-center mb-2">Guest Mode</p>
                <a href="/pages/login.html" class="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg">Login</a>
                <a href="/pages/register.html" class="block w-full text-center border-2 border-blue-600 text-blue-600 py-2.5 rounded-xl font-bold">Register</a>
            </div>`;
    }
};

// --- 4. MOBILE MENU LOGIC ---
const setupMobileMenu = () => {
    const overlay = document.getElementById('mobile-menu-overlay');
    const openBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('close-menu-btn');

    if (!overlay || !openBtn || !closeBtn) return;

    const toggleMenu = (show) => {
        if (show) {
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.add('opacity-100'), 10);
        } else {
            overlay.classList.remove('opacity-100');
            setTimeout(() => overlay.classList.add('hidden'), 300);
        }
    };

    openBtn.addEventListener('click', () => toggleMenu(true));
    closeBtn.addEventListener('click', () => toggleMenu(false));
    overlay.addEventListener('click', (e) => { if(e.target === overlay) toggleMenu(false); });
};

// --- GLOBAL ACTIONS ---
window.filterByCategory = (id) => {
    fetchHomeProducts(`?category=${id}`);
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
};

window.handleLogout = () => { localStorage.removeItem('userInfo'); window.location.href = '/'; };
window.closeAuthModal = () => document.getElementById('auth-modal')?.classList.replace('flex', 'hidden');

// --- INITIALIZE ---
const initApp = async () => {
    setupMobileMenu();
    await fetchHomeCategories();
    await fetchHomeProducts();
    await window.updateProfileDropdown();
};

document.addEventListener('DOMContentLoaded', initApp);

// Profile Toggle
const profileBtn = document.getElementById('profile-btn');
const profileMenu = document.getElementById('profile-menu');
profileBtn?.addEventListener('click', (e) => { e.stopPropagation(); profileMenu?.classList.toggle('hidden'); });
window.addEventListener('click', () => profileMenu?.classList.add('hidden'));

// Search Bar Logic
document.getElementById('search-input')?.addEventListener('keyup', (e) => {
    if (e.target.value.length > 2 || e.target.value.length === 0) {
        fetchHomeProducts(`?keyword=${e.target.value}`);
    }
});