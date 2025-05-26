(function() {

    const userStr = localStorage.getItem('dialectica_user');
    if (!userStr) {
        console.error('No user found in localStorage');
        return;
    }
    
    try {

        const user = JSON.parse(userStr);
        console.log('Current user:', user);
        
        user.isAdmin = true;
        
        localStorage.setItem('dialectica_user', JSON.stringify(user));
        
        console.log('Admin status set to true. Updated user:', JSON.parse(localStorage.getItem('dialectica_user')));
        console.log('Please navigate to admin.html or refresh the page to see changes');
    } catch (err) {
        console.error('Error updating user:', err);
    }
})();
