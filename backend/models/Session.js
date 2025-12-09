const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SessionSchema = new Schema({
  user: { type: String, default: 'anonymous' }, // username
  cwd: { type: String, default: '/system/root' },
  score: { type: Number, default: 0 },
  history: { type: [{ command: String, output: String, ts: Date }], default: [] },
  foundFragments: { type: [String], default: [] }, // list of fragment identifiers found
  roundCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', SessionSchema);
