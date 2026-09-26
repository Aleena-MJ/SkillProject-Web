/**
 * Profile Page Logic for SkillProject-Web
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  await loadProfile();

  const form = document.getElementById('profile-form');
  if (form) {
    form.addEventListener('submit', handleProfileUpdate);
  }
});

async function loadProfile() {
  try {
    const data = await apiRequest('/auth/me');
    const user = data.user;

    // Update avatar and side card
    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl) {
      avatarEl.textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    document.getElementById('profile-display-name').textContent = user.name;
    document.getElementById('profile-display-email').textContent = user.email;
    document.getElementById('profile-display-college').textContent = user.college || 'Not specified';
    document.getElementById('profile-display-major').textContent = user.major || 'Not specified';
    document.getElementById('profile-display-joined').textContent = formatDate(user.created_at);

    // Populate form fields
    document.getElementById('profile-name').value = user.name || '';
    document.getElementById('profile-email').value = user.email || '';
    document.getElementById('profile-college').value = user.college || '';
    document.getElementById('profile-major').value = user.major || '';
    document.getElementById('profile-contact').value = user.contact || '';
    document.getElementById('profile-bio').value = user.bio || '';

    // Cache updated user
    localStorage.setItem('skill_user', JSON.stringify(user));
  } catch (error) {
    showToast('Failed to load profile details.', 'error');
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('profile-save-btn');

  const name = document.getElementById('profile-name').value.trim();
  const college = document.getElementById('profile-college').value.trim();
  const major = document.getElementById('profile-major').value.trim();
  const contact = document.getElementById('profile-contact').value.trim();
  const bio = document.getElementById('profile-bio').value.trim();

  if (!name) {
    showToast('Full name is required.', 'warning');
    return;
  }

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving changes...';

    const result = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name,
        college,
        major,
        contact,
        bio
      })
    });

    if (result.success && result.user) {
      showToast('Profile updated successfully!', 'success');
      setAuth(getToken(), result.user);
      await loadProfile();
    }
  } catch (error) {
    showToast(error.message || 'Failed to update profile.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';
  }
}
