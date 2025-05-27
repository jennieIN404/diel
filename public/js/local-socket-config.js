

document.addEventListener('DOMContentLoaded', function() {

  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  
  if (isLocalhost) {
    console.log('Running in local development environment');
    // Override the API_BASE_URL to use the local server
    window.API_BASE_URL = window.location.origin;
    console.log('Using local API URL:', window.API_BASE_URL);
  }
});
