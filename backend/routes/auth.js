
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');

// POST /api/auth/login { username }
router.post('/login', async (req,res) => {
  const username = req.body.username || 'anonymous';
  let user = await User.findOne({ username });
  if (!user) {
    user = new User({ username });
    await user.save();
  }
  const session = new Session({ user: username });
  await session.save();
  return res.json({ ok: true, sessionId: session._id, username });
});

// GET session
router.get('/session/:id', async (req,res) => {
  const s = await Session.findById(req.params.id);
  if (!s) return res.status(404).json({ error: 'No session' });
  res.json(s);
});

module.exports = router;
