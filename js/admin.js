// Admin Module
import { adminGetCollection, adminUpdateDoc, adminDeleteDoc, adminAddDoc, uploadImage } from './firebase.js';

export async function initAdmin() {
  await loadStats();
  loadAdminProducts();
  loadAdminTestimonials();
  loadApplications();
  loadMessages();
  loadUsers();
  loadOrders();

  const form = document.getElementById('add-product-form');
  if (form) form.addEventListener('submit', handleAddProduct);
}

async function loadStats() {
  try {
    const [users, products, testimonials, messages, orders, applications] = await Promise.all([
      adminGetCollection('users'),
      adminGetCollection('products'),
      adminGetCollection('testimonials'),
      adminGetCollection('contacts'),
      adminGetCollection('orders'),
      adminGetCollection('business_apps')
    ]);
    document.getElementById('users-count').textContent = users.length;
    document.getElementById('products-count').textContent = products.length;
    document.getElementById('testimonials-count').textContent = testimonials.length;
    document.getElementById('messages-count').textContent = messages.length;
    document.getElementById('orders-count').textContent = orders.length;
    document.getElementById('applications-count').textContent = applications.length;
  } catch (e) { console.error('Stats error', e); }
}

async function loadAdminProducts() {
  const container = document.getElementById('products-grid');
  if (!container) return;
  try {
    const data = await adminGetCollection('products');
    if (!data.length) { container.innerHTML = '<p style="color:#aaa;">No products yet.</p>'; return; }
    container.innerHTML = data.map(p => `
      <div class="product-admin-item">
        <img src="${p.image || 'https://via.placeholder.com/56x56?text=P'}" alt="${p.name}">
        <div class="info">
          <strong>${p.name}</strong>
          <span>GH₵${p.price} — ${p.description || 'No description'}</span>
        </div>
        <button data-id="${p.id}" data-action="delete-product" class="btn btn-secondary" style="padding:6px 14px;font-size:0.82rem;border-color:rgba(231,76,60,0.3);color:#e74c3c;">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');
  } catch (e) { container.innerHTML = '<p style="color:#e74c3c;">Error loading products.</p>'; }
}

async function loadAdminTestimonials() {
  const container = document.getElementById('testimonials-grid');
  if (!container) return;
  try {
    const data = await adminGetCollection('testimonials');
    if (!data.length) { container.innerHTML = '<p style="color:#aaa;">No testimonials yet.</p>'; return; }
    container.innerHTML = data.map(t => `
      <div class="admin-item" style="padding:1.5rem;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;background:rgba(255,255,255,0.6);border-radius:14px;border:1px solid rgba(0,0,0,0.06);">
        <div>
          <strong>${t.name}</strong> — <span class="rating">${'★'.repeat(t.rating || 5)}</span>
          <p style="margin-top:0.5rem;color:#555;font-size:0.9rem;">${t.message}</p>
          <span style="font-size:0.8rem;color:${t.approved ? '#6a9e30' : '#f39c12'};">${t.approved ? '✔ Approved' : '⏳ Pending'}</span>
        </div>
        <div style="display:flex;gap:0.5rem;">
          ${!t.approved ? `<button data-id="${t.id}" data-action="approve-testimonial" class="btn btn-primary" style="padding:7px 14px;font-size:0.85rem;">Approve</button>` : ''}
          <button data-id="${t.id}" data-action="delete-testimonial" class="btn btn-secondary" style="padding:7px 14px;font-size:0.85rem;border-color:rgba(231,76,60,0.3);color:#e74c3c;">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (e) { container.innerHTML = '<p style="color:#e74c3c;">Error loading testimonials.</p>'; }
}

async function loadOrders() {
  const container = document.getElementById('orders-grid');
  if (!container) return;
  try {
    const data = await adminGetCollection('orders');
    if (!data.length) { container.innerHTML = '<p style="color:#aaa;">No orders yet.</p>'; return; }
    // Sort newest first
    data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    container.innerHTML = data.map(o => {
      const items = (o.items || []).map(i => `${i.name} ×${i.quantity}`).join(', ');
      const date = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleString() : '—';
      const networkLabel = { mtn: 'MTN MoMo', telecel: 'Telecel Cash', airteltigo: 'AirtelTigo Money', whatsapp: 'WhatsApp' }[o.network || o.paymentMethod] || o.paymentMethod || '—';
      const statusColor = { pending: '#f39c12', confirmed: '#6a9e30', delivered: '#2196F3', cancelled: '#e74c3c' }[o.status] || '#aaa';
      return `
        <div style="background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.06);border-radius:14px;padding:1.2rem;margin-bottom:1rem;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.8rem;">
            <div>
              <span style="font-weight:700;color:#1a1a1a;font-size:0.95rem;">${o.ref || '—'}</span>
              <span style="margin-left:0.75rem;font-size:0.78rem;color:#aaa;">${date}</span>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <span style="background:${statusColor}22;color:${statusColor};border:1px solid ${statusColor}44;padding:3px 10px;border-radius:50px;font-size:0.78rem;font-weight:600;text-transform:capitalize;">${o.status || 'pending'}</span>
              <select onchange="updateOrderStatus('${o.id}', this.value)" style="font-size:0.78rem;padding:4px 8px;border-radius:8px;border:1px solid rgba(0,0,0,0.1);background:white;font-family:inherit;cursor:pointer;">
                <option value="pending" ${o.status==='pending'?'selected':''}>Pending</option>
                <option value="confirmed" ${o.status==='confirmed'?'selected':''}>Confirmed</option>
                <option value="delivered" ${o.status==='delivered'?'selected':''}>Delivered</option>
                <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Cancelled</option>
              </select>
              <button data-id="${o.id}" data-action="delete-order" title="Delete order" style="background:none;border:none;cursor:pointer;color:#e74c3c;font-size:1rem;padding:4px 6px;border-radius:8px;transition:background 0.2s;" onmouseover="this.style.background='rgba(231,76,60,0.08)'" onmouseout="this.style.background='none'">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0.5rem;font-size:0.85rem;">
            <div><span style="color:#aaa;">Customer:</span> <strong>${o.userEmail || 'Guest'}</strong></div>
            <div><span style="color:#aaa;">Phone:</span> <strong>${o.phone || '—'}</strong></div>
            <div><span style="color:#aaa;">Location:</span> <strong>${o.location || '—'}</strong></div>
            <div><span style="color:#aaa;">Payment:</span> <strong>${networkLabel}</strong></div>
            <div><span style="color:#aaa;">Total:</span> <strong style="color:#6a9e30;">GH₵${o.total?.toFixed(2) || '0.00'}</strong></div>
          </div>
          <div style="margin-top:0.6rem;font-size:0.82rem;color:#666;"><span style="color:#aaa;">Items:</span> ${items}</div>
          ${o.note ? `<div style="margin-top:0.4rem;font-size:0.82rem;color:#888;font-style:italic;"><span style="color:#aaa;">Note:</span> ${o.note}</div>` : ''}
        </div>`;
    }).join('');
  } catch (e) { container.innerHTML = '<p style="color:#e74c3c;">Error loading orders.</p>'; }
}

async function loadUsers() {
  const container = document.getElementById('users-grid');
  if (!container) return;
  try {
    const data = await adminGetCollection('users');
    if (!data.length) { container.innerHTML = '<p style="color:#aaa;">No users yet.</p>'; return; }
    container.innerHTML = `
      <table class="table">
        <thead><tr><th>#</th><th>Email</th><th>Phone</th><th>Joined</th><th>Action</th></tr></thead>
        <tbody>
          ${data.map((u, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${u.email || '—'}</td>
              <td>${u.phone || '—'}</td>
              <td>${u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : '—'}</td>
              <td>
                <button data-id="${u.id}" data-action="delete-user" class="btn btn-secondary" style="padding:5px 12px;font-size:0.8rem;border-color:rgba(231,76,60,0.3);color:#e74c3c;">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  } catch (e) { container.innerHTML = '<p style="color:#e74c3c;">Error loading users.</p>'; }
}

async function loadApplications() {
  const container = document.getElementById('applications-grid');
  if (!container) return;
  try {
    const data = await adminGetCollection('business_apps');
    if (!data.length) { container.innerHTML = '<p style="color:#aaa;">No applications yet.</p>'; return; }
    container.innerHTML = `<table class="table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Message</th><th>Action</th></tr></thead><tbody>
      ${data.map(a => `<tr>
        <td>${a.name||'—'}</td>
        <td>${a.email||'—'}</td>
        <td>${a.phone||'—'}</td>
        <td>${a.message||'—'}</td>
        <td><button data-id="${a.id}" data-action="delete-application" style="background:none;border:none;cursor:pointer;color:#e74c3c;font-size:0.9rem;padding:4px 8px;border-radius:6px;" title="Delete"><i class="fas fa-trash"></i></button></td>
      </tr>`).join('')}
    </tbody></table>`;
  } catch (e) { container.innerHTML = '<p style="color:#e74c3c;">Error loading applications.</p>'; }
}

async function loadMessages() {
  const container = document.getElementById('messages-grid');
  if (!container) return;
  try {
    const data = await adminGetCollection('contacts');
    if (!data.length) { container.innerHTML = '<p style="color:#aaa;">No messages yet.</p>'; return; }
    container.innerHTML = `<table class="table"><thead><tr><th>Name</th><th>Email</th><th>Subject</th><th>Message</th><th>Action</th></tr></thead><tbody>
      ${data.map(m => `<tr>
        <td>${m.name||'—'}</td>
        <td>${m.email||'—'}</td>
        <td>${m.subject||'—'}</td>
        <td>${m.message||'—'}</td>
        <td><button data-id="${m.id}" data-action="delete-message" style="background:none;border:none;cursor:pointer;color:#e74c3c;font-size:0.9rem;padding:4px 8px;border-radius:6px;" title="Delete"><i class="fas fa-trash"></i></button></td>
      </tr>`).join('')}
    </tbody></table>`;
  } catch (e) { container.innerHTML = '<p style="color:#e74c3c;">Error loading messages.</p>'; }
}

async function handleAddProduct(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i>Adding...';
  btn.disabled = true;
  try {
    const name = document.getElementById('product-name').value.trim();
    const price = parseFloat(document.getElementById('product-price').value);
    const description = document.getElementById('product-desc').value.trim();
    const imageFile = document.getElementById('product-image').files[0];
    let imageUrl = '';
    if (imageFile) imageUrl = await uploadImage(imageFile);
    await adminAddDoc('products', { name, price, description, image: imageUrl });
    e.target.reset();
    await loadAdminProducts();
    await loadStats();
  } catch (err) {
    console.error('Add product error:', err);
    alert('Error adding product: ' + err.message);
  }
  btn.innerHTML = '<i class="fas fa-plus" style="margin-right:6px;"></i>Add Product';
  btn.disabled = false;
}

// Single delegated event listener on the whole admin main — handles all dynamic buttons
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === 'delete-product') {
    if (confirm('Delete this product?')) {
      await adminDeleteDoc('products', id);
      loadAdminProducts();
      loadStats();
    }
  } else if (action === 'approve-testimonial') {
    await adminUpdateDoc('testimonials', id, { approved: true });
    loadAdminTestimonials();
  } else if (action === 'delete-testimonial') {
    if (confirm('Delete this testimonial?')) {
      await adminDeleteDoc('testimonials', id);
      loadAdminTestimonials();
      loadStats();
    }
  } else if (action === 'delete-user') {
    if (confirm('Delete this user? This removes their data but not their login account.')) {
      await adminDeleteDoc('users', id);
      loadUsers();
      loadStats();
    }
  } else if (action === 'delete-order') {
    if (confirm('Delete this order? This cannot be undone.')) {
      await adminDeleteDoc('orders', id);
      loadOrders();
      loadStats();
    }
  } else if (action === 'delete-application') {
    if (confirm('Delete this application?')) {
      await adminDeleteDoc('business_apps', id);
      loadApplications();
    }
  } else if (action === 'delete-message') {
    if (confirm('Delete this message?')) {
      await adminDeleteDoc('contacts', id);
      loadMessages();
      loadStats();
    }
  }
});

// Update order status from dropdown
document.addEventListener('change', async (e) => {
  if (e.target.matches('select[onchange^="updateOrderStatus"]')) return; // handled inline
});

window.updateOrderStatus = async (id, status) => {
  await adminUpdateDoc('orders', id, { status });
  loadStats();
};
