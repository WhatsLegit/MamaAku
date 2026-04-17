// Global App Module
import { initAuth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initNavbar();
  initAnimations();
  initSmoothScroll();
  updateCartUI();
});

function initNavbar() {
  const navbar = document.querySelector('nav');
  if (!navbar) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('glass', window.scrollY > 50);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function initAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-in, .slide-left').forEach(el => observer.observe(el));
}

// ===== CART — localStorage only =====
export let cart = JSON.parse(localStorage.getItem('cart') || '[]');

export function addToCart(productId, name, price, image) {
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.quantity += 1;
  } else {
    cart.push({ id: productId, name, price: Number(price), image, quantity: 1 });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
  if (typeof window.loadCart === 'function') window.loadCart();
}

export function removeFromCart(productId) {
  const updated = cart.filter(i => i.id !== productId);
  cart.length = 0;
  cart.push(...updated);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
  if (typeof window.loadCart === 'function') window.loadCart();
}

export function clearCart() {
  cart.length = 0;
  localStorage.removeItem('cart');
  updateCartUI();
  if (typeof window.loadCart === 'function') window.loadCart();
}

function updateCartUI() {
  const cartCount = document.querySelector('.cart-count');
  if (cartCount) {
    cartCount.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);
  }
}

// Expose globally for inline onclick handlers
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;

window.showModal = (id) => { document.getElementById(id).style.display = 'block'; };
window.closeModal = (id) => { document.getElementById(id).style.display = 'none'; };

// Mobile nav toggle
window.toggleNav = () => {
  const nav = document.getElementById('nav-links');
  const btn = document.getElementById('hamburger');
  if (!nav) return;
  nav.classList.toggle('open');
  btn.classList.toggle('open');
};

// Close nav when a link is clicked
document.addEventListener('click', (e) => {
  if (e.target.closest('#nav-links a')) {
    document.getElementById('nav-links')?.classList.remove('open');
    document.getElementById('hamburger')?.classList.remove('open');
  }
});
