const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String }, // optional — in case you want password
  role: { type: String, enum: ['player','admin'], default: 'player' }
});

module.exports = mongoose.model('User', UserSchema);
