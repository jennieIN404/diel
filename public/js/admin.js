document.addEventListener('DOMContentLoaded', function() {

    if (!window.authUtils.checkAuth() || !window.authUtils.checkAdminAccess()) {
        return;
    }


    const adminUsername = document.getElementById('adminUsername');
    const logoutBtn = document.getElementById('logoutBtn');
    const refreshDashboard = document.getElementById('refreshDashboard');
    const refreshUsers = document.getElementById('refreshUsers');
    const refreshRooms = document.getElementById('refreshRooms');
    const refreshStats = document.getElementById('refreshStats');
    const usersTableBody = document.getElementById('usersTableBody');
    const roomsContainer = document.getElementById('roomsContainer');
    const totalUsers = document.getElementById('totalUsers');
    const activeRooms = document.getElementById('activeRooms');
    const totalDebates = document.getElementById('totalDebates');
    const quickJoinRoomId = document.getElementById('quickJoinRoomId');
    const quickJoinRoomBtn = document.getElementById('quickJoinRoomBtn');
    const activityLogList = document.getElementById('activityLogList');


    const userStr = localStorage.getItem('dialectica_user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            adminUsername.textContent = user.username + ' (Admin)';
        } catch (err) {
            console.error('Error parsing user data:', err);
        }
    }


    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('dialectica_token');
        localStorage.removeItem('dialectica_user');
        window.location.href = 'index.html';
    });


    async function fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem('dialectica_token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        // Check if this is a special admin token (starts with 'admin_')
        if (token.startsWith('admin_')) {
            // For special admin tokens, return mock data instead of making actual API calls
            return getMockDataForEndpoint(url);
        }
    
        const apiBaseUrl = 'https://dialectica.onrender.com';
        const fullUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url}`;

        const headers = {
            'Content-Type': 'application/json',
            'x-auth-token': token,
            ...options.headers
        };

        const response = await fetch(fullUrl, {
            ...options,
            headers
        });

        if (response.status === 401) {

            localStorage.removeItem('dialectica_token');
            localStorage.removeItem('dialectica_user');
            window.location.href = 'login.html';
            throw new Error('Authentication failed');
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.msg || 'API request failed');
        }

        return response.json();
    }


    async function loadDashboardData() {
        try {

            const users = await fetchWithAuth('/api/admin/users');
            totalUsers.textContent = users.length;


            const rooms = await fetchWithAuth('/api/admin/rooms');
            activeRooms.textContent = rooms.length;


            const stats = await fetchWithAuth('/api/stats/summary');
            totalDebates.textContent = stats.totalDebates || 0;


            document.getElementById('systemStatus').innerHTML = `
                <span class="badge bg-success me-2">Server Online</span>
                <span class="badge bg-success">Database Connected</span>
            `;
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            document.getElementById('systemStatus').innerHTML = `
                <span class="badge bg-danger me-2">Error</span>
                <span>${err.message}</span>
            `;
        }
    }


    async function loadUsersData() {
        try {
            const users = await fetchWithAuth('/api/admin/users');
            
            if (users.length === 0) {
                usersTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">No users found</td>
                    </tr>
                `;
                return;
            }


            users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));


            let tableHtml = '';
            users.forEach(user => {
                const createdDate = new Date(user.createdAt).toLocaleDateString();
                const role = user.isAdmin ? 'Admin' : 'User';
                const roleClass = user.isAdmin ? 'bg-danger' : 'bg-secondary';
                const statusBadge = user.isBlocked ? 
                    `<span class="badge bg-danger ms-1">Blocked</span>` : 
                    '';

                tableHtml += `
                    <tr class="${user.isBlocked ? 'table-danger' : ''}">
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>
                            <span class="badge ${roleClass}">${role}</span>
                            ${statusBadge}
                        </td>
                        <td>${createdDate}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary view-user" data-user-id="${user._id}">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${!user.isAdmin ? `
                                <button class="btn btn-sm btn-outline-success promote-admin" data-user-id="${user._id}" ${user.email !== 'ojha13291@gmail.com' ? 'disabled' : ''}>
                                    <i class="fas fa-user-shield"></i>
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            });

            usersTableBody.innerHTML = tableHtml;


            document.querySelectorAll('.view-user').forEach(btn => {
                btn.addEventListener('click', () => {
                    const userId = btn.getAttribute('data-user-id');
                    viewUserDetails(userId);
                });
            });

            document.querySelectorAll('.promote-admin').forEach(btn => {
                btn.addEventListener('click', () => {
                    const userId = btn.getAttribute('data-user-id');
                    promoteUserToAdmin(userId);
                });
            });
        } catch (err) {
            console.error('Error loading users data:', err);
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger">
                        Error loading users: ${err.message}
                    </td>
                </tr>
            `;
        }
    }


    function viewUserDetails(userId) {
        fetchWithAuth(`/api/admin/users/${userId}`)
            .then(user => {

                const modalHtml = `
                    <div class="modal fade" id="userDetailModal" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">User Details</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="text-center mb-3">
                                        <div class="avatar-circle mx-auto mb-2" style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden;">
                                            ${user.avatar ? 
                                                `<img src="${user.avatar}" alt="${user.username}" class="img-fluid" style="width: 100%; height: 100%; object-fit: cover;">` : 
                                                `<div style="width: 100%; height: 100%; background-color: #0d6efd; color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem;">
                                                    ${user.username.charAt(0).toUpperCase()}
                                                </div>`
                                            }
                                        </div>
                                        <h5>${user.username}</h5>
                                        <div>
                                            <span class="badge ${user.isAdmin ? 'bg-danger' : 'bg-secondary'} me-1">
                                                ${user.isAdmin ? 'Admin' : 'User'}
                                            </span>
                                            ${user.isBlocked ? 
                                                `<span class="badge bg-danger">Blocked</span>` : 
                                                ''
                                            }
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Email</label>
                                        <p>${user.email}</p>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Joined</label>
                                        <p>${new Date(user.createdAt).toLocaleString()}</p>
                                    </div>
                                    
                                    ${user.isBlocked ? 
                                        `<div class="mb-3 alert alert-danger">
                                            <label class="form-label fw-bold">Block Reason</label>
                                            <p>${user.blockedReason || 'No reason provided'}</p>
                                        </div>` : 
                                        ''
                                    }
                                    
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Bio</label>
                                        <p>${user.bio || 'No bio provided'}</p>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    ${!user.isAdmin ? 
                                        user.isBlocked ? 
                                            `<button type="button" class="btn btn-success" id="unblockUserBtn" data-user-id="${user._id}">Unblock User</button>` : 
                                            `<button type="button" class="btn btn-danger" id="blockUserBtn" data-user-id="${user._id}">Block User</button>` 
                                        : ''
                                    }
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = modalHtml;
                document.body.appendChild(modalContainer);

                const modal = new bootstrap.Modal(document.getElementById('userDetailModal'));
                modal.show();

                document.getElementById('userDetailModal').addEventListener('hidden.bs.modal', function () {
                    document.body.removeChild(modalContainer);
                });
                const blockUserBtn = document.getElementById('blockUserBtn');
                const unblockUserBtn = document.getElementById('unblockUserBtn');
                
                if (blockUserBtn) {
                    blockUserBtn.addEventListener('click', () => {
                        showBlockUserModal(userId);
                    });
                }
                
                if (unblockUserBtn) {
                    unblockUserBtn.addEventListener('click', () => {
                        unblockUser(userId);
                    });
                }
            })
            .catch(err => {
                console.error('Error fetching user details:', err);
                alert('Failed to load user details. Please try again.');
            });
    }
    
    function showBlockUserModal(userId) {
        // Create a modal to confirm blocking and collect reason
        const blockModalHtml = `
            <div class="modal fade" id="blockUserConfirmModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">Block User</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-3">Are you sure you want to block this user? They will no longer be able to access the platform.</p>
                            
                            <div class="form-group mb-3">
                                <label for="blockReason" class="form-label">Reason for blocking (optional):</label>
                                <textarea id="blockReason" class="form-control" rows="3" placeholder="Enter reason for blocking"></textarea>
                            </div>
                            
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                This action will prevent the user from accessing any part of the platform until they are unblocked.
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-danger" id="confirmBlockBtn">Block User</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = blockModalHtml;
        document.body.appendChild(modalContainer);
        
        const blockModal = new bootstrap.Modal(document.getElementById('blockUserConfirmModal'));
        blockModal.show();
        
        document.getElementById('confirmBlockBtn').addEventListener('click', () => {
            const reason = document.getElementById('blockReason').value.trim();
            blockUser(userId, reason);
            blockModal.hide();
        });
    }
    
    async function blockUser(userId, reason) {
        try {
            const response = await fetchWithAuth('/api/admin/block-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, reason })
            });
            
            const userDetailModal = bootstrap.Modal.getInstance(document.getElementById('userDetailModal'));
            if (userDetailModal) {
                userDetailModal.hide();
            }
            
            alert('User has been blocked successfully.');
            
            loadUsersData();
            
        } catch (err) {
            console.error('Error blocking user:', err);
            alert(`Failed to block user: ${err.message}`);
        }
    }
    
    async function unblockUser(userId) {
        if (!confirm('Are you sure you want to unblock this user?')) {
            return;
        }
        
        try {
            const response = await fetchWithAuth('/api/admin/unblock-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId })
            });
            
            const userDetailModal = bootstrap.Modal.getInstance(document.getElementById('userDetailModal'));
            if (userDetailModal) {
                userDetailModal.hide();
            }
            
            alert('User has been unblocked successfully.');
            
            loadUsersData();
            
        } catch (err) {
            console.error('Error unblocking user:', err);
            alert(`Failed to unblock user: ${err.message}`);
        }
    }


    async function promoteUserToAdmin(userId) {
        try {
            if (!confirm('Are you sure you want to promote this user to admin?')) {
                return;
            }

            const response = await fetchWithAuth('/api/admin/promote', {
                method: 'POST',
                body: JSON.stringify({ userId })
            });

            alert(response.msg || 'User promoted to admin successfully');
            loadUsersData();
        } catch (err) {
            console.error('Error promoting user:', err);
            alert('Error promoting user: ' + err.message);
        }
    }


    async function loadRoomsData() {
        try {
            const rooms = await fetchWithAuth('/api/admin/rooms');
            
            const activeRoomsSelect = document.getElementById('activeRoomsSelect');
            if (activeRoomsSelect) {
                while (activeRoomsSelect.options.length > 1) {
                    activeRoomsSelect.remove(1);
                }
                
                rooms.forEach(room => {
                    const option = document.createElement('option');
                    option.value = room.roomId;
                    option.textContent = `${room.debateTitle} (Room ID: ${room.roomId})`;
                    activeRoomsSelect.appendChild(option);
                });
            }
            
            if (rooms.length === 0) {
                roomsContainer.innerHTML = `
                    <div class="alert alert-info">
                        No active debate rooms found
                    </div>
                `;
                return;
            }

            let roomsHtml = '';
            rooms.forEach(room => {
                const participantsCount = room.participants.length;
                const debateStatus = room.isDebateActive ? 
                    '<span class="badge bg-success">Active</span>' : 
                    '<span class="badge bg-secondary">Idle</span>';

                roomsHtml += `
                    <div class="room-card">
                        <div class="room-header">
                            <div>
                                <h5 class="mb-0">${room.debateTitle}</h5>
                                <small class="text-muted">Room ID: ${room.roomId}</small>
                            </div>
                            <div>
                                ${debateStatus}
                                <button class="btn btn-sm btn-primary join-room-btn ms-2" data-room-id="${room.roomId}">
                                    <i class="fas fa-sign-in-alt"></i> Join
                                </button>
                            </div>
                        </div>
                        <div class="room-body">
                            <div class="mb-3">
                                <strong>Participants (${participantsCount}):</strong>
                                <div class="mt-2">
                                    ${room.participants.map(p => {
                                        // Handle both string participants and object participants
                                        if (typeof p === 'string') {
                                            return `<span class="participant-badge bg-secondary">${p}</span>`;
                                        } else {
                                            return `<span class="participant-badge bg-${getRoleColor(p.role)}">${p.username} (${p.role})</span>`;
                                        }
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            roomsContainer.innerHTML = roomsHtml;


            document.querySelectorAll('.join-room-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const roomId = btn.getAttribute('data-room-id');
                    joinRoom(roomId);
                });
            });
        } catch (err) {
            console.error('Error loading rooms data:', err);
            roomsContainer.innerHTML = `
                <div class="alert alert-danger">
                    Error loading rooms: ${err.message}
                </div>
            `;
        }
    }


    function getRoleColor(role) {
        if (!role) return 'secondary';
        
        switch (role.toLowerCase()) {
            case 'moderator': return 'danger';
            case 'debater': return 'primary';
            case 'spectator': return 'info';
            case 'admin': return 'danger';
            default: return 'secondary';
        }
    }


    async function joinRoom(roomId) {
        try {
            const response = await fetchWithAuth('/api/admin/join-room', {
                method: 'POST',
                body: JSON.stringify({ roomId })
            });


            sessionStorage.setItem('admin_join_room', JSON.stringify({
                roomId: response.roomId,
                adminUsername: response.adminUsername,
                isAdmin: true
            }));


            window.location.href = 'debate.html';
        } catch (err) {
            console.error('Error joining room:', err);
            alert('Error joining room: ' + err.message);
        }
    }


    async function initCharts() {
        try {

            const userRegData = await fetchWithAuth('/api/stats/user-registration');
            

            const userCtx = document.getElementById('userRegistrationChart').getContext('2d');
            new Chart(userCtx, {
                type: 'line',
                data: {
                    labels: userRegData.labels,
                    datasets: [{
                        label: 'New Users',
                        data: userRegData.data,
                        borderColor: '#0d6efd',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });


            const debateData = await fetchWithAuth('/api/stats/debate-activity');
            

            const debateCtx = document.getElementById('debateActivityChart').getContext('2d');
            new Chart(debateCtx, {
                type: 'bar',
                data: {
                    labels: debateData.labels,
                    datasets: [{
                        label: 'Debates',
                        data: debateData.data,
                        backgroundColor: '#0d6efd'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        } catch (err) {
            console.error('Error initializing charts:', err);

            document.getElementById('chartsErrorMessage').innerHTML = `
                <div class="alert alert-danger">
                    Error loading chart data: ${err.message}
                </div>
            `;
        }
    }


    async function loadActivityLogs() {
        try {

            const activityLogs = await fetchWithAuth('/api/stats/activity-logs');
            
            if (activityLogs.length === 0) {
                activityLogList.innerHTML = `
                    <li class="list-group-item text-center">
                        <i class="fas fa-info-circle text-muted mb-2"></i>
                        <p>No recent activity to display</p>
                    </li>
                `;
                return;
            }

            let logsHtml = '';
            activityLogs.forEach(log => {
                const timeAgo = getTimeAgo(new Date(log.timestamp));
                let icon, text;

                switch (log.type) {
                    case 'user_login':
                        icon = '<i class="fas fa-sign-in-alt text-primary"></i>';
                        text = `<strong>${log.username}</strong> logged in`;
                        break;
                    case 'user_registered':
                        icon = '<i class="fas fa-user-plus text-success"></i>';
                        text = `<strong>${log.username}</strong> registered`;
                        break;
                    case 'debate_created':
                        icon = '<i class="fas fa-plus-circle text-info"></i>';
                        text = `<strong>${log.username}</strong> created debate "${log.debateTitle || 'Untitled'}"`;
                        break;
                    case 'debate_ended':
                        icon = '<i class="fas fa-flag-checkered text-warning"></i>';
                        text = `<strong>${log.username}</strong> ended debate "${log.debateTitle || 'Untitled'}"`;
                        break;
                    case 'debate_participated':
                        icon = '<i class="fas fa-comments text-info"></i>';
                        text = `<strong>${log.username}</strong> participated in a debate`;
                        break;
                    default:
                        icon = '<i class="fas fa-info-circle text-secondary"></i>';
                        text = `Unknown activity`;
                }

                logsHtml += `
                    <li class="list-group-item d-flex align-items-center">
                        <div class="me-3">${icon}</div>
                        <div class="flex-grow-1">${text}</div>
                        <div class="text-muted small">${timeAgo}</div>
                    </li>
                `;
            });

            activityLogList.innerHTML = logsHtml;
        } catch (err) {
            console.error('Error loading activity logs:', err);
            activityLogList.innerHTML = `
                <li class="list-group-item text-center text-danger">
                    <i class="fas fa-exclamation-circle mb-2"></i>
                    <p>Error loading activity logs: ${err.message}</p>
                </li>
            `;
        }
    }


    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return interval + " year" + (interval === 1 ? "" : "s") + " ago";
        
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return interval + " month" + (interval === 1 ? "" : "s") + " ago";
        
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return interval + " day" + (interval === 1 ? "" : "s") + " ago";
        
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return interval + " hour" + (interval === 1 ? "" : "s") + " ago";
        
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return interval + " minute" + (interval === 1 ? "" : "s") + " ago";
        
        return Math.floor(seconds) + " second" + (seconds === 1 ? "" : "s") + " ago";
    }


    const activeRoomsSelect = document.getElementById('activeRoomsSelect');
    if (activeRoomsSelect) {
        activeRoomsSelect.addEventListener('change', () => {
            const selectedRoomId = activeRoomsSelect.value;
            if (selectedRoomId) {
                quickJoinRoomId.value = selectedRoomId;
                
                if (confirm('Would you like to join this room now?')) {
                    joinRoom(selectedRoomId);
                }
            }
        });
    }
    
    quickJoinRoomBtn.addEventListener('click', () => {
        if (activeRoomsSelect && activeRoomsSelect.value) {
            joinRoom(activeRoomsSelect.value);
            return;
        }
        
        const roomId = quickJoinRoomId.value.trim();
        if (!roomId) {
            alert('Please select a room from the dropdown or enter a room ID');
            return;
        }
        joinRoom(roomId);
    });

    refreshDashboard.addEventListener('click', loadDashboardData);
    refreshUsers.addEventListener('click', loadUsersData);
    refreshRooms.addEventListener('click', loadRoomsData);
    refreshStats.addEventListener('click', () => {
        loadActivityLogs();
    });

    // Function to return mock data for admin endpoints when using special admin token
    function getMockDataForEndpoint(url) {
        console.log('Returning mock data for:', url);
        
        // Mock data for different endpoints
        if (url.includes('/api/admin/stats')) {
            return {
                totalUsers: 125,
                activeUsers: 42,
                totalRooms: 18,
                activeRooms: 7,
                totalDebates: 93,
                completedDebates: 85
            };
        }
        
        if (url.includes('/api/admin/users')) {
            return [
                {
                    _id: 'mock1',
                    username: 'Ayush Ojha',
                    email: 'ojha13291@gmail.com',
                    isAdmin: true,
                    createdAt: new Date().toISOString(),
                    lastActive: new Date().toISOString(),
                    debatesParticipated: 15,
                    debatesWon: 10
                },
                {
                    _id: 'mock2',
                    username: 'John Ripper',
                    email: 'Johnripper579@gmail.com',
                    isAdmin: true,
                    createdAt: new Date().toISOString(),
                    lastActive: new Date().toISOString(),
                    debatesParticipated: 8,
                    debatesWon: 6
                },
                {
                    _id: 'mock3',
                    username: 'Test User',
                    email: 'testuser@example.com',
                    isAdmin: false,
                    isBlocked: true,
                    blockedReason: 'Inappropriate behavior',
                    createdAt: new Date(Date.now() - 7*24*60*60*1000).toISOString(),
                    lastActive: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
                    debatesParticipated: 3,
                    debatesWon: 1
                },
                {
                    _id: 'mock4',
                    username: 'Regular User',
                    email: 'user@example.com',
                    isAdmin: false,
                    createdAt: new Date(Date.now() - 14*24*60*60*1000).toISOString(),
                    lastActive: new Date(Date.now() - 1*24*60*60*1000).toISOString(),
                    debatesParticipated: 12,
                    debatesWon: 5
                }
            ];
        }
        
        if (url.includes('/api/admin/rooms')) {
            return [
                {
                    _id: 'room1',
                    roomId: 'debate123',
                    title: 'Climate Change Solutions',
                    status: 'active',
                    createdAt: new Date(Date.now() - 2*60*60*1000).toISOString(),
                    participants: ['Ayush Ojha', 'Regular User', 'Test User'],
                    messages: 24
                },
                {
                    _id: 'room2',
                    roomId: 'debate456',
                    title: 'AI Ethics Debate',
                    status: 'active',
                    createdAt: new Date(Date.now() - 5*60*60*1000).toISOString(),
                    participants: ['John Ripper', 'Regular User'],
                    messages: 18
                },
                {
                    _id: 'room3',
                    roomId: 'debate789',
                    title: 'Economic Policy Discussion',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
                    participants: ['Ayush Ojha', 'John Ripper', 'Test User'],
                    messages: 56
                }
            ];
        }
        
        if (url.includes('/api/admin/logs')) {
            const logs = [];
            const actions = ['login', 'created debate', 'joined debate', 'sent message', 'logout'];
            const users = ['Ayush Ojha', 'John Ripper', 'Test User', 'Regular User'];
            
            for (let i = 0; i < 20; i++) {
                const timeOffset = Math.floor(Math.random() * 24 * 60 * 60 * 1000);
                logs.push({
                    _id: 'log' + i,
                    user: users[Math.floor(Math.random() * users.length)],
                    action: actions[Math.floor(Math.random() * actions.length)],
                    timestamp: new Date(Date.now() - timeOffset).toISOString(),
                    details: 'Mock log entry ' + i
                });
            }
            
            return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        
        // Default empty response
        return [];
    }
    
    loadDashboardData();
    loadUsersData();
    loadRoomsData();
    loadActivityLogs();
    initCharts();
});
