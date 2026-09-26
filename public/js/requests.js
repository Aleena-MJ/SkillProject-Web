/**
 * Requests & Teaching Skills Management Logic for SkillProject-Web
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  setupTabs();
  await loadAllData();
});

function setupTabs() {
  const tabsNav = document.getElementById('requests-tabs');
  if (!tabsNav) return;

  // Check URL query parameters for initial tab
  const urlParams = new URLSearchParams(window.location.search);
  const requestedTab = urlParams.get('tab');
  if (requestedTab) {
    activateTab(`tab-${requestedTab}`);
  }

  tabsNav.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    const targetId = btn.dataset.tab;
    activateTab(targetId);
  });
}

function activateTab(tabId) {
  const buttons = document.querySelectorAll('.tab-btn');
  const panes = document.querySelectorAll('.tab-pane');

  let found = false;
  buttons.forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active');
      found = true;
    } else {
      btn.classList.remove('active');
    }
  });

  if (!found && buttons.length > 0) {
    buttons[0].classList.add('active');
    tabId = buttons[0].dataset.tab;
  }

  panes.forEach(pane => {
    if (pane.id === tabId) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });
}

async function loadAllData() {
  await Promise.all([
    loadReceivedRequests(),
    loadSentRequests(),
    loadMySkills()
  ]);
}

// ----------------------------------------------------
// TAB 1: Received Requests
// ----------------------------------------------------
async function loadReceivedRequests() {
  const container = document.getElementById('received-list');
  const countBadge = document.getElementById('badge-received-count');
  if (!container) return;

  try {
    const data = await apiRequest('/requests/received');
    const requests = data.requests || [];

    if (countBadge) countBadge.textContent = requests.length;

    if (requests.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--border);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📬</div>
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">No received requests yet</h3>
          <p style="color: var(--text-muted); max-width: 450px; margin: 0 auto 1.5rem;">
            When students see your listed skills and want to learn from you, their requests will appear here.
          </p>
          <a href="add-skill.html" class="btn btn-primary">+ Post Another Skill</a>
        </div>
      `;
      return;
    }

    container.innerHTML = requests.map(req => {
      const isPending = req.status === 'pending';
      const isAccepted = req.status === 'accepted';
      const initials = req.requester_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      return `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; border-left: 4px solid ${isAccepted ? 'var(--success)' : isPending ? 'var(--warning)' : 'var(--danger)'};">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div class="avatar" style="width: 36px; height: 36px; font-size: 0.85rem;">${initials}</div>
                <div>
                  <div style="font-weight: 700; font-size: 1rem; color: var(--text-main);">${escapeHTML(req.requester_name)}</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHTML(req.requester_major || req.requester_college || 'Student')}</div>
                </div>
              </div>
              <span class="badge ${getStatusBadge(req.status)}">${escapeHTML(req.status)}</span>
            </div>

            <div style="margin-bottom: 0.75rem;">
              <span style="font-size: 0.82rem; color: var(--text-muted);">Requesting:</span>
              <div style="font-weight: 600; color: var(--primary); font-size: 1.05rem;">
                ${escapeHTML(req.skill_title)}
              </div>
            </div>

            <div style="background-color: var(--bg-alt); padding: 0.85rem; border-radius: var(--radius-md); margin-bottom: 0.85rem;">
              <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem;">Student's Message:</div>
              <p style="font-size: 0.9rem; color: var(--text-main); line-height: 1.5;">"${escapeHTML(req.message)}"</p>
            </div>

            ${req.preferred_time ? `
              <div style="font-size: 0.84rem; color: var(--text-muted); margin-bottom: 0.85rem;">
                🕒 <strong>Preferred Time:</strong> ${escapeHTML(req.preferred_time)}
              </div>
            ` : ''}

            ${isAccepted ? `
              <div style="background-color: var(--success-light); border: 1px solid rgba(16, 185, 129, 0.2); padding: 0.75rem; border-radius: var(--radius-md); margin-bottom: 0.85rem; font-size: 0.88rem;">
                <strong style="color: var(--success-text);">🎉 Connection Accepted!</strong>
                <div style="margin-top: 0.25rem; color: var(--text-main);">
                  Student Email: <strong>${escapeHTML(req.requester_email)}</strong><br>
                  ${req.requester_contact ? `Direct Contact: <strong>${escapeHTML(req.requester_contact)}</strong>` : ''}
                </div>
              </div>
            ` : ''}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 0.85rem; margin-top: 0.5rem;">
            <span style="font-size: 0.8rem; color: var(--text-light);">${formatDate(req.created_at)}</span>

            ${isPending ? `
              <div style="display: flex; gap: 0.5rem;">
                <button onclick="updateRequestStatus(${req.id}, 'accepted')" class="btn btn-success btn-sm">Accept</button>
                <button onclick="updateRequestStatus(${req.id}, 'rejected')" class="btn btn-secondary btn-sm">Decline</button>
              </div>
            ` : `
              <span style="font-size: 0.82rem; font-weight: 600; color: var(--text-muted);">Status: ${escapeHTML(req.status)}</span>
            `}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--danger); padding: 2rem;">Failed to load received requests.</div>`;
  }
}

// ----------------------------------------------------
// TAB 2: Sent Requests
// ----------------------------------------------------
async function loadSentRequests() {
  const container = document.getElementById('sent-list');
  const countBadge = document.getElementById('badge-sent-count');
  if (!container) return;

  try {
    const data = await apiRequest('/requests/sent');
    const requests = data.requests || [];

    if (countBadge) countBadge.textContent = requests.length;

    if (requests.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--border);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🚀</div>
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">You haven't sent any requests</h3>
          <p style="color: var(--text-muted); max-width: 450px; margin: 0 auto 1.5rem;">
            Find something you want to learn and request tutoring from talented peers on campus!
          </p>
          <a href="skills.html" class="btn btn-primary">Browse Skills Catalog</a>
        </div>
      `;
      return;
    }

    container.innerHTML = requests.map(req => {
      const isPending = req.status === 'pending';
      const isAccepted = req.status === 'accepted';
      const initials = req.teacher_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      return `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; border-left: 4px solid ${isAccepted ? 'var(--success)' : isPending ? 'var(--warning)' : 'var(--danger)'};">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div class="avatar" style="width: 36px; height: 36px; font-size: 0.85rem;">${initials}</div>
                <div>
                  <div style="font-weight: 700; font-size: 1rem; color: var(--text-main);">${escapeHTML(req.teacher_name)}</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHTML(req.teacher_major || req.teacher_college || 'Teacher')}</div>
                </div>
              </div>
              <span class="badge ${getStatusBadge(req.status)}">${escapeHTML(req.status)}</span>
            </div>

            <div style="margin-bottom: 0.75rem;">
              <span style="font-size: 0.82rem; color: var(--text-muted);">Skill Requested:</span>
              <div style="font-weight: 600; color: var(--primary); font-size: 1.05rem;">
                ${escapeHTML(req.skill_title)}
              </div>
            </div>

            <div style="background-color: var(--bg-alt); padding: 0.85rem; border-radius: var(--radius-md); margin-bottom: 0.85rem;">
              <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem;">Your Note:</div>
              <p style="font-size: 0.9rem; color: var(--text-main); line-height: 1.5;">"${escapeHTML(req.message)}"</p>
            </div>

            ${isAccepted ? `
              <div style="background-color: var(--success-light); border: 1px solid rgba(16, 185, 129, 0.2); padding: 0.75rem; border-radius: var(--radius-md); margin-bottom: 0.85rem; font-size: 0.88rem;">
                <strong style="color: var(--success-text);">🎉 Teacher Accepted Your Request!</strong>
                <div style="margin-top: 0.25rem; color: var(--text-main);">
                  Teacher Email: <strong>${escapeHTML(req.teacher_email)}</strong><br>
                  ${req.teacher_contact ? `Direct Contact: <strong>${escapeHTML(req.teacher_contact)}</strong>` : ''}
                </div>
              </div>
            ` : isPending ? `
              <div style="background-color: var(--warning-light); color: var(--warning-text); padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.82rem; margin-bottom: 0.85rem;">
                ⏳ Waiting for teacher to respond.
              </div>
            ` : `
              <div style="background-color: var(--danger-light); color: var(--danger-text); padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.82rem; margin-bottom: 0.85rem;">
                ❌ Teacher was unable to accept at this time.
              </div>
            `}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 0.85rem; margin-top: 0.5rem;">
            <span style="font-size: 0.8rem; color: var(--text-light);">${formatDate(req.created_at)}</span>

            ${isPending ? `
              <button onclick="cancelSentRequest(${req.id})" class="btn btn-secondary btn-sm" style="color: var(--danger); border-color: var(--border);">
                Cancel Request
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--danger); padding: 2rem;">Failed to load sent requests.</div>`;
  }
}

// ----------------------------------------------------
// TAB 3: My Teaching Skills
// ----------------------------------------------------
async function loadMySkills() {
  const container = document.getElementById('my-skills-list');
  const countBadge = document.getElementById('badge-skills-count');
  if (!container) return;

  try {
    const data = await apiRequest('/skills/my-skills');
    const skills = data.skills || [];

    if (countBadge) countBadge.textContent = skills.length;

    if (skills.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--border);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎓</div>
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">You haven't listed any teaching skills yet</h3>
          <p style="color: var(--text-muted); max-width: 450px; margin: 0 auto 1.5rem;">
            Whether you are great at Python, Calculus, Design, or Spanish, share your knowledge with campus peers!
          </p>
          <a href="add-skill.html" class="btn btn-primary">+ Post Your First Skill</a>
        </div>
      `;
      return;
    }

    container.innerHTML = skills.map(skill => {
      const catClass = `badge-cat-${skill.category.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      return `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.75rem;">
              <span class="badge ${catClass}">${escapeHTML(skill.category)}</span>
              <span class="badge badge-secondary">${escapeHTML(skill.proficiency || 'Intermediate')}</span>
            </div>

            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-main);">
              ${escapeHTML(skill.title)}
            </h3>

            <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1rem;">
              ${escapeHTML(skill.description)}
            </p>

            <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.5rem;">
              🕒 <strong>Availability:</strong> ${escapeHTML(skill.availability || 'Flexible')}
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 0.85rem; margin-top: 1rem;">
            <span style="font-size: 0.82rem; color: var(--primary); font-weight: 600;">
              ${skill.request_count} ${skill.request_count === 1 ? 'student request' : 'student requests'}
            </span>

            <button onclick="deleteSkill(${skill.id}, '${escapeHTML(skill.title.replace(/'/g, "\\'"))}')" class="btn btn-secondary btn-sm" style="color: var(--danger); border-color: var(--border);">
              Delete
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--danger); padding: 2rem;">Failed to load your skills.</div>`;
  }
}

// Actions
async function updateRequestStatus(requestId, status) {
  try {
    const result = await apiRequest(`/requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });

    showToast(result.message || `Request updated to ${status}!`, 'success');
    await loadReceivedRequests();
  } catch (error) {
    showToast(error.message || 'Failed to update request status.', 'error');
  }
}

async function cancelSentRequest(requestId) {
  if (!confirm('Are you sure you want to cancel this learning request?')) return;

  try {
    const result = await apiRequest(`/requests/${requestId}`, {
      method: 'DELETE'
    });

    showToast(result.message || 'Request cancelled.', 'info');
    await loadSentRequests();
  } catch (error) {
    showToast(error.message || 'Failed to cancel request.', 'error');
  }
}

async function deleteSkill(skillId, skillTitle) {
  if (!confirm(`Are you sure you want to delete your skill listing "${skillTitle}"? This will also remove any related requests.`)) {
    return;
  }

  try {
    const result = await apiRequest(`/skills/${skillId}`, {
      method: 'DELETE'
    });

    showToast(result.message || 'Skill deleted.', 'success');
    await loadMySkills();
  } catch (error) {
    showToast(error.message || 'Failed to delete skill.', 'error');
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'accepted': return 'badge-success';
    case 'rejected': return 'badge-danger';
    default: return 'badge-warning';
  }
}
