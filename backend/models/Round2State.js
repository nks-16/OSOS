const mongoose = require('mongoose');

const Round2StateSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  processes: [String], // ['P0', 'P1', 'P2', ...]
  resources: [String], // ['A', 'B', 'C', 'D']
  allocation: [[Number]], // 2D array
  maxDemand: [[Number]], // 2D array
  available: [Number], // 1D array
  totalResources: [Number], // Total available in system
  history: [{
    timestamp: Date,
    action: String,
    process: String,
    request: [Number],
    granted: Boolean,
    reason: String,
    safeSequence: [String]
  }],
  score: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date
}, { timestamps: true });

module.exports = mongoose.model('Round2State', Round2StateSchema);
