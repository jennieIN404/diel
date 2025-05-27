const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const ss = require('socket.io-stream');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins in production for Vercel deployment
    methods: ["GET", "POST"],
    credentials: true
  },
  // Configure transports with polling fallback for Vercel
  transports: ['websocket', 'polling'],
  // Increase timeouts for better connection stability
  pingTimeout: 60000,
  pingInterval: 25000,
  // Connection retry settings
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});


io.engine.on("connection_error", (err) => {
  console.log("Connection error:", err.req, err.code, err.message, err.context);
});


connectDB();


// Configure CORS to allow requests from the frontend domain and browser preview
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'https://dielectica-live.onrender.com', 
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:53730', // Browser preview domain
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Check if the origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1 || origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' }));


// Add a test route to check if the API is working correctly
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working correctly' });
});

// Debug route to check MongoDB connection
app.get('/api/debug/db', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const statusMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    res.json({ 
      status: statusMap[dbStatus] || 'unknown',
      mongoURI: process.env.MONGODB_URI ? 'configured' : 'missing',
      models: {
        User: !!mongoose.models.User,
        UserStats: !!mongoose.models.userStats
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/admin', require('./routes/admin'));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/debate', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'debate.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/features', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'features.html'));
});

app.get('/help', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'help.html'));
});

app.get('/pricing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pricing.html'));
});


const rooms = {};
const userRoles = {};


app.locals.rooms = rooms;


io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);
  
  
  socket.on('audioStart', (roomId) => {
    const userInfo = userRoles[socket.id];
    if (!userInfo) return;
    
    const { room, username, role } = userInfo;
    

    socket.to(room).emit('userSpeaking', {
      userId: socket.id,
      username: username,
      speaking: true
    });
  });
  
  socket.on('audioEnd', (roomId) => {
    const userInfo = userRoles[socket.id];
    if (!userInfo) return;
    
    const { room, username, role } = userInfo;
    

    socket.to(room).emit('userSpeaking', {
      userId: socket.id,
      username: username,
      speaking: false
    });
  });
  

  ss(socket).on('audioStream', (stream, data) => {
    const userInfo = userRoles[socket.id];
    if (!userInfo) return;
    
    const { room } = userInfo;
    

    socket.to(room).emit('audioData', {
      userId: socket.id,
      username: userInfo.username,
      audio: data
    });
  });


  socket.on('checkRoomExists', (roomId, callback) => {

    const roomExists = !!rooms[roomId];
    callback(roomExists);
  });
  

  socket.on('joinRoom', ({ username, room, role, debateTitle, isAdmin }) => {
    socket.join(room);
    userRoles[socket.id] = { username, role, room, isAdmin };
    

    if (!rooms[room]) {

      if (role !== 'moderator' && role !== 'admin') {
        socket.emit('message', {
          username: 'System',
          text: 'Error: Only moderators can create new rooms.',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      rooms[room] = {
        participants: [],
        messages: [],
        moderator: null,
        activeDebater: null,
        timeLeft: 0,
        isDebateActive: false,
        debateTitle: debateTitle || 'General Discussion'
      };
    } else if ((role === 'moderator' || role === 'admin') && debateTitle && !rooms[room].debateTitle) {
      rooms[room].debateTitle = debateTitle;
    }
    

    rooms[room].participants.push({
      id: socket.id,
      username,
      role
    });
    

    if (role === 'moderator' && !rooms[room].moderator) {
      rooms[room].moderator = socket.id;
    }
    

    io.to(room).emit('roomInfo', {
      room,
      participants: rooms[room].participants,
      messages: rooms[room].messages,
      moderator: rooms[room].moderator,
      activeDebater: rooms[room].activeDebater,
      timeLeft: rooms[room].timeLeft,
      isDebateActive: rooms[room].isDebateActive,
      debateTitle: rooms[room].debateTitle
    });
    

    socket.to(room).emit('message', {
      user: 'system',
      text: `${username} has joined as ${role}`,
      timestamp: Date.now()
    });
    
    console.log(`${username} joined room ${room} as ${role}`);
  });
  

  socket.on('sendMessage', (message) => {
    const userInfo = userRoles[socket.id];
    
    if (!userInfo) return;
    
    const { room, username, role } = userInfo;
    const messageData = {
      id: Date.now().toString(),
      user: username,
      role: role,
      text: message,
      timestamp: Date.now()
    };
    

    if (rooms[room]) {
      rooms[room].messages.push(messageData);
      

      io.to(room).emit('message', messageData);
    }
  });
  

  socket.on('startDebate', ({ debater, timeLimit }) => {
    const userInfo = userRoles[socket.id];
    if (!userInfo || !rooms[userInfo.room]) return;
    
    const room = userInfo.room;
    
    if (rooms[room].moderator !== socket.id) return;
    
    rooms[room].activeDebater = debater;
    rooms[room].timeLeft = timeLimit;
    rooms[room].isDebateActive = true;
    
    io.to(room).emit('debateUpdate', {
      activeDebater: debater,
      timeLeft: timeLimit,
      isDebateActive: true
    });
    
    const timer = setInterval(() => {
      if (rooms[room] && rooms[room].isDebateActive) {
        rooms[room].timeLeft -= 1;
        
        io.to(room).emit('timerUpdate', rooms[room].timeLeft);
        
        if (rooms[room].timeLeft <= 0) {
          clearInterval(timer);
          
          const debaterId = rooms[room].activeDebater;
          
          rooms[room].isDebateActive = false;
          rooms[room].activeDebater = null;
          
          io.to(room).emit('debateUpdate', {
            activeDebater: null,
            timeLeft: 0,
            isDebateActive: false
          });
         
          io.to(room).emit('timeUp', {
            debaterId: debaterId,
            room: room
          });

          const activeDebaterInfo = rooms[room].participants.find(p => p.id === debaterId);
          const debaterName = activeDebaterInfo ? activeDebaterInfo.username : 'Speaker';
  
          const messageData = {
            id: Date.now().toString(),
            user: 'system',
            text: `Time's up for ${debaterName}!`,
            timestamp: Date.now()
          };
          
          rooms[room].messages.push(messageData);
          io.to(room).emit('message', messageData);
        }
      } else {
        clearInterval(timer);
      }
    }, 1000);
  });
  
  socket.on('switchDebater', (debaterId) => {
    const userInfo = userRoles[socket.id];
    if (!userInfo || !rooms[userInfo.room]) return;
    
    const room = userInfo.room;

    if (rooms[room].moderator !== socket.id) return;
    
    rooms[room].activeDebater = debaterId;
    
    io.to(room).emit('debateUpdate', {
      activeDebater: debaterId,
      timeLeft: rooms[room].timeLeft,
      isDebateActive: rooms[room].isDebateActive
    });
  });
 
  socket.on('endDebate', () => {
    const userInfo = userRoles[socket.id];
    if (!userInfo || !rooms[userInfo.room]) return;
    
    const room = userInfo.room;
  
    if (rooms[room].moderator !== socket.id) return;
    
    rooms[room].isDebateActive = false;
    rooms[room].activeDebater = null;
    rooms[room].timeLeft = 0;
    
    io.to(room).emit('debateUpdate', {
      activeDebater: null,
      timeLeft: 0,
      isDebateActive: false
    });
    
    io.to(room).emit('message', {
      user: 'system',
      text: 'Debate has ended',
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    const userInfo = userRoles[socket.id];
    if (!userInfo) return;
    
    const { room, username, role } = userInfo;
    
    if (rooms[room]) {

      rooms[room].participants = rooms[room].participants.filter(
        participant => participant.id !== socket.id
      );

      if (rooms[room].moderator === socket.id) {
        const newModerator = rooms[room].participants.find(p => p.role === 'moderator');
        rooms[room].moderator = newModerator ? newModerator.id : null;
      }
 
      io.to(room).emit('message', {
        user: 'system',
        text: `${username} has left the debate`,
        timestamp: Date.now()
      });

      io.to(room).emit('roomInfo', {
        room,
        participants: rooms[room].participants,
        messages: rooms[room].messages,
        moderator: rooms[room].moderator,
        activeDebater: rooms[room].activeDebater,
        timeLeft: rooms[room].timeLeft,
        isDebateActive: rooms[room].isDebateActive
      });

      if (rooms[room].participants.length === 0) {
        delete rooms[room];
      }
    }
    
    delete userRoles[socket.id];
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;


// Temporarily commented out for testing
/* io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: Token not provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded.user;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
}); */

// Allow all connections for testing
io.use((socket, next) => {
  next();
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Keep the server process alive
setInterval(() => {
  console.log('Server is still running...');
}, 60000);