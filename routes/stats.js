const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const UserStats = require('../models/UserStats');
const User = require('../models/User');




router.get('/', auth, async (req, res) => {
  try {

    let userStats = await UserStats.findOne({ user: req.user.id });
    
    if (!userStats) {
      userStats = new UserStats({ user: req.user.id });
      await userStats.save();
    }
    
    res.json(userStats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/summary', admin, async (req, res) => {
  try {

    const totalUsers = await User.countDocuments();
    

    const stats = await UserStats.aggregate([
      {
        $group: {
          _id: null,
          totalDebates: { $sum: '$debatesParticipated' },
          totalWins: { $sum: '$debatesWon' },
          totalHosted: { $sum: '$debatesHosted' },
          totalSpeakingTime: { $sum: '$totalSpeakingTime' }
        }
      }
    ]);
    
    const summary = {
      totalUsers,
      totalDebates: stats.length > 0 ? stats[0].totalDebates : 0,
      totalWins: stats.length > 0 ? stats[0].totalWins : 0,
      totalHosted: stats.length > 0 ? stats[0].totalHosted : 0,
      totalSpeakingTime: stats.length > 0 ? stats[0].totalSpeakingTime : 0
    };
    
    res.json(summary);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/user-registration', admin, async (req, res) => {
  try {

    const users = await User.aggregate([
      {
        $project: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        }
      },
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = {
      labels: [],
      data: []
    };
    

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth() + 1; // MongoDB months are 1-12
      const year = date.getFullYear();
      

      const monthData = users.find(u => u._id.month === month && u._id.year === year);
      
      chartData.labels.unshift(months[month - 1]);
      chartData.data.unshift(monthData ? monthData.count : 0);
    }
    
    res.json(chartData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/debate-activity', admin, async (req, res) => {
  try {

    const debates = await UserStats.aggregate([
      {
        $project: {
          debatesParticipated: 1,
          month: { $month: '$updatedAt' },
          year: { $year: '$updatedAt' }
        }
      },
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          count: { $sum: '$debatesParticipated' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = {
      labels: [],
      data: []
    };
    

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth() + 1; // MongoDB months are 1-12
      const year = date.getFullYear();
      

      const monthData = debates.find(d => d._id.month === month && d._id.year === year);
      
      chartData.labels.unshift(months[month - 1]);
      chartData.data.unshift(monthData ? monthData.count : 0);
    }
    
    res.json(chartData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/activity-logs', admin, async (req, res) => {
  try {

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username createdAt');
    

    const activityLogs = recentUsers.map(user => ({
      type: 'user_registered',
      username: user.username,
      timestamp: user.createdAt
    }));
    

    if (activityLogs.length === 0) {

      activityLogs.push({
        type: 'user_registered',
        username: 'Dialectica',
        timestamp: new Date()
      });
    }
    

    activityLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    

    res.json(activityLogs.slice(0, 10));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/debate', auth, async (req, res) => {
  try {
    const { role, debateId, title, speakingTime = 0, won = false } = req.body;
    

    let userStats = await UserStats.findOne({ user: req.user.id });
    
    if (!userStats) {
      userStats = new UserStats({ user: req.user.id });
    }
    
    userStats.debatesParticipated += 1;
    userStats.totalSpeakingTime += parseInt(speakingTime);
    
    if (won) {
      userStats.debatesWon += 1;
    }
    
    if (role === 'moderator') {
      userStats.debatesHosted += 1;
    }
    
    const debateEntry = {
      debateId,
      title,
      date: new Date(),
      role
    };
    
    userStats.recentDebates.unshift(debateEntry);
    if (userStats.recentDebates.length > 5) {
      userStats.recentDebates = userStats.recentDebates.slice(0, 5);
    }
    
    await userStats.save();
    
    res.json(userStats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
