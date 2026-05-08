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
            container.innerHTML = related.map(prod => `
                <div class="bg-white rounded-3xl border border-slate-100 p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 flex flex-col h-full relative group">
                    <div class="relative bg-slate-50 rounded-2xl overflow-hidden aspect-square flex items-center justify-center cursor-pointer mb-4" onclick="window.location.href='product-details.html?id=${prod._id}'">
                        <img src="${prod.images[0]}" class="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-110">
                    </div>
                    <div class="flex-1 px-2">
                        <h3 class="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">${prod.name}</h3>
                        <p class="text-xl font-black text-slate-900 mt-2">$${prod.price}</p>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) { console.error(err); }
};

document.addEventListener('DOMContentLoaded', fetchProductDetails);