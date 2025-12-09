const express = require('express');
const router = express.Router();
const { runCommand } = require('../engine/commandEngine');

router.post('/exec', async (req,res) => {
  const { sessionId, command } = req.body;
  if (!sessionId || !command) return res.status(400).json({ error: 'sessionId and command required' });
  try {
    const result = await runCommand(command, sessionId);
    // return output and minimal session info
    res.json({ output: result.output, session: { cwd: result.session.cwd, score: result.session.score, foundFragments: result.session.foundFragments, roundCompleted: result.session.roundCompleted } });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Execution error' });
  }
});

module.exports = router;
