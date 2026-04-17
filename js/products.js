// Products & Cart Module
import { getCollection, addDocToCollection, deleteDocFromCollection } from './firebase.js';
import { addToCart, removeFromCart, cart } from './app.js';

const products = [];

// ===== PRODUCT DETAIL MODAL =====
function injectProductModal() {
  if (document.getElementById('product-detail-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'product-detail-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;z-index:4000;background:rgba(255,255,255,0.4);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);overflow-y:auto;';
  modal.innerHTML = `
    <div style="max-width:560px;margin:2rem auto;padding:1rem;">
      <div style="background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.9);border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,0.1);overflow:hidden;position:relative;">
        <button onclick="closeProductDetail()" style="position:absolute;top:1rem;right:1rem;z-index:10;background:rgba(255,255,255,0.8);border:none;width:36px;height:36px;border-radius:50%;font-size:1.3rem;cursor:pointer;color:#666;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);">×</button>
        <img id="pd-image" src="" alt="" style="width:100%;height:280px;object-fit:cover;display:block;">
        <div style="padding:1.8rem;">
          <h2 id="pd-name" style="font-size:1.4rem;font-weight:700;color:#1a1a1a;margin-bottom:0.5rem;"></h2>
          <div id="pd-price" style="font-size:1.6rem;font-weight:700;color:#e44;margin-bottom:1.2rem;"></div>
          <div id="pd-desc" style="color:#555;font-size:0.95rem;line-height:1.8;margin-bottom:1.8rem;"></div>
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
            <button id="pd-cart-btn" onclick="pdAddToCart()" class="btn btn-primary" style="flex:1;padding:14px;font-size:1rem;">
              <i class="fas fa-shopping-cart" style="margin-right:8px;"></i>Add to Cart
            </button>
            <a id="pd-whatsapp-btn" href="#" target="_blank" class="whatsapp-btn" style="flex:1;justify-content:center;padding:14px;">
              <i class="fab fa-whatsapp"></i>Order via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeProductDetail(); });
}

let _pdProduct = null;

window.openProductDetail = (id) => {
  const p = products.find(p => p.id === id);
  if (!p) return;
  _pdProduct = p;
  injectProductModal();
  document.getElementById('pd-image').src = p.image || 'https://via.placeholder.com/560x280?text=Product';
  document.getElementById('pd-image').alt = p.name;
  document.getElementById('pd-name').textContent = p.name;
  document.getElementById('pd-price').textContent = `GH₵${Number(p.price).toFixed(2)}`;
  document.getElementById('pd-desc').textContent = p.description || 'Premium aloe-based wellness product from Forever Living.';
  document.getElementById('pd-whatsapp-btn').href =
    `https://wa.me/233200409106?text=Hi%20Mama%20Aku!%20I'm%20interested%20in%20${encodeURIComponent(p.name)}%20(GH%C2%B5${p.price})`;
  document.getElementById('product-detail-modal').style.display = 'block';
  document.body.style.overflow = 'hidden';
};

window.closeProductDetail = () => {
  const modal = document.getElementById('product-detail-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
};

window.pdAddToCart = () => {
  if (!_pdProduct) return;
  addToCart(_pdProduct.id, _pdProduct.name, _pdProduct.price, _pdProduct.image || '');
  const btn = document.getElementById('pd-cart-btn');
  btn.innerHTML = '<i class="fas fa-check" style="margin-right:8px;"></i>Added!';
  btn.style.background = 'rgba(139,195,74,1)';
  setTimeout(() => {
    btn.innerHTML = '<i class="fas fa-shopping-cart" style="margin-right:8px;"></i>Add to Cart';
    btn.style.background = '';
  }, 1500);
};

export async function loadProducts(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    products.length = 0;
    const data = await getCollection('products');
    products.push(...data);
    if (!data.length) {
      container.innerHTML = '<p style="text-align:center;color:#777;">No products available yet. Check back soon!</p>';
      return;
    }
    container.innerHTML = data.map(product => `
      <div class="product-card glass">
        <img src="${product.image || 'https://via.placeholder.com/300x180?text=Product'}" alt="${product.name}" loading="lazy" width="300" height="180" onclick="openProductDetail('${product.id}')" style="cursor:pointer;">
        <div class="product-info">
          <h4>${product.name}</h4>
          <div class="price">GH₵${product.price}</div>
          <button onclick="event.stopPropagation();addToCart('${product.id}', '${product.name}', ${product.price}, '${product.image || ''}')" class="btn btn-primary">Add to Cart</button>
          <button onclick="openProductDetail('${product.id}')" style="width:100%;margin-top:6px;background:none;border:none;color:#7ab535;font-size:0.78rem;font-weight:600;cursor:pointer;padding:4px;font-family:inherit;">
            See Details →
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading products:', error);
    container.innerHTML = '<p>No products available. Admin can add some.</p>';
  }
}

export async function loadFeaturedProducts(containerId, limit = 4) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const data = await getCollection('products');
    const featured = data.slice(0, limit);
    products.length = 0;
    products.push(...data); // keep products array populated for modal
    if (!featured.length) {
      container.innerHTML = '<p style="text-align:center;color:#777;">Products coming soon!</p>';
      return;
    }
    container.innerHTML = featured.map(p => `
      <div class="product-card glass">
        <img src="${p.image || 'https://via.placeholder.com/300x180?text=Product'}" alt="${p.name}" loading="lazy" onclick="openProductDetail('${p.id}')" style="cursor:pointer;">
        <div class="product-info">
          <h4>${p.name}</h4>
          <div class="price">GH₵${p.price}</div>
          <button onclick="addToCart('${p.id}', '${p.name}', ${p.price}, '${p.image || ''}')" class="btn btn-primary">Add to Cart</button>
          <button onclick="openProductDetail('${p.id}')" style="width:100%;margin-top:6px;background:none;border:none;color:#7ab535;font-size:0.78rem;font-weight:600;cursor:pointer;padding:4px;font-family:inherit;">
            See Details →
          </button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = '<p>Products coming soon!</p>';
  }
}

// Admin Functions — handled in admin.js, removed duplicate here

window.loadCart = () => {
  const cartContainer = document.getElementById('cart-items');
  if (!cartContainer) return;
  const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
  if (!currentCart.length) {
    cartContainer.innerHTML = '<p style="text-align:center;color:#777;padding:2rem;">Your cart is empty.</p>';
    if (document.getElementById('cart-total')) document.getElementById('cart-total').textContent = 'GH₵0.00';
    return;
  }
  cartContainer.innerHTML = currentCart.map(item => `
    <div class="cart-item-row">
      <img src="${item.image || 'https://via.placeholder.com/60x60?text=P'}" alt="${item.name}"
           style="width:60px;height:60px;object-fit:cover;border-radius:10px;flex-shrink:0;">
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:0.9rem;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</div>
        <div style="font-size:0.82rem;color:#6a9e30;font-weight:700;margin-top:2px;">GH₵${item.price.toFixed(2)} each</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
        <button onclick="decreaseQty('${item.id}')" class="qty-btn">−</button>
        <span style="min-width:24px;text-align:center;font-weight:700;font-size:0.95rem;">${item.quantity}</span>
        <button onclick="increaseQty('${item.id}')" class="qty-btn">+</button>
      </div>
      <div style="font-weight:700;color:#1a1a1a;font-size:0.95rem;flex-shrink:0;min-width:70px;text-align:right;">
        GH₵${(item.price * item.quantity).toFixed(2)}
      </div>
      <button onclick="removeFromCart('${item.id}')" title="Remove"
              style="background:none;border:none;cursor:pointer;color:#ccc;font-size:1.1rem;padding:4px;flex-shrink:0;transition:color 0.2s;"
              onmouseover="this.style.color='#e74c3c'" onmouseout="this.style.color='#ccc'">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `).join('');
  const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (document.getElementById('cart-total')) document.getElementById('cart-total').textContent = `GH₵${total.toFixed(2)}`;
};

window.increaseQty = (productId) => {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const item = cart.find(i => i.id === productId);
  if (item) item.quantity += 1;
  localStorage.setItem('cart', JSON.stringify(cart));
  // sync in-memory cart
  const { cart: memCart } = window._cartRef || {};
  if (memCart) { const m = memCart.find(i => i.id === productId); if (m) m.quantity += 1; }
  window.loadCart();
  document.querySelector('.cart-count').textContent = cart.reduce((s, i) => s + i.quantity, 0);
};

window.decreaseQty = (productId) => {
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.quantity -= 1;
    if (item.quantity <= 0) cart = cart.filter(i => i.id !== productId);
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  window.loadCart();
  document.querySelector('.cart-count').textContent = cart.reduce((s, i) => s + i.quantity, 0);
};
