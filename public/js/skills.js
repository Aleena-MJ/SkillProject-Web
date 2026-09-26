/**
 * Skills Browsing, Search, and Request Modal Logic for SkillProject-Web
 */

let currentCategory = 'All';
let currentProficiency = 'All';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', async () => {
  // Check URL query parameters (e.g. ?search=python)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('search')) {
    currentSearch = urlParams.get('search');
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = currentSearch;
  }
  if (urlParams.has('category')) {
    currentCategory = urlParams.get('category');
    updateCategoryPillState(currentCategory);
  }

  setupEventListeners();
  await fetchAndRenderSkills();
});

function setupEventListeners() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const resetBtn = document.getElementById('reset-btn');
  const proficiencySelect = document.getElementById('filter-proficiency');
  const pillsContainer = document.getElementById('category-pills-container');
  const requestForm = document.getElementById('send-request-form');

  // Search input enter key
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        currentSearch = searchInput.value.trim();
        fetchAndRenderSkills();
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      currentSearch = searchInput ? searchInput.value.trim() : '';
      fetchAndRenderSkills();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentSearch = '';
      currentCategory = 'All';
      currentProficiency = 'All';
      if (searchInput) searchInput.value = '';
      if (proficiencySelect) proficiencySelect.value = 'All';
      updateCategoryPillState('All');
      fetchAndRenderSkills();
    });
  }

  if (proficiencySelect) {
    proficiencySelect.addEventListener('change', (e) => {
      currentProficiency = e.target.value;
      fetchAndRenderSkills();
    });
  }

  if (pillsContainer) {
    pillsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      currentCategory = btn.dataset.category || 'All';
      updateCategoryPillState(currentCategory);
      fetchAndRenderSkills();
    });
  }

  if (requestForm) {
    requestForm.addEventListener('submit', handleSendRequest);
  }
}

function updateCategoryPillState(category) {
  const pills = document.querySelectorAll('.pill-btn');
  pills.forEach(pill => {
    if (pill.dataset.category.toLowerCase() === category.toLowerCase()) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

async function fetchAndRenderSkills() {
  const container = document.getElementById('skills-grid');
  const countEl = document.getElementById('results-count');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
      Searching available skills...
    </div>
  `;

  try {
    const params = new URLSearchParams();
    if (currentSearch) params.append('search', currentSearch);
    if (currentCategory && currentCategory !== 'All') params.append('category', currentCategory);
    if (currentProficiency && currentProficiency !== 'All') params.append('proficiency', currentProficiency);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const data = await apiRequest(`/skills${queryString}`);
    const skills = data.skills || [];

    if (countEl) {
      countEl.textContent = `Found ${skills.length} ${skills.length === 1 ? 'skill' : 'skills'} available to learn`;
    }

    if (skills.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--border);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">No skills found</h3>
          <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto 1.5rem;">
            We couldn't find any skills matching your search criteria. Try adjusting the search keywords or filter.
          </p>
          <a href="add-skill.html" class="btn btn-primary">Offer This Skill Yourself</a>
        </div>
      `;
      return;
    }

    const currentUser = getCurrentUser();

    container.innerHTML = skills.map(skill => {
      const isOwnSkill = currentUser && currentUser.id === skill.user_id;
      const catClass = `badge-cat-${skill.category.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const initials = skill.teacher_name
        ? skill.teacher_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'ST';

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
              <span><strong>Availability:</strong> ${escapeHTML(skill.availability || 'Flexible')}</span>
            </div>
            ${skill.teacher_college ? `
              <div class="skill-meta-item">
                <span>🏛️</span>
                <span>${escapeHTML(skill.teacher_college)}</span>
              </div>
            ` : ''}
          </div>

          <div class="skill-teacher-bar">
            <div class="avatar">${initials}</div>
            <div class="teacher-details">
              <div class="teacher-name">${escapeHTML(skill.teacher_name)}</div>
              <div class="teacher-sub">${escapeHTML(skill.teacher_major || 'Student Mentor')}</div>
            </div>
          </div>

          <div style="margin-top: 1rem;">
            ${isOwnSkill ? `
              <button class="btn btn-secondary btn-sm" style="width: 100%; cursor: default;" disabled>
                You are teaching this
              </button>
            ` : `
              <button onclick="openRequestModal(${skill.id}, '${escapeHTML(skill.title.replace(/'/g, "\\'"))}', '${escapeHTML(skill.teacher_name.replace(/'/g, "\\'"))}')" class="btn btn-primary btn-sm" style="width: 100%;">
                Request to Learn
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--danger); padding: 2rem;">
        Failed to load skills. Please make sure the server is running.
      </div>
    `;
  }
}

// Open modal to request to learn
function openRequestModal(skillId, skillTitle, teacherName) {
  if (!isLoggedIn()) {
    showToast('Please log in or register to request tutoring for this skill.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 800);
    return;
  }

  document.getElementById('modal-skill-id').value = skillId;
  document.getElementById('modal-skill-title').textContent = skillTitle;
  document.getElementById('modal-teacher-name').textContent = teacherName;
  document.getElementById('request-message').value = '';
  document.getElementById('request-time').value = '';

  const modal = document.getElementById('request-modal');
  modal.classList.add('active');
}

function closeRequestModal() {
  const modal = document.getElementById('request-modal');
  if (modal) modal.classList.remove('active');
}

// Handle sending the request
async function handleSendRequest(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('modal-submit-btn');
  const skill_id = parseInt(document.getElementById('modal-skill-id').value, 10);
  const message = document.getElementById('request-message').value.trim();
  const preferred_time = document.getElementById('request-time').value.trim();

  if (!message) {
    showToast('Please enter a message explaining what you would like to learn.', 'warning');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const result = await apiRequest('/requests', {
      method: 'POST',
      body: JSON.stringify({
        skill_id,
        message,
        preferred_time
      })
    });

    closeRequestModal();
    showToast(result.message || 'Learning request sent to teacher!', 'success');
  } catch (error) {
    showToast(error.message || 'Failed to send request.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Request';
  }
}
