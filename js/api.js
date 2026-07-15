// js/api.js — shared fetch wrapper, auth storage, and small UI helpers.
const API_BASE = '/api';

const Auth = {
  getToken() { return localStorage.getItem('gym_token'); },
  getUser() { try { return JSON.parse(localStorage.getItem('gym_user')); } catch { return null; } },
  setSession(token, user) {
    localStorage.setItem('gym_token', token);
    localStorage.setItem('gym_user', JSON.stringify(user));
  },
  clear() { localStorage.removeItem('gym_token'); localStorage.removeItem('gym_user'); },
  isLoggedIn() { return !!this.getToken(); }
};

async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && Auth.getToken()) headers['Authorization'] = `Bearer ${Auth.getToken()}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  try { data = await res.json(); } catch { /* empty response */ }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    if (res.status === 401) { Auth.clear(); }
    throw new Error(message);
  }
  return data;
}

function toast(message, type = 'info') {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' error' : ''}`;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function fmtMoney(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function badgeClass(status) {
  return `badge badge-${(status || '').toLowerCase()}`;
}

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function requireLoginOrRedirect(expectedRole) {
  const user = Auth.getUser();
  if (!Auth.isLoggedIn() || !user) {
    window.location.href = 'index.html';
    return null;
  }
  if (expectedRole && user.role !== expectedRole) {
    // Member trying to hit admin.html or vice versa
    window.location.href = user.role === 'member' ? 'index.html' : 'admin.html';
    return null;
  }
  return user;
}
