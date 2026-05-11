/**
 * PRODUCT DETAILS & RECOMMENDATION ENGINE
 */

const fetchProductDetails = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (!productId) return window.location.href = '/';

    try {
        const res = await fetch(`/api/products/${productId}`);
        const result = await res.json();
        const p = result.data;

        // 1. Render Main Product
        document.getElementById('main-product-image').src = p.images[0];
        document.getElementById('product-name').innerText = p.name;
        document.getElementById('product-price').innerText = `$${p.price.toFixed(2)}`;
        document.getElementById('product-description').innerText = p.description;
        document.getElementById('product-brand').innerText = p.brand;

        // 2. Stock Logic
        const btn = document.getElementById('add-to-cart-btn');
        if (p.countInStock > 0) {
            document.getElementById('stock-status-container').innerHTML = `<span class="text-green-600"><i class="fa-solid fa-circle-check mr-2"></i> In Stock (${p.countInStock} Units)</span>`;
            btn.onclick = () => window.globalAddToCart(p._id);
        } else {
            document.getElementById('stock-status-container').innerHTML = `<span class="text-red-600"><i class="fa-solid fa-circle-xmark mr-2"></i> Out of Stock</span>`;
            btn.disabled = true; btn.className = "flex-1 bg-slate-100 text-slate-400 py-5 rounded-2xl font-black cursor-not-allowed";
        }

        // 3. Trigger Related Products
        fetchRelated(p._id, p.category._id);

    } catch (err) { console.error(err); }
};

const fetchRelated = async (productId, categoryId) => {
    const section = document.getElementById('related-section');
    const container = document.getElementById('related-container');

    try {
        const res = await fetch(`/api/products/related/${productId}/${categoryId}`);
        const result = await res.json();
        const related = result.data;

        if (related.length > 0) {
            section.classList.remove('hidden');
            container.innerHTML = related.map(prod => {
                const oos = prod.countInStock <= 0;
                const desc = prod.description ? (prod.description.length > 60 ? prod.description.slice(0, 60).trim() + '…' : prod.description) : '';

                return `
                <div class="product-card bg-white rounded-[22px] p-4 border border-slate-100 flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 relative">
                    
                    <!-- ⋮ Action Button (Top Right) -->
                    <button onclick="event.stopPropagation();toggleProdMenu('menu-${prod._id}')" class="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-100 hover:border-blue-300 transition-all">
                        <i class="fa-solid fa-ellipsis-vertical text-slate-400 text-sm"></i>
                    </button>
                    
                    <!-- Action Menu (Hidden by default, same logic as index) -->
                    <div id="menu-${prod._id}" class="prod-action-menu absolute top-14 right-4 z-30 bg-white border border-slate-100 rounded-xl shadow-xl p-2 hidden min-w-[150px]">
                        <button onclick="event.stopPropagation();window.globalAddToCart('${prod._id}',${oos});closeProdMenu('menu-${prod._id}');" class="flex items-center gap-2 p-2 text-xs font-bold text-slate-600 hover:bg-slate-50 w-full rounded-lg">
                            <i class="fa-solid fa-cart-plus text-blue-500 w-4"></i> Add to Cart
                        </button>
                        <button onclick="window.location.href='product-details.html?id=${prod._id}'" class="flex items-center gap-2 p-2 text-xs font-bold text-slate-600 hover:bg-slate-50 w-full rounded-lg">
                            <i class="fa-solid fa-eye text-slate-400 w-4"></i> View Details
                        </button>
                    </div>

                    <!-- Image -->
                    <div class="relative bg-slate-50 rounded-2xl overflow-hidden aspect-square flex items-center justify-center cursor-pointer mb-4" onclick="window.location.href='product-details.html?id=${prod._id}'">
                        <img src="${prod.images[0]}" class="w-full h-full object-contain p-4 transition-transform duration-700 hover:scale-110">
                        ${oos ? '<div class="absolute inset-0 bg-white/60 flex items-center justify-center font-black text-[10px] uppercase tracking-widest text-red-600">Out of Stock</div>' : ''}
                    </div>
                    
                    <!-- Content -->
                    <div class="pc-body flex flex-col flex-1 px-1">
                        ${prod.brand ? `<span class="text-[9px] uppercase font-bold text-blue-500 mb-1">${prod.brand}</span>` : ''}
                        <h3 class="font-bold text-slate-800 text-sm line-clamp-1 mb-1 cursor-pointer" onclick="window.location.href='product-details.html?id=${prod._id}'">${prod.name}</h3>
                        
                        <!-- Description snippet -->
                        <p class="text-[11px] text-slate-500 mb-4 flex-1">${desc}</p>
                        
                        <!-- Price & Buy Now -->
                        <div class="mt-auto flex items-center justify-between pt-3 border-t">
                            <p class="font-black text-slate-900 text-lg">$${(prod.price || 0).toFixed(2)}</p>
                            <button onclick="event.stopPropagation();window.globalBuyNow('${prod._id}', ${oos})"
                                class="bg-blue-600 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition hover:bg-blue-700 ${oos ? 'opacity-50 cursor-not-allowed' : ''}" 
                                ${oos ? 'disabled' : ''}>
                                ${oos ? 'N/A' : 'Buy Now'}
                            </button>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }
    } catch (err) { console.error(err); }
};
document.addEventListener('DOMContentLoaded', fetchProductDetails);

// মেনু টগল করার জন্য হেল্পার ফাংশন
function toggleProdMenu(id) {
    document.querySelectorAll('.prod-action-menu').forEach(m => { if (m.id !== id) m.classList.add('hidden'); });
    document.getElementById(id)?.classList.toggle('hidden');
}
function closeProdMenu(id) { document.getElementById(id)?.classList.add('hidden'); }
// বাইরের কোথাও ক্লিক করলে মেনু বন্ধ হবে
document.addEventListener('click', () => { document.querySelectorAll('.prod-action-menu').forEach(m => m.classList.add('hidden')); });