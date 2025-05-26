const express = require('express');
const router = express.Router();
const admin = require('../middleware/admin');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();




router.get('/users', admin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/users/:id', admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.status(500).send('Server error');
  }
});




router.get('/rooms', admin, async (req, res) => {
  try {

    const activeRooms = [];
    
    for (const [roomId, roomData] of Object.entries(req.app.locals.rooms || {})) {
      activeRooms.push({
        roomId,
        participants: roomData.participants,
        moderator: roomData.moderator,
        activeDebater: roomData.activeDebater,
        isDebateActive: roomData.isDebateActive,
        debateTitle: roomData.debateTitle || 'General Discussion'
      });
    }
    
    res.json(activeRooms);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});




router.post('/promote', admin, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ msg: 'User ID is required' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    

    if (user.email === 'ojha13291@gmail.com') {
      user.isAdmin = true;
      await user.save();
      return res.json({ msg: 'User promoted to admin', user });
    } else {
      return res.status(403).json({ msg: 'Only the designated admin email can be promoted' });
    }
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/block-user', admin, async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    if (!userId) {
      return res.status(400).json({ msg: 'User ID is required' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    if (user.isAdmin) {
      return res.status(403).json({ msg: 'Admin users cannot be blocked' });
    }
    
    user.isBlocked = true;
    user.blockedReason = reason || 'Blocked by administrator';
    await user.save();
    
    console.log(`Admin blocked user: ${user.username} (${user.email}), reason: ${user.blockedReason}`);
    
    return res.json({ 
      msg: 'User has been blocked', 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isBlocked: user.isBlocked,
        blockedReason: user.blockedReason
      }
    });
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/unblock-user', admin, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ msg: 'User ID is required' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    user.isBlocked = false;
    user.blockedReason = '';
    await user.save();
    
    console.log(`Admin unblocked user: ${user.username} (${user.email})`);
    
    return res.json({ 
      msg: 'User has been unblocked', 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isBlocked: user.isBlocked
      }
    });
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});




router.post('/join-room', admin, async (req, res) => {
  try {
    const { roomId } = req.body;
    
    if (!roomId) {
      return res.status(400).json({ msg: 'Room ID is required' });
    }
    

    if (!req.app.locals.rooms || !req.app.locals.rooms[roomId]) {
      return res.status(404).json({ msg: 'Room not found' });
    }
    

    const admin = await User.findById(req.user.id).select('-password');
    

    res.json({
      roomId,
      debateTitle: req.app.locals.rooms[roomId].debateTitle || 'General Discussion',
      adminUsername: admin.username
    });
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
