/**
 * Authentication handling (Login & Register) for SkillProject-Web
 */

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect away from login/register to dashboard
  if (isLoggedIn()) {
    const isLoginPage = window.location.pathname.includes('login.html');
    const isRegisterPage = window.location.pathname.includes('register.html');
    if (isLoginPage || isRegisterPage) {
      window.location.href = 'dashboard.html';
      return;
    }
  }

  // Handle Login Form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Handle Register Form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
});

// 1-Click Demo Account Filler for quick grading & testing
function fillDemo(email, password) {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  if (emailInput && passwordInput) {
    emailInput.value = email;
    passwordInput.value = password;
    showToast(`Filled credentials for ${email}`, 'info');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('login-submit-btn');
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showToast('Please provide both email and password.', 'warning');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (result.success && result.token) {
      setAuth(result.token, result.user);
      showToast('Welcome back, ' + result.user.name + '!', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    }
  } catch (error) {
    showToast(error.message || 'Login failed. Please check credentials.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In to SkillProject';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('reg-submit-btn');

  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const college = document.getElementById('reg-college').value.trim();
  const major = document.getElementById('reg-major').value.trim();
  const contact = document.getElementById('reg-contact').value.trim();
  const bio = document.getElementById('reg-bio').value.trim();

  if (!name || !email || !password) {
    showToast('Please fill in all required fields.', 'warning');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters.', 'warning');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    const result = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        college,
        major,
        contact,
        bio
      })
    });

    if (result.success && result.token) {
      setAuth(result.token, result.user);
      showToast('Registration successful! Welcome to the platform.', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    }
  } catch (error) {
    showToast(error.message || 'Registration failed. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account & Get Started';
  }
}
