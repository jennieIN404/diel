document.addEventListener('DOMContentLoaded', function() {
    function checkAuth() {
        const token = localStorage.getItem('dialectica_token');
        const currentPage = window.location.pathname.split('/').pop();
        
        const authRequiredPages = ['debate.html', 'dashboard.html'];
        
        if (!token && authRequiredPages.includes(currentPage)) {
            localStorage.setItem('dialectica_redirect', currentPage);
            window.location.href = 'login.html';
            return false;
        }
        
        return true;
    }
    
    function initializeSocketWithAuth() {
        const token = localStorage.getItem('dialectica_token');
        
        if (!token) {
            console.error('No authentication token found');
            return null;
        }
        
        // Check if this is a special admin token (starts with 'admin_')
        if (token.startsWith('admin_')) {
            // For special admin tokens, we'll create a dummy socket that doesn't actually connect
            // This prevents authentication errors for admin users using the special password
            console.log('Using special admin token, creating mock socket');
            return createMockSocket();
        }
        
        const socketUrl = window.appConfig ? window.appConfig.socketUrl : 'http://localhost:5000';
        
        // Get Socket.io options from config if available
        const socketOptions = window.appConfig && window.appConfig.socketOptions ? 
            window.appConfig.socketOptions : {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 20000
            };
            
        // Add auth token to options
        socketOptions.auth = {
            token: token
        };
        
        // Initialize Socket.io with the URL and options
        const socket = io(socketUrl, socketOptions);
        
        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            
            if (err.message.includes('Authentication error')) {
                localStorage.removeItem('dialectica_token');
                localStorage.removeItem('dialectica_user');
                
                const currentPage = window.location.pathname.split('/').pop();
                localStorage.setItem('dialectica_redirect', currentPage);
                
                alert('Your session has expired. Please log in again.');
                window.location.href = 'login.html';
            }
        });
        
        return socket;
    }
    
    function isAdmin() {
        const userStr = localStorage.getItem('dialectica_user');
        if (!userStr) return false;
        
        try {
            const user = JSON.parse(userStr);
            return user && user.isAdmin === true;
        } catch (err) {
            console.error('Error parsing user data:', err);
            return false;
        }
    }
    
    function checkAdminAccess() {
        const adminPages = ['admin.html', 'admin-dashboard.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        // Check for special admin token
        const token = localStorage.getItem('dialectica_token');
        if (token && token.startsWith('admin_')) {
            return true; // Special admin token grants immediate access
        }
        
        if (adminPages.includes(currentPage) && !isAdmin()) {
            alert('Admin access required');
            window.location.href = 'index.html';
            return false;
        }
        
        return true;
    }
    
    // Create a mock socket for special admin tokens
    function createMockSocket() {
        const mockSocket = {
            on: function(event, callback) {
                // Store callbacks but don't execute them
                return this;
            },
            emit: function(event, data) {
                console.log('Mock socket emit:', event, data);
                return this;
            },
            disconnect: function() {
                console.log('Mock socket disconnected');
                return this;
            }
        };
        return mockSocket;
    }
    
    window.authUtils = {
        checkAuth,
        initializeSocketWithAuth,
        isAdmin,
        checkAdminAccess
    };
    
    checkAuth();
});
