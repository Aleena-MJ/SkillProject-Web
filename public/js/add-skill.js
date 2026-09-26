/**
 * Add / Offer Skill Form Logic for SkillProject-Web
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  const form = document.getElementById('add-skill-form');
  if (form) {
    form.addEventListener('submit', handleAddSkill);
  }
});

async function handleAddSkill(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('skill-submit-btn');

  const title = document.getElementById('skill-title').value.trim();
  const category = document.getElementById('skill-category').value;
  const proficiency = document.getElementById('skill-proficiency').value;
  const availability = document.getElementById('skill-availability').value.trim();
  const description = document.getElementById('skill-description').value.trim();

  if (!title || !category || !description) {
    showToast('Please fill out all required fields marked with *', 'warning');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publishing skill...';

    const result = await apiRequest('/skills', {
      method: 'POST',
      body: JSON.stringify({
        title,
        category,
        proficiency,
        availability,
        description
      })
    });

    showToast(result.message || 'Skill posted successfully!', 'success');
    setTimeout(() => {
      window.location.href = 'requests.html?tab=skills';
    }, 700);
  } catch (error) {
    showToast(error.message || 'Failed to post skill.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Publish Skill Listing';
  }
}
