/**
 * Home Page Logic for SkillProject-Web
 */

document.addEventListener('DOMContentLoaded', async () => {
  setupHeroCTA();
  await loadFeaturedSkills();
});

function setupHeroCTA() {
  if (isLoggedIn()) {
    const joinBtn = document.getElementById('join-btn');
    if (joinBtn) {
      joinBtn.textContent = 'Go to Dashboard';
      joinBtn.href = 'dashboard.html';
      joinBtn.className = 'btn btn-secondary btn-lg';
    }
  }
}

async function loadFeaturedSkills() {
  const container = document.getElementById('featured-skills-grid');
  const statSkills = document.getElementById('stat-skills');

  try {
    const data = await apiRequest('/skills');
    const skills = data.skills || [];

    if (statSkills) {
      statSkills.textContent = skills.length;
    }

    if (!container) return;

    if (skills.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border);">
          <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 1rem;">No skills have been posted yet. Be the first to share your knowledge!</p>
          <a href="add-skill.html" class="btn btn-primary">Offer a Skill Now</a>
        </div>
      `;
      return;
    }

    // Display first 6 featured skills
    const featured = skills.slice(0, 6);
    container.innerHTML = featured.map(skill => createSkillCardHTML(skill)).join('');
  } catch (error) {
    console.error('Failed to load featured skills:', error);
    if (container) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--danger); padding: 2rem;">
          Could not load skills at this moment. Please check your backend connection.
        </div>
      `;
    }
  }
}

function createSkillCardHTML(skill) {
  const catClass = `badge-cat-${skill.category.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const currentUser = getCurrentUser();
  const isOwnSkill = currentUser && currentUser.id === skill.user_id;

  const initials = skill.teacher_name
    ? skill.teacher_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'TU';

  return `
    <div class="skill-card">
      <div class="skill-card-header">
        <span class="badge ${catClass}">${escapeHTML(skill.category)}</span>
        <span class="badge badge-secondary">${escapeHTML(skill.proficiency || 'Intermediate')}</span>
      </div>

      <h3 class="skill-title">${escapeHTML(skill.title)}</h3>
      <p class="skill-desc">${escapeHTML(skill.description)}</p>

      <div class="skill-meta">
        <div class="skill-meta-item">
          <span>🕒</span>
          <span><strong>Format:</strong> ${escapeHTML(skill.availability || 'Flexible')}</span>
        </div>
      </div>

      <div class="skill-teacher-bar">
        <div class="avatar">${initials}</div>
        <div class="teacher-details">
          <div class="teacher-name">${escapeHTML(skill.teacher_name)}</div>
          <div class="teacher-sub">${escapeHTML(skill.teacher_major || skill.teacher_college || 'Student Mentor')}</div>
        </div>
      </div>

      <div style="margin-top: 1rem;">
        ${isOwnSkill ? `
          <span class="btn btn-secondary btn-sm" style="width: 100%; cursor: default;">Your Listed Skill</span>
        ` : `
          <a href="skills.html?search=${encodeURIComponent(skill.title)}" class="btn btn-primary btn-sm" style="width: 100%;">
            View & Request
          </a>
        `}
      </div>
    </div>
  `;
}
