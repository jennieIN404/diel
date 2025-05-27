document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  const alertContainer = document.getElementById('alert-container');

  const token = localStorage.getItem('dialectica_token');
  if (token) {
    window.location.href = 'index.html';
  }

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    hideAlert();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (password.length < 6) {
      showAlert('Password must be at least 6 characters long', 'danger');
      return;
    }
    
    try {

      const apiBaseUrl = window.appConfig ? window.appConfig.apiBaseUrl : 'https://dielectica-live.onrender.com';
      console.log('Using API URL for registration:', apiBaseUrl);
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: fullName, email, password })
      });
      
      if (!response) {
        showAlert('Network error. Please try again.', 'danger');
        return;
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        showAlert(data.msg || 'Registration failed. Please try again.', 'danger');
        return;
      }
      
      localStorage.setItem('dialectica_token', data.token);
      localStorage.setItem('dialectica_user', JSON.stringify(data.user));
      
      showAlert('Account created successfully! Redirecting...', 'success');
      
      const redirectTarget = localStorage.getItem('dialectica_redirect');
      
      setTimeout(() => {
        if (redirectTarget) {
          localStorage.removeItem('dialectica_redirect'); 
          window.location.href = redirectTarget;
        } else {
          window.location.href = 'dashboard.html';
        }
      }, 1500);
    } catch (err) {
      console.error('Registration error:', err);
      showAlert('An error occurred during registration. Please try again.', 'danger');
    }
  });
  
  function showAlert(message, type = 'danger') {
    alertContainer.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
    alertContainer.style.display = 'block';
  }
  
  function hideAlert() {
    alertContainer.innerHTML = '';
    alertContainer.style.display = 'none';
  }
});
