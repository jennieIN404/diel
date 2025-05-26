document.addEventListener('DOMContentLoaded', async function() {
    if (!window.authUtils.checkAuth()) {
        return; 
    }
    
    
    const profileForm = document.getElementById('profileForm');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const bioInput = document.getElementById('bio');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');
    const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');
    const alertContainer = document.getElementById('alertContainer');
    const welcomeUser = document.getElementById('welcomeUser');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const debatesParticipated = document.getElementById('debatesParticipated');
    const debatesWon = document.getElementById('debatesWon');
    const debatesHosted = document.getElementById('debatesHosted');
    
    const token = localStorage.getItem('dialectica_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        await fetchProfileData();
        await fetchUserStats();
    } catch (error) {
        console.error('Error loading profile data:', error);
        showAlert('Failed to load profile data. Please try again later.', 'danger');
    }
    
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const userData = {
            username: usernameInput.value,
            email: emailInput.value,
            bio: bioInput.value
        };
        
        try {
            const apiBaseUrl = 'https://dialectica.onrender.com';
            const response = await fetch(`${apiBaseUrl}/api/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.msg || 'Failed to update profile');
            }
            
            updateProfileUI(data);
            
            updateLocalStorageUsername(data.username);
            
            showAlert('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            showAlert(error.message || 'Failed to update profile. Please try again.', 'danger');
        }
    });
    
    uploadAvatarBtn.addEventListener('click', function() {
        avatarInput.click();
    });
    
    avatarInput.addEventListener('change', async function(e) {
        if (!e.target.files || !e.target.files[0]) return;
        
        const file = e.target.files[0];
        
        if (!file.type.match('image.*')) {
            showAlert('Please select an image file', 'danger');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            showAlert('Image size should be less than 10MB', 'danger');
            return;
        }
        
        try {
            showAlert('Processing image...', 'info');
            
            const base64Image = await compressAndResizeImage(file);
            
            updateAvatarPreview(base64Image);
            
            const response = await fetch('https://dialectica.onrender.com/api/profile/avatar', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ avatar: base64Image })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.msg || 'Failed to update avatar');
            }
            
            showAlert('Profile picture updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating avatar:', error);
            showAlert('Failed to update profile picture. Please try again.', 'danger');
        }
    });
    
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('dialectica_token');
        localStorage.removeItem('dialectica_user');
        window.location.href = 'index.html';
    });
    
    async function fetchProfileData() {
        const apiBaseUrl = 'https://dialectica.onrender.com';
        const response = await fetch(`${apiBaseUrl}/api/profile`, {
            method: 'GET',
            headers: {
                'x-auth-token': token
            }
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.msg || 'Failed to fetch profile data');
        }
        
        const userData = await response.json();
        updateProfileUI(userData);
    }
    
    async function fetchUserStats() {
        try {
            const apiBaseUrl = 'https://dialectica.onrender.com';
            const response = await fetch(`${apiBaseUrl}/api/stats`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch user statistics');
            }
            
            const stats = await response.json();
            
            debatesParticipated.textContent = stats.debatesParticipated || 0;
            debatesWon.textContent = stats.debatesWon || 0;
            debatesHosted.textContent = stats.debatesHosted || 0;
        } catch (error) {
            console.error('Error fetching user statistics:', error);
        }
    }
    
    function updateProfileUI(userData) {
        usernameInput.value = userData.username || '';
        emailInput.value = userData.email || '';
        bioInput.value = userData.bio || '';
        
        profileUsername.textContent = userData.username || 'Username';
        profileEmail.textContent = userData.email || 'Email';
        welcomeUser.textContent = userData.username || '';
        
        if (userData.avatar) {
            updateAvatarPreview(userData.avatar);
        }
    }
    
    function updateAvatarPreview(avatarSrc) {
        profileAvatar.innerHTML = '';
        const img = document.createElement('img');
        img.src = avatarSrc;
        img.alt = 'Profile Avatar';
        profileAvatar.appendChild(img);
    }
    
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    function compressAndResizeImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    let width = img.width;
                    let height = img.height;
                    const maxDimension = 500;
                    
                    if (width > height && width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(compressedDataUrl);
                };
                img.onerror = reject;
                img.src = event.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    function updateLocalStorageUsername(newUsername) {
        try {
            const userString = localStorage.getItem('dialectica_user');
            if (userString) {
                const user = JSON.parse(userString);
                user.username = newUsername;
                localStorage.setItem('dialectica_user', JSON.stringify(user));
            }
        } catch (error) {
            console.error('Error updating username in local storage:', error);
        }
    }
    
    function showAlert(message, type = 'danger') {
        alertContainer.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
        
        if (type === 'success') {
            setTimeout(() => {
                const alert = alertContainer.querySelector('.alert');
                if (alert) {
                    const bsAlert = new bootstrap.Alert(alert);
                    bsAlert.close();
                }
            }, 3000);
        }
    }
});
