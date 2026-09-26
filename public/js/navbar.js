/**
 * Dynamic Navbar Component for SkillProject-Web
 */

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});

function renderNavbar() {
  const navContainer = document.getElementById('main-nav');
  if (!navContainer) return;

  const loggedIn = isLoggedIn();
  const user = getCurrentUser();
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  let navLinksHTML = '';

  if (loggedIn) {
    navLinksHTML = `
      <li><a href="dashboard.html" class="${currentPath === 'dashboard.html' ? 'active' : ''}">📊 Dashboard</a></li>
      <li><a href="skills.html" class="${currentPath === 'skills.html' ? 'active' : ''}">🔍 Browse Skills</a></li>
      <li><a href="add-skill.html" class="${currentPath === 'add-skill.html' ? 'active' : ''}">➕ Teach a Skill</a></li>
      <li><a href="requests.html" class="${currentPath === 'requests.html' ? 'active' : ''}">📬 Requests</a></li>
      <li><a href="profile.html" class="${currentPath === 'profile.html' ? 'active' : ''}">👤 Profile</a></li>
    `;
  } else {
    navLinksHTML = `
      <li><a href="index.html" class="${currentPath === 'index.html' || currentPath === '' ? 'active' : ''}">Home</a></li>
      <li><a href="skills.html" class="${currentPath === 'skills.html' ? 'active' : ''}">Browse Skills</a></li>
    `;
  }

  let authButtonsHTML = '';
  if (loggedIn) {
    authButtonsHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <span style="font-size:0.88rem;color:var(--text-muted);display:none;margin-right:4px;" class="desktop-user-greet">
          Hi, <strong>${escapeHTML(user?.name ? user.name.split(' ')[0] : 'Student')}</strong>
        </span>
        <button onclick="logout()" class="btn btn-secondary btn-sm" title="Log Out">Log Out</button>
      </div>
    `;
  } else {
    authButtonsHTML = `
      <a href="login.html" class="btn btn-secondary btn-sm">Log In</a>
      <a href="register.html" class="btn btn-primary btn-sm">Get Started</a>
    `;
  }

  navContainer.innerHTML = `
    <nav class="navbar">
      <div class="nav-container">
        <a href="${loggedIn ? 'dashboard.html' : 'index.html'}" class="brand">
          <div class="brand-icon">🎓</div>
          <span>SkillProject<span style="color:var(--primary);">-Web</span></span>
        </a>

        <button class="mobile-menu-btn" id="mobile-toggle" aria-label="Toggle navigation menu">
          ☰
        </button>

        <ul class="nav-links" id="nav-links-list">
          ${navLinksHTML}
          <li class="nav-auth-buttons">
            ${authButtonsHTML}
          </li>
        </ul>
      </div>
    </nav>
  `;

  // Attach mobile menu toggle event
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinksList = document.getElementById('nav-links-list');

  if (mobileToggle && navLinksList) {
    mobileToggle.addEventListener('click', () => {
      navLinksList.classList.toggle('open');
      mobileToggle.textContent = navLinksList.classList.contains('open') ? '✕' : '☰';
    });
  }
}
