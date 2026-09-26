/**
 * Student Dashboard Logic for SkillProject-Web
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  await loadDashboardProfileAndStats();
  await loadRecentIncomingRequests();
  await loadMySkillsPreview();
});

async function loadDashboardProfileAndStats() {
  try {
    const data = await apiRequest('/auth/me');
    const user = data.user;
    const stats = data.stats;

    // Update greeting
    const greetingEl = document.getElementById('dash-greeting');
    const infoEl = document.getElementById('dash-student-info');
    const avatarEl = document.getElementById('dash-avatar');

    if (greetingEl) greetingEl.textContent = `Welcome back, ${user.name}!`;
    if (infoEl) {
      const parts = [user.major, user.college].filter(Boolean);
      infoEl.textContent = parts.length > 0 ? parts.join(' • ') : user.email;
    }
    if (avatarEl) {
      avatarEl.textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    // Update KPI numbers
    document.getElementById('stat-my-skills').textContent = stats.skillsCount || 0;
    document.getElementById('stat-received-requests').textContent = stats.receivedRequestsCount || 0;
    document.getElementById('stat-sent-requests').textContent = stats.sentRequestsCount || 0;
    document.getElementById('stat-accepted').textContent = stats.acceptedCount || 0;

    // Cache updated user
    localStorage.setItem('skill_user', JSON.stringify(user));
  } catch (error) {
    showToast('Failed to load dashboard statistics.', 'error');
  }
}

async function loadRecentIncomingRequests() {
  const container = document.getElementById('dash-incoming-container');
  if (!container) return;

  try {
    const data = await apiRequest('/requests/received');
    const requests = data.requests || [];

    if (requests.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📬</div>
          <p style="font-weight: 500;">No incoming requests yet.</p>
          <p style="font-size: 0.85rem; margin-top: 0.25rem;">When students request to learn your skills, they will show up here.</p>
        </div>
      `;
      return;
    }

    // Display up to 3 most recent requests
    const displayList = requests.slice(0, 3);
    container.innerHTML = displayList.map(req => `
      <div style="padding: 1rem 0; border-bottom: 1px solid var(--border);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <div>
            <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHTML(req.requester_name)}</strong>
            <span style="font-size: 0.82rem; color: var(--text-muted);"> wants to learn </span>
            <span style="font-weight: 600; color: var(--primary); font-size: 0.92rem;">"${escapeHTML(req.skill_title)}"</span>
          </div>
          <span class="badge ${getStatusBadgeClass(req.status)}">${escapeHTML(req.status)}</span>
        </div>

        <p style="font-size: 0.88rem; color: var(--text-muted); background: var(--bg-alt); padding: 0.6rem 0.75rem; border-radius: var(--radius-sm); margin-bottom: 0.75rem;">
          "${escapeHTML(req.message)}"
        </p>

        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-light);">
          <span>${formatDate(req.created_at)}</span>
          ${req.status === 'pending' ? `
            <div style="display: flex; gap: 0.5rem;">
              <button onclick="respondToRequest(${req.id}, 'accepted')" class="btn btn-success btn-sm">Accept</button>
              <button onclick="respondToRequest(${req.id}, 'rejected')" class="btn btn-secondary btn-sm">Decline</button>
            </div>
          ` : `
            <span style="color: var(--text-muted); font-size: 0.82rem;">Responded</span>
          `}
        </div>
      </div>
    `).join('');
  } catch (error) {
    container.innerHTML = `<p style="color: var(--danger); text-align: center;">Failed to load incoming requests.</p>`;
  }
}

async function loadMySkillsPreview() {
  const container = document.getElementById('dash-myskills-container');
  if (!container) return;

  try {
    const data = await apiRequest('/skills/my-skills');
    const skills = data.skills || [];

    if (skills.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">💡</div>
          <p style="font-weight: 500;">You haven't listed any skills yet.</p>
          <p style="font-size: 0.85rem; margin-top: 0.25rem; margin-bottom: 1rem;">Share your knowledge with fellow students.</p>
          <a href="add-skill.html" class="btn btn-primary btn-sm">+ Offer a Skill</a>
        </div>
      `;
      return;
    }

    container.innerHTML = skills.map(skill => `
      <div style="padding: 0.85rem 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 600; color: var(--text-main); font-size: 0.95rem;">${escapeHTML(skill.title)}</div>
          <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.25rem;">
            <span class="badge badge-cat-${skill.category.toLowerCase().replace(/[^a-z0-9]/g, '')}">${escapeHTML(skill.category)}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHTML(skill.proficiency)}</span>
          </div>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.82rem; color: var(--primary); font-weight: 600;">
            ${skill.request_count} ${skill.request_count === 1 ? 'request' : 'requests'}
          </span>
        </div>
      </div>
    `).join('');
  } catch (error) {
    container.innerHTML = `<p style="color: var(--danger); text-align: center;">Failed to load your skills.</p>`;
  }
}

async function respondToRequest(requestId, status) {
  try {
    const result = await apiRequest(`/requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    showToast(result.message || `Request ${status}!`, 'success');
    await loadRecentIncomingRequests();
    await loadDashboardProfileAndStats();
  } catch (error) {
    showToast(error.message || 'Failed to update request.', 'error');
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'accepted': return 'badge-success';
    case 'rejected': return 'badge-danger';
    default: return 'badge-warning';
  }
}
