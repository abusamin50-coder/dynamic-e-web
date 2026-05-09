/**
 * MASTER MAIN ENGINE - STABLE PRODUCTION VERSION (V2.0)
 * Fixed: Crash-proof rendering and Logo-click stability
 */

const getStoredUserInfo = () => {
    const user = localStorage.getItem('userInfo');
    try {
        return user ? JSON.parse(user) : null;
    } catch (e) { return null; }
};

// --- 1. FETCH & RENDER CATEGORIES (With Error Protection) ---
const fetchHomeCategories = async () => {
    const container = document.getElementById('category-container');
    if (!container) return;

    try {
        const res = await fetch('/api/categories');
        const result = await res.json();
        
        // Safety Check: Ensure result.data is an array
        const categories = (result && Array.isArray(result.data)) ? result.data : [];

        if (categories.length > 0) {
            container.innerHTML = categories.map(cat => `
                <div onclick="window.filterByCategory('${cat._id}')" 
                    class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md hover:border-blue-500 transition-all cursor-pointer group">
                    <div class="bg-blue-50 h-12 w-12 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-all duration-300">
                        <i class="fa-solid fa-microchip text-xl text-blue-600 group-hover:text-white"></i>
                    </div>
                    <div>
                        <h3 class="font-black text-gray-800 text-sm md:text-base">${cat.name || 'Category'}</h3>
                        <p class="text-[9px] text-gray-400 uppercase font-black tracking-widest">Explore Items</p>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<p class="text-gray-400 italic py-4">No categories available.</p>`;
        }
    } catch (err) {
        console.error("Category Fetch Error:", err);
        container.innerHTML = `<p class="text-red-500">Service temporarily unavailable.</p>`;
    }
};

// --- 2. FETCH & RENDER PRODUCTS (With Crash Prevention) ---
const fetchHomeProducts = async (queryParam = '') => {
    const container = document.getElementById('product-container');
    if (!container) return;

    try {
        const res = await fetch(`/api/products${queryParam}`);
        const result = await res.json();
        
        // Safety Check: Ensure products is an array
        const products = (result && Array.isArray(result.data)) ? result.data : [];

        if (products.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-20 text-center">
                    <i class="fa-solid fa-magnifying-glass text-5xl text-gray-100 mb-4"></i>
                    <p class="text-gray-400 font-bold uppercase tracking-tighter">No products found.</p>
                    <button onclick="fetchHomeProducts('')" class="text-blue-600 font-black mt-4 underline">Refresh Products</button>
                </div>`;
            return;
        }

        container.innerHTML = products.map(prod => {
            if (!prod) return ''; // Skip if product object is corrupted
            
            const outOfStock = prod.countInStock <= 0;
            const img = (prod.images && prod.images.length > 0) ? prod.images[0] : 'https://via.placeholder.com/300';
            
            return `
            <div class="group bg-white rounded-3xl border border-gray-100 p-3 md:p-4 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 flex flex-col h-full relative">
                ${outOfStock ? `<div class="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-3xl pointer-events-none font-black text-red-600 text-[10px] uppercase">Out of Stock</div>` : ''}
                
                <button onclick="event.stopPropagation(); window.handleWishlistClick('${prod._id}')" class="absolute top-4 right-4 z-20 h-9 w-9 bg-white/80 backdrop-blur-md rounded-full shadow-sm flex items-center justify-center text-gray-300 hover:text-red-500 transition-all">
                    <i class="fa-solid fa-heart text-sm"></i>
                </button>

                <div class="relative bg-gray-50 rounded-2xl overflow-hidden aspect-square flex items-center justify-center cursor-pointer mb-4" onclick="window.location.href='/pages/product-details.html?id=${prod._id}'">
                    <img src="${img}" class="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-110 ${outOfStock ? 'grayscale' : ''}" onerror="this.src='https://via.placeholder.com/300'">
                </div>

                <div class="flex-1 flex flex-col px-1">
                    <h3 class="font-bold text-gray-800 text-xs md:text-base line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors cursor-pointer" onclick="window.location.href='/pages/product-details.html?id=${prod._id}'">
                        ${prod.name || 'Product Title'}
                    </h3>
                    <div class="mt-auto pt-4 flex flex-col md:flex-row md:items-center justify-between">
                        <p class="text-lg md:text-2xl font-black text-slate-900 tracking-tighter">$${(prod.price || 0).toFixed(2)}</p>
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
        console.error("Product Render Error:", err);
        container.innerHTML = `<p class="col-span-full text-center py-10 text-gray-400">Unable to load products. Please refresh.</p>`;
    }
};

// --- 3. DYNAMIC PROFILE DROPDOWN (Safe Execution) ---
window.updateProfileDropdown = async () => {
    const menu = document.getElementById('profile-menu');
    if (!menu) return;
    const user = getStoredUserInfo();

    if (user) {
        let cartCount = 0;
        try {
            const res = await fetch('/api/cart', { headers: { 'Authorization': `Bearer ${user.token}` } });
            const cartData = await res.json();
            cartCount = (cartData && cartData.cartItems) ? cartData.cartItems.reduce((acc, i) => acc + i.qty, 0) : 0;
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
        menu.innerHTML = `<div class="p-4 space-y-2"><a href="/pages/login.html" class="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg">Login</a></div>`;
    }
};

// --- 4. MOBILE MENU & GLOBAL ACTIONS ---
const setupMobileMenu = () => {
    const overlay = document.getElementById('mobile-menu-overlay');
    const openBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('close-menu-btn');
    if (!overlay || !openBtn || !closeBtn) return;
    openBtn.addEventListener('click', () => { overlay.classList.remove('hidden'); setTimeout(() => overlay.classList.add('opacity-100'), 10); });
    closeBtn.addEventListener('click', () => { overlay.classList.remove('opacity-100'); setTimeout(() => overlay.classList.add('hidden'), 300); });
};

window.filterByCategory = (id) => {
    fetchHomeProducts(`?category=${id}`);
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
};

window.handleLogout = () => { localStorage.removeItem('userInfo'); window.location.href = '/'; };

// --- INITIALIZE (Sequential Fail-Safe) ---
const initApp = async () => {
    setupMobileMenu();
    // Use independent awaits so one failure doesn't block others
    await fetchHomeCategories().catch(e => console.error(e));
    await fetchHomeProducts().catch(e => console.error(e));
    await window.updateProfileDropdown().catch(e => console.error(e));
};

document.addEventListener('DOMContentLoaded', initApp);

// Global Toggle Listeners
document.getElementById('profile-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('profile-menu')?.classList.toggle('hidden');
});
window.addEventListener('click', () => document.getElementById('profile-menu')?.classList.add('hidden'));

// Search Logic
document.getElementById('search-input')?.addEventListener('keyup', (e) => {
    if (e.target.value.length > 2 || e.target.value.length === 0) {
        fetchHomeProducts(`?keyword=${e.target.value}`);
    }
});