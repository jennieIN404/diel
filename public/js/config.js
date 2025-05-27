const config = {
 apiBaseUrl: window.API_BASE_URL || 'https://dielectica-live.onrender.com',
  

  get socketUrl() {
    return this.apiBaseUrl;
  },
  

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

console.log('App config initialized:', config);

window.appConfig = config;
