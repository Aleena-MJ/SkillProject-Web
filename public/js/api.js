/**
 * API Client & Utility Library for SkillProject-Web
 */

const API_BASE = '/api';

// Toast Notification Manager
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${escapeHTML(message)}</span>
    <button style="background:none;border:none;cursor:pointer;font-size:1.1rem;color:var(--text-muted);">&times;</button>
  `;

  const closeBtn = toast.querySelector('button');
  closeBtn.addEventListener('click', () => toast.remove());

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// XSS Prevention helper
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Auth State Helpers
function getToken() {
  return localStorage.getItem('skill_token');
}

function getCurrentUser() {
  const user = localStorage.getItem('skill_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

function setAuth(token, user) {
  localStorage.setItem('skill_token', token);
  localStorage.setItem('skill_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('skill_token');
  localStorage.removeItem('skill_user');
}

function isLoggedIn() {
  return !!getToken();
}

function requireAuth(redirectUrl = 'login.html') {
  if (!isLoggedIn()) {
    showToast('Please log in to access this page.', 'warning');
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 400);
    return false;
  }
  return true;
}

function logout() {
  clearAuth();
  showToast('You have been logged out.', 'info');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 300);
}

// Centralized API Request Wrapper
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      clearAuth();
      showToast('Session expired. Please log in again.', 'warning');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 800);
      throw new Error(data.message || 'Unauthorized');
    }

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

// Helper to format date
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
