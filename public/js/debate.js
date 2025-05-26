document.addEventListener('DOMContentLoaded', function() {

    if (!window.authUtils.checkAuth()) {
        return; 
    }
    

    let adminJoinInfo = null;
    try {
        const adminJoinData = sessionStorage.getItem('admin_join_room');
        if (adminJoinData) {
            adminJoinInfo = JSON.parse(adminJoinData);

            sessionStorage.removeItem('admin_join_room');
            

            setTimeout(() => {

                autoJoinAsAdmin(adminJoinInfo);
            }, 100);
        }
    } catch (err) {
        console.error('Error parsing admin join data:', err);
    }
    

    try {
        const savedRoomData = localStorage.getItem('dialectica_room_data');
        if (savedRoomData) {
            const roomData = JSON.parse(savedRoomData);

            const now = new Date().getTime();
            if (roomData.expiry && roomData.expiry > now) {
                console.log('Rejoining previous room:', roomData);

                setTimeout(() => {
                    autoRejoinRoom(roomData);
                }, 100);
            } else {

                localStorage.removeItem('dialectica_room_data');
            }
        }
    } catch (err) {
        console.error('Error parsing saved room data:', err);
        localStorage.removeItem('dialectica_room_data');
    }
    

    function autoJoinAsAdmin(adminInfo) {
        if (!adminInfo) return;
        
        console.log('Auto-joining as admin:', adminInfo);
        

        userData.username = adminInfo.adminUsername;
        userData.roomId = adminInfo.roomId;
        userData.role = 'admin'; 
        userData.isAdmin = true;
        

        socket.emit('joinRoom', {
            username: adminInfo.adminUsername,
            room: adminInfo.roomId,
            role: 'admin',
            isAdmin: true
        });
        

        saveRoomData({
            username: adminInfo.adminUsername,
            roomId: adminInfo.roomId,
            role: 'admin',
            isAdmin: true
        });
        

        loginForm.style.display = 'none';
        debateRoom.style.display = 'block';
        roomNameDisplay.textContent = adminInfo.roomId;
        

        if (moderatorControls) {
            moderatorControls.style.display = 'block';
        }
    }
    

    function autoRejoinRoom(roomData) {
        if (!roomData) return;
        
        console.log('Auto-rejoining room:', roomData);
        

        userData.username = roomData.username;
        userData.roomId = roomData.roomId;
        userData.role = roomData.role;
        userData.isAdmin = roomData.isAdmin || false;
        userData.debateTitle = roomData.debateTitle || '';
        
        
        socket.emit('joinRoom', {
            username: roomData.username,
            room: roomData.roomId,
            role: roomData.role,
            debateTitle: roomData.debateTitle,
            isAdmin: roomData.isAdmin
        });
        

        loginForm.style.display = 'none';
        debateRoom.style.display = 'block';
        roomNameDisplay.textContent = roomData.roomId;
        

        if ((roomData.role === 'moderator' || roomData.role === 'admin') && moderatorControls) {
            moderatorControls.style.display = 'block';
        }
    }
    

    const loginForm = document.getElementById('loginForm');
    const debateRoom = document.getElementById('debateRoom');
    const joinRoomForm = document.getElementById('joinRoomForm');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const messagesContainer = document.getElementById('messagesContainer');
    const participantsList = document.getElementById('participantsList');
    const roomNameDisplay = document.getElementById('roomName');
    const debateTopicDisplay = document.getElementById('debateTopic');
    const leaveRoomBtn = document.getElementById('leaveRoom');
    const timerDisplay = document.getElementById('timerDisplay');
    const debateTitleContainer = document.getElementById('debateTitleContainer');
    const debateTitleInput = document.getElementById('debateTitle');
    const roleModeratorRadio = document.getElementById('roleModerator');
    

    const timeUpAnimation = document.getElementById('timeUpAnimation');
    const timeUpDebaterName = document.getElementById('timeUpDebaterName');
    

    const toggleMicBtn = document.getElementById('toggleMicBtn');
    const micStatus = document.getElementById('micStatus');
    const audioIndicator = document.getElementById('audioIndicator');
    

    let audioContext;
    let microphone;
    let audioProcessor;
    let audioStream;
    let isMicActive = false;
    let audioChunks = [];
    let mediaRecorder;
    let speakingTimeout;
    let audioEnabled = false;
    

    async function setupAudio() {
        try {

            audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });
            

            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            microphone = audioContext.createMediaStreamSource(audioStream);
            

            audioProcessor = audioContext.createScriptProcessor(1024, 1, 1);
            microphone.connect(audioProcessor);
            audioProcessor.connect(audioContext.destination);
            

            const mimeType = 'audio/webm;codecs=opus';
            const options = {
                mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'audio/webm',
                bitsPerSecond: 32000 // Adjust based on your needs
            };
            
            mediaRecorder = new MediaRecorder(audioStream, options);
            

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    try {

                        const arrayBuffer = await event.data.arrayBuffer();
                        const uint8Array = new Uint8Array(arrayBuffer);
                        

                        const stream = ss.createStream();
                        ss(socket).emit('audioStream', stream, { 
                            room: userData.roomId,
                            mimeType: mediaRecorder.mimeType // Send mime type info
                        });
                        

                        stream.write(uint8Array);
                        stream.end();
                    } catch (error) {
                        console.error('Error processing audio chunk:', error);
                    }
                }
            };
            

            audioProcessor.onaudioprocess = (e) => {
                if (!isMicActive) return;
                
                const input = e.inputBuffer.getChannelData(0);
                let sum = 0;
                

                for (let i = 0; i < input.length; i++) {
                    sum += Math.abs(input[i]);
                }
                
                const average = sum / input.length;
                

                if (average > 0.01) {
                    clearTimeout(speakingTimeout);
                    
                    if (!audioEnabled) {
                        audioEnabled = true;
                        audioIndicator.style.display = 'flex';
                        socket.emit('audioStart', userData.roomId);
                        mediaRecorder.start(100); // Start recording in 100ms chunks
                    }
                    

                    speakingTimeout = setTimeout(() => {
                        if (audioEnabled) {
                            audioEnabled = false;
                            audioIndicator.style.display = 'none';
                            socket.emit('audioEnd', userData.roomId);
                            mediaRecorder.stop();
                            audioChunks = [];
                        }
                    }, 500);
                }
            };
            

            toggleMicBtn.disabled = false;
            console.log('Audio setup complete');
            return true;
            
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access microphone. Please check your browser permissions.');
            toggleMicBtn.disabled = true;
            return false;
        }
    }
    

    async function toggleMicrophone() {
        if (!isMicActive) {
            // If first time, set up audio
            if (!audioContext) {
                const success = await setupAudio();
                if (!success) return;
            }
            
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            
            isMicActive = true;
            toggleMicBtn.classList.remove('btn-outline-secondary');
            toggleMicBtn.classList.add('btn-danger');
            toggleMicBtn.querySelector('i').classList.remove('fa-microphone');
            toggleMicBtn.querySelector('i').classList.add('fa-microphone-slash');
            micStatus.textContent = 'Mic On';
            micStatus.classList.remove('bg-secondary');
            micStatus.classList.add('bg-success');
            
        } else {
            isMicActive = false;
            audioEnabled = false;
            audioIndicator.style.display = 'none';
            
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                socket.emit('audioEnd', userData.roomId);
            }
            
            toggleMicBtn.classList.remove('btn-danger');
            toggleMicBtn.classList.add('btn-outline-secondary');
            toggleMicBtn.querySelector('i').classList.remove('fa-microphone-slash');
            toggleMicBtn.querySelector('i').classList.add('fa-microphone');
            micStatus.textContent = 'Mic Off';
            micStatus.classList.remove('bg-success');
            micStatus.classList.add('bg-secondary');
        }
    }
    

    const moderatorControls = document.getElementById('moderatorControls');
    const activeDebaterSelect = document.getElementById('activeDebaterSelect');
    const timeLimit = document.getElementById('timeLimit');
    const startDebateBtn = document.getElementById('startDebateBtn');
    const pauseDebateBtn = document.getElementById('pauseDebateBtn');
    const endDebateBtn = document.getElementById('endDebateBtn');
    
    const socket = window.authUtils.initializeSocketWithAuth();
    
    if (!socket) {
        console.error('Failed to initialize socket connection');
        return;
    }
    
    socket.on('connect', () => {
        console.log('Connected to server with ID:', socket.id);
    });
    
    socket.on('connect_error', (err) => {
        console.error('Connection error:', err.message);
        alert('Error connecting to chat server. Please check if the server is running.');
    });
    
    socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
    });
    
    document.querySelectorAll('input[name="role"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'moderator') {
                debateTitleContainer.style.display = 'block';
                debateTitleInput.setAttribute('required', 'required');
            } else {
                debateTitleContainer.style.display = 'none';
                debateTitleInput.removeAttribute('required');
            }
        });
    });
    
    let userData = {
        username: '',
        roomId: '',
        role: '',
        debateTitle: '',
        participants: []
    };
    
    joinRoomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        

        if (adminJoinInfo) {
            autoJoinAsAdmin(adminJoinInfo);
            return;
        }
        
        const username = document.getElementById('username').value.trim();
        const roomId = document.getElementById('roomId').value.trim();
        const role = document.querySelector('input[name="role"]:checked').value;
        let debateTitle = '';
        

        const reservedUsernames = ['admin', 'administrator', 'moderator', 'mod', 'system'];
        if (reservedUsernames.includes(username.toLowerCase()) && !window.authUtils.isAdmin()) {
            alert('This username is reserved for system use');
            return;
        }
        

        socket.emit('checkRoomExists', roomId, (roomExists) => {

            if (!roomExists && role !== 'moderator' && role !== 'admin') {

                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-danger alert-dismissible fade show';
                alertDiv.innerHTML = `
                    <strong>Room Not Found!</strong> The room ID <b>${roomId}</b> does not exist.
                    <hr>
                    <p class="mb-0">Only moderators can create new rooms. Please check the room ID and try again, or ask a moderator to create this room.</p>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;
                

                const formContainer = document.querySelector('.login-container');
                formContainer.insertBefore(alertDiv, formContainer.firstChild);
                

                alert('Room Not Found! Only moderators can create new rooms.');
                return;
            }
            

            if (roomExists && role === 'moderator') {
                if (!confirm('This room already exists. Do you want to join as a moderator?')) {
                    return;
                }
            }
            

            if (role === 'moderator') {
                debateTitle = debateTitleInput.value.trim();
                if (!debateTitle) {
                    alert('Please enter a debate title');
                    return;
                }
            }
            
            if (!username || !roomId) return;
            

            continueJoinRoom(username, roomId, role, debateTitle);
        });
        
        return;
    });
    

    function continueJoinRoom(username, roomId, role, debateTitle) {
        
        userData.username = username;
        userData.roomId = roomId;
        userData.role = role;
        userData.debateTitle = debateTitle;
        
        socket.emit('joinRoom', {
            username,
            room: roomId,
            role,
            debateTitle
        });
        
        saveRoomData({
            username,
            roomId,
            role,
            debateTitle
        });
        

        loginForm.style.display = 'none';
        debateRoom.style.display = 'block';
        roomNameDisplay.textContent = roomId;
        
        if (role === 'moderator') {
            moderatorControls.style.display = 'block';
        }
    }
    

    function saveRoomData(data) {
        try {

            const expiry = new Date().getTime() + (24 * 60 * 60 * 1000);
            const roomData = {
                ...data,
                expiry
            };
            
            localStorage.setItem('dialectica_room_data', JSON.stringify(roomData));
            console.log('Room data saved to localStorage');
        } catch (err) {
            console.error('Error saving room data:', err);
        }
    }
    

    leaveRoomBtn.addEventListener('click', () => {

        localStorage.removeItem('dialectica_room_data');
        

        if (isMicActive && audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            if (audioContext) {
                audioContext.close();
            }
        }
        
        updateUserStats();
        
        if (socket && socket.connected) {
            socket.emit('leaveRoom');
            socket.disconnect();
        }
        
        window.location.href = 'dashboard.html';
    });
    
    toggleMicBtn.addEventListener('click', toggleMicrophone);
    
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const message = messageInput.value.trim();
        if (!message) return;
        
        socket.emit('sendMessage', message);
        

        messageInput.value = '';
        messageInput.focus();
    });
    
    const customTimeContainer = document.getElementById('customTimeContainer');
    const customTimeInput = document.getElementById('customTimeInput');
    
    timeLimit.addEventListener('change', () => {
        if (timeLimit.value === 'custom') {
            customTimeContainer.style.display = 'block';
        } else {
            customTimeContainer.style.display = 'none';
        }
    });
    

    startDebateBtn.addEventListener('click', () => {
        const selectedDebater = activeDebaterSelect.value;
        let selectedTimeLimit;
        
        if (timeLimit.value === 'custom') {
            selectedTimeLimit = parseInt(customTimeInput.value) * 60;
        } else {
            selectedTimeLimit = parseInt(timeLimit.value);
        }
        
        if (selectedDebater && !isNaN(selectedTimeLimit)) {
            socket.emit('startDebate', {
                debater: selectedDebater,
                timeLimit: selectedTimeLimit
            });
        }
    });
    
    pauseDebateBtn.addEventListener('click', () => {
        socket.emit('pauseDebate');
    });
    
    endDebateBtn.addEventListener('click', () => {
        socket.emit('endDebate');
        updateUserStats();
    });
    
    socket.on('userSpeaking', (data) => {
        const speakerItem = document.querySelector(`.participant-item[data-user-id="${data.userId}"]`);
        
        if (speakerItem) {
            if (data.speaking) {
                speakerItem.classList.add('speaking');
                speakerItem.querySelector('.participant-avatar')
                    .innerHTML += '<i class="fas fa-volume-up ms-1"></i>';
            } else {
                speakerItem.classList.remove('speaking');
                const avatar = speakerItem.querySelector('.participant-avatar');
                avatar.innerHTML = avatar.innerHTML.replace('<i class="fas fa-volume-up ms-1"></i>', '');
            }
        }
    });
    
    socket.on('audioData', async (data) => {
        try {

            if (!data || !data.audio || !(data.audio instanceof Uint8Array)) {
                console.warn('Invalid audio data received');
                return;
            }

            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            if (audioContext.state !== 'running') {
                await audioContext.resume();
            }
            
            const arrayBuffer = data.audio.buffer;
            if (!arrayBuffer) {
                console.warn('Invalid array buffer');
                return;
            }

            try {
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                
                const gainNode = audioContext.createGain();
                gainNode.gain.value = 0.8; 
                
                source.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
    
                source.start(0);
            } catch (decodeError) {
                console.error('Failed to decode audio data:', decodeError);
            }
            
        } catch (err) {
            console.error('Error processing received audio:', err);
        }
    });
    
    socket.on('roomInfo', (roomData) => {

        userData.participants = roomData.participants;
        updateParticipantsList(roomData.participants, roomData.activeDebater);
        updateDebaterSelect(roomData.participants);
        
        if (roomData.debateTitle) {
            debateTopicDisplay.textContent = roomData.debateTitle;
            document.title = `Dialectica - ${roomData.debateTitle}`;
        }
        
        if (messagesContainer.children.length === 0 && roomData.messages.length > 0) {
            roomData.messages.forEach(message => {
                addMessageToUI(message);
            });
            
            scrollToBottom();
        }
    });
    
    socket.on('message', (message) => {
        addMessageToUI(message);
        scrollToBottom();
    });
    
    socket.on('debateUpdate', (data) => {
        updateActiveDebater(data.activeDebater);
        
        if (!data.isDebateActive) {
            timerDisplay.textContent = '00:00';
            timerDisplay.classList.remove('bg-success', 'bg-danger');
            timerDisplay.classList.add('bg-secondary');
        }
    });
    
    socket.on('timerUpdate', (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        if (seconds <= 30) {
            timerDisplay.classList.remove('bg-success', 'bg-secondary');
            timerDisplay.classList.add('bg-danger');
        } else {
            timerDisplay.classList.remove('bg-danger', 'bg-secondary');
            timerDisplay.classList.add('bg-success');
        }
    });
    

    socket.on('timeUp', (data) => {
        let debaterName = 'Speaker';
        if (data.debaterId) {
            const debater = userData.participants.find(p => p.id === data.debaterId);
            if (debater) {
                debaterName = debater.username;
            }
        }
        
    
        showTimeUp(debaterName);
    });
    
    function addMessageToUI(message) {
        const messageDiv = document.createElement('div');
        
        if (message.user === 'system') {
            messageDiv.className = 'message system';
            messageDiv.innerHTML = `
                <div class="message-content">${message.text}</div>
            `;
        } else {
            const isSelf = message.user === userData.username;
            messageDiv.className = `message ${isSelf ? 'self' : 'other'}`;
            
            let roleBadge = '';
            if (message.role) {
                const badgeClass = getBadgeClassForRole(message.role);
                roleBadge = `<span class="badge ${badgeClass} ms-1">${message.role}</span>`;
            }
            
            const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            messageDiv.innerHTML = `
                <div class="message-info">
                    ${isSelf ? '' : `<strong>${message.user}</strong>${roleBadge} • `}
                    <span class="text-muted">${time}</span>
                </div>
                <div class="message-content">${message.text}</div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
    }
    
    function updateParticipantsList(participants, activeDebater) {
        participantsList.innerHTML = '';
        
        participants.forEach(participant => {
            const isActive = participant.id === activeDebater;
            const avatarLetter = participant.username.charAt(0).toUpperCase();
            const badgeClass = getBadgeClassForRole(participant.role);
            
            const participantItem = document.createElement('div');
            participantItem.className = `participant-item ${isActive ? 'active' : ''}`;
            participantItem.setAttribute('data-user-id', participant.id);
            participantItem.innerHTML = `
                <div class="participant-avatar" style="${isActive ? 'background-color: #28a745;' : ''}">${avatarLetter}</div>
                <div class="participant-info">
                    <div>${participant.username}</div>
                    <div class="participant-role">
                        <span class="badge ${badgeClass}">${participant.role}</span>
                    </div>
                </div>
            `;
            
            participantsList.appendChild(participantItem);
        });
    }
    

    function updateActiveDebater(activeDebaterId) {
        const participants = userData.participants;
        updateParticipantsList(participants, activeDebaterId);
    }
    

    function updateDebaterSelect(participants) {
        if (userData.role === 'moderator') {
            activeDebaterSelect.innerHTML = '<option value="">Select Debater</option>';
            
            const debaters = participants.filter(p => p.role === 'debater');
            debaters.forEach(debater => {
                const option = document.createElement('option');
                option.value = debater.id;
                option.textContent = debater.username;
                activeDebaterSelect.appendChild(option);
            });
        }
    }
    

    function getBadgeClassForRole(role) {
        switch (role) {
            case 'moderator':
                return 'bg-danger';
            case 'debater':
                return 'bg-primary';
            case 'spectator':
                return 'bg-secondary';
            default:
                return 'bg-info';
        }
    }
    

    function showTimeUp(debaterName) {
        if (!debaterName) debaterName = 'Speaker';
        
        timeUpDebaterName.textContent = debaterName;
        
        timeUpAnimation.style.display = 'flex';
        setTimeout(() => {
            timeUpAnimation.classList.add('show');
        }, 10); 
        setTimeout(hideTimeUp, 4000); 
        
        playTimeUpSound();
    }
    

    function hideTimeUp() {
        timeUpAnimation.classList.remove('show');
        setTimeout(() => {
            timeUpAnimation.style.display = 'none';
        }, 300); 
    }
    

    timeUpAnimation.addEventListener('click', hideTimeUp);
    

    async function updateUserStats() {
        try {
            const token = localStorage.getItem('dialectica_token');
            if (!token) return;
            
            const roomId = userData.roomId;
            const role = userData.role;
            const title = `Debate in Room ${roomId}`;
            
            const speakingTime = role === 'debater' ? 300 : 0; 
            
            const response = await fetch('http://localhost:5000/api/stats/debate', {
                method: 'PUT',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role,
                    debateId: roomId,
                    title,
                    speakingTime,
                    won: false 
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update user statistics');
            }
            
            console.log('User statistics updated successfully');
        } catch (error) {
            console.error('Error updating user statistics:', error);
        }
    }
    

    function playTimeUpSound() {
        try {
            const soundContext = new (window.AudioContext || window.webkitAudioContext)();
            
            playAlertSequence(soundContext);
            
        } catch (err) {
            console.log('Could not play time-up sound:', err);
            playFallbackSound();
        }
    }
    

    function playAlertSequence(context) {
        const masterGain = context.createGain();
        masterGain.gain.value = 0.7; 
        masterGain.connect(context.destination);
        
        const beepCount = 4;
        const beepDuration = 0.15;
        const pauseDuration = 0.1;
        
        for (let i = 0; i < beepCount; i++) {
            const time = context.currentTime + (i * (beepDuration + pauseDuration));
            const isHighBeep = i % 2 === 0;
            
            const osc = context.createOscillator();
            const gain = context.createGain();
            
            osc.type = 'square'; 
            osc.frequency.value = isHighBeep ? 880 : 660; 
            
            gain.gain.setValueAtTime(0.8, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + beepDuration);
            
            osc.connect(gain);
            gain.connect(masterGain);
            
            osc.start(time);
            osc.stop(time + beepDuration);
        }
        
        setTimeout(() => {
            if (context.state !== 'closed') {
                context.close();
            }
        }, (beepCount * (beepDuration + pauseDuration) * 1000) + 500);
    }
    

    function playFallbackSound() {
        try {
            const fallbackContext = new (window.AudioContext || window.webkitAudioContext)();
            const bufferSize = fallbackContext.sampleRate * 2; 
            const buffer = fallbackContext.createBuffer(1, bufferSize, fallbackContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                // Create a pattern of beeps
                const t = i / fallbackContext.sampleRate;
                const isBeeping = Math.floor(t * 4) % 2 === 0;
                if (isBeeping) {
                    data[i] = Math.sin(t * Math.PI * 2 * 440) * 0.5;
                }
            }
            
            const source = fallbackContext.createBufferSource();
            source.buffer = buffer;
            source.connect(fallbackContext.destination);
            source.start();
        } catch (e) {
            console.log('Fallback sound also failed:', e);
        }
    }
    

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
});
