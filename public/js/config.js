const config = {
  // Render deployment URL
  apiBaseUrl: 'https://dialectica.onrender.com',
  
  socketUrl: 'https://dialectica.onrender.com',
  
  // Socket.io connection options optimized for Render
  socketOptions: {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 30000,
    forceNew: true,
    path: '/socket.io'
  }
};

window.appConfig = config;
