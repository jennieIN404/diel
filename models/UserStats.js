const mongoose = require('mongoose');

const UserStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  debatesParticipated: {
    type: Number,
    default: 0
  },
  debatesWon: {
    type: Number,
    default: 0
  },
  debatesHosted: {
    type: Number,
    default: 0
  },
  totalSpeakingTime: {
    type: Number,
    default: 0
  },
  feedbackReceived: {
    type: Number,
    default: 0
  },
  recentDebates: [{
    debateId: String,
    title: String,
    date: Date,
    role: String
  }]
});

module.exports = mongoose.model('userStats', UserStatsSchema);
