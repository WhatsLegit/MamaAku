
// Auth Module
import { auth, login, signup, logout, resetPassword, onAuthChange, checkAdminRole } from './firebase.js';

let currentUser = null;
let currentUserIsAdmin = false;

export function initAuth() {
  onAuthChange(async (user) => {
    currentUser = user;
    if (user) {
      currentUserIsAdmin = await checkAdminRole(user.uid);
      // If admin, hide auth UI on public site but don't sign them out
      if (currentUserIsAdmin) {
        currentUser = null; // hide from public UI
      }
    } else {
      currentUserIsAdmin = false;
    }
    updateAuthUI();
  });
}

function updateAuthUI() {
  const authLinks = document.querySelector('.auth-links');
  if (!authLinks) return;
  if (currentUser) {
    const initial = currentUser.email ? currentUser.email[0].toUpperCase() : '?';
    authLinks.innerHTML = `
      <div style="position:relative;display:inline-block;">
        <button onclick="toggleAccountMenu()" style="width:36px;height:36px;border-radius:50%;background:rgba(139,195,74,0.15);border:1.5px solid rgba(139,195,74,0.4);color:#5a8a2a;font-weight:700;font-size:0.95rem;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit;">
          ${initial}
        </button>
        <div id="account-menu" style="display:none;position:absolute;right:0;top:44px;background:rgba(255,255,255,0.95);backdrop-filter:blur(16px);border:1px solid rgba(0,0,0,0.08);border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,0.1);min-width:200px;z-index:999;padding:0.5rem;">
          <div style="padding:0.75rem 1rem;border-bottom:1px solid rgba(0,0,0,0.07);font-size:0.82rem;color:#888;word-break:break-all;">${currentUser.email}</div>
          <button onclick="handleLogout()" style="width:100%;text-align:left;padding:0.75rem 1rem;background:none;border:none;cursor:pointer;font-size:0.88rem;color:#e74c3c;font-family:inherit;border-radius:8px;display:flex;align-items:center;gap:8px;">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>
    `;
  } else {
    authLinks.innerHTML = `
      <a href="login.html" class="btn btn-secondary" style="padding:8px 18px;">Login</a>
      <a href="signup.html" class="btn btn-primary" style="padding:8px 18px;">Signup</a>
    `;
  }
}

window.toggleAccountMenu = () => {
  const menu = document.getElementById('account-menu');
  if (!menu) return;
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
};

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  const menu = document.getElementById('account-menu');
  if (menu && !e.target.closest('.auth-links')) {
    menu.style.display = 'none';
  }
});

window.handleLogin = async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Logging in...'; btn.disabled = true;
  const result = await login(email, password);
  if (result.success) {
    window.location.href = 'index.html';
  } else {
    showAuthError('login-error', result.error);
    btn.textContent = 'Login'; btn.disabled = false;
  }
};

window.handleSignup = async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const phone = document.getElementById('signup-phone').value;
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Creating account...'; btn.disabled = true;
  const result = await signup(email, password, phone);
  if (result.success) {
    window.location.href = 'index.html';
  } else {
    showAuthError('signup-error', result.error);
    btn.textContent = 'Create Account'; btn.disabled = false;
  }
};

window.handleLogout = async () => {
  await logout();
  window.location.href = 'index.html';
};

window.handleResetPassword = async (e) => {
  e.preventDefault();
  const email = document.getElementById('reset-email').value;
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Sending...'; btn.disabled = true;
  try {
    await resetPassword(email);
    document.getElementById('reset-success').style.display = 'block';
  } catch (error) {
    alert('Error: ' + error.message);
  }
  btn.textContent = 'Send Reset Link'; btn.disabled = false;
};

function showAuthError(id, message) {
  const el = document.getElementById(id);
  if (el) { el.textContent = message; el.style.display = 'block'; }
}

export function isAdmin() { return currentUserIsAdmin; }
export { currentUser };
