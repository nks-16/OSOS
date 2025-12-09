const mongoose = require('mongoose');

const round3StateSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  passages: [{
    title: String,
    content: String,
    questions: [{
      questionText: String,
      options: [String],
      correctAnswer: String,
      userAnswer: String,
      isCorrect: Boolean
    }]
  }],
  score: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

module.exports = mongoose.model('Round3State', round3StateSchema);
