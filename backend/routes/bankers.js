const express = require('express');
const router = express.Router();
const Round2State = require('../models/Round2State');
const BankersEngine = require('../engine/bankersEngine');

// Banker's Algorithm Problem
// Total Resources: (A, B, C, D) = (12, 6, 8, 9)
// 7 Processes: P0 through P6
const PROBLEM_DATA = {
  processes: ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
  resources: ['A', 'B', 'C', 'D'],
  totalResources: [12, 6, 8, 9],
  allocation: [
    [0, 1, 0, 2],  // P0
    [2, 0, 0, 0],  // P1
    [3, 0, 2, 1],  // P2
    [2, 1, 1, 1],  // P3
    [0, 0, 2, 2],  // P4
    [1, 0, 0, 0],  // P5
    [1, 1, 1, 1]   // P6
  ],
  maxDemand: [
    [7, 5, 3, 4],  // P0
    [3, 2, 2, 2],  // P1
    [9, 0, 2, 2],  // P2
    [2, 2, 2, 2],  // P3
    [4, 3, 3, 3],  // P4
    [5, 3, 3, 3],  // P5
    [3, 2, 2, 2]   // P6
  ]
};

// Calculate initial available resources
function calculateAvailable(totalResources, allocation) {
  const available = [...totalResources];
  for (let i = 0; i < allocation.length; i++) {
    for (let j = 0; j < allocation[i].length; j++) {
      available[j] -= allocation[i][j];
    }
  }
  return available;
}

// Initialize Round 2 for a session
router.post('/initialize', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Check if already initialized
    let state = await Round2State.findOne({ sessionId });
    
    if (state && !state.completed) {
      // Return existing state
      return res.json({
        message: 'Round 2 already in progress',
        state: {
          processes: state.processes,
          resources: state.resources,
          allocation: state.allocation,
          maxDemand: state.maxDemand,
          available: state.available,
          totalResources: state.totalResources,
          history: state.history,
          score: state.score
        }
      });
    }

    // Initialize new round
    const available = calculateAvailable(PROBLEM_DATA.totalResources, PROBLEM_DATA.allocation);
    
    state = new Round2State({
      sessionId,
      ...PROBLEM_DATA,
      available,
      history: [{
        timestamp: new Date(),
        action: 'INITIALIZE',
        process: 'SYSTEM',
        granted: true,
        reason: 'Round 2 initialized'
      }]
    });

    await state.save();

    res.json({
      message: 'Round 2 initialized successfully',
      state: {
        processes: state.processes,
        resources: state.resources,
        allocation: state.allocation,
        maxDemand: state.maxDemand,
        available: state.available,
        totalResources: state.totalResources,
        history: state.history,
        score: state.score
      }
    });
  } catch (error) {
    console.error('Initialize error:', error);
    res.status(500).json({ error: 'Failed to initialize Round 2' });
  }
});

// Get current state
router.get('/state/:sessionId', async (req, res) => {
  try {
    const state = await Round2State.findOne({ sessionId: req.params.sessionId });
    
    if (!state) {
      return res.status(404).json({ error: 'Round 2 not initialized for this session' });
    }

    res.json({
      processes: state.processes,
      resources: state.resources,
      allocation: state.allocation,
      maxDemand: state.maxDemand,
      available: state.available,
      totalResources: state.totalResources,
      history: state.history,
      score: state.score,
      completed: state.completed
    });
  } catch (error) {
    console.error('Get state error:', error);
    res.status(500).json({ error: 'Failed to get state' });
  }
});

// Check if current state is safe
router.post('/check-safety', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    const state = await Round2State.findOne({ sessionId });
    if (!state) {
      return res.status(404).json({ error: 'Round 2 not initialized' });
    }

    const engine = new BankersEngine(
      state.processes,
      state.resources,
      state.allocation.map(row => [...row]),
      state.maxDemand.map(row => [...row]),
      [...state.available]
    );

    const safetyCheck = engine.isSafeState();

    // Add to history
    state.history.push({
      timestamp: new Date(),
      action: 'CHECK_SAFETY',
      process: 'SYSTEM',
      granted: safetyCheck.safe,
      reason: safetyCheck.safe ? 'System is in safe state' : 'System is in unsafe state',
      safeSequence: safetyCheck.safeSequence
    });

    // Award points only for first safety check
    const isFirstCheck = state.history.filter(h => h.action === 'CHECK_SAFETY').length === 1;
    if (safetyCheck.safe && isFirstCheck) {
      state.score += 5;
    }

    await state.save();

    res.json({
      safe: safetyCheck.safe,
      safeSequence: safetyCheck.safeSequence,
      executionLog: safetyCheck.executionLog,
      unfinishedProcesses: safetyCheck.unfinishedProcesses,
      score: state.score
    });
  } catch (error) {
    console.error('Check safety error:', error);
    res.status(500).json({ error: 'Failed to check safety' });
  }
});

// Request resource allocation
router.post('/request', async (req, res) => {
  try {
    const { sessionId, processIndex, request } = req.body;
    
    if (!sessionId || processIndex === undefined || !request) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate that request has at least one non-zero value
    const hasValidRequest = request.some(val => val > 0);
    if (!hasValidRequest) {
      return res.status(400).json({ 
        granted: false,
        error: 'Request must have at least one non-zero resource value' 
      });
    }

    const state = await Round2State.findOne({ sessionId });
    if (!state) {
      return res.status(404).json({ error: 'Round 2 not initialized' });
    }

    if (state.completed) {
      return res.status(400).json({ error: 'Round 2 already completed' });
    }

    const engine = new BankersEngine(
      state.processes,
      state.resources,
      state.allocation.map(row => [...row]),
      state.maxDemand.map(row => [...row]),
      [...state.available]
    );

    const result = engine.requestResources(processIndex, request);

    // Check if request was denied and deduct points for any invalid request
    if (!result.granted) {
      state.score -= 5; // Deduct points for denied request (exceeds need or unsafe state)
    }

    // Update state if granted
    if (result.granted) {
      state.allocation = result.newState.allocation;
      state.available = result.newState.available;

      // Check if process need is now [0,0,0,0] - process completed
      const processNeed = state.resources.map((_, j) => 
        state.maxDemand[processIndex][j] - state.allocation[processIndex][j]
      );
      
      const processCompleted = processNeed.every(n => n === 0);
      
      if (processCompleted) {
        // Release all allocated resources back to available
        for (let j = 0; j < state.resources.length; j++) {
          state.available[j] += state.allocation[processIndex][j];
          state.allocation[processIndex][j] = 0;
        }
        
        state.score += 10; // Award points only when process fully completes
        
        // Add completion to history
        state.history.push({
          timestamp: new Date(),
          action: 'COMPLETE',
          process: state.processes[processIndex],
          request: null,
          granted: true,
          reason: 'Process completed - all resources auto-released (+10 points)',
          safeSequence: null
        });

        // Check if ALL processes are completed
        const allCompleted = state.processes.every((_, i) => {
          const need = state.resources.every((_, j) => 
            state.maxDemand[i][j] - state.allocation[i][j] === 0
          );
          return need;
        });

        if (allCompleted) {
          state.completed = true;
          state.score += 20; // Big bonus for completing all processes
          
          state.history.push({
            timestamp: new Date(),
            action: 'ROUND_COMPLETE',
            process: 'SYSTEM',
            request: null,
            granted: true,
            reason: 'All processes completed! Round 2 finished (+20 bonus)',
            safeSequence: null
          });
        }
      }
    }

    // Add request to history
    state.history.push({
      timestamp: new Date(),
      action: 'REQUEST',
      process: state.processes[processIndex],
      request,
      granted: result.granted,
      reason: result.reason || 'Request granted',
      safeSequence: result.safetyCheck && result.safetyCheck.safeSequence ? result.safetyCheck.safeSequence : null
    });

    await state.save();

    res.json({
      granted: result.granted,
      reason: result.reason,
      newState: result.newState,
      safetyCheck: result.safetyCheck,
      score: state.score
    });
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Release resources from a process
router.post('/release', async (req, res) => {
  try {
    const { sessionId, processIndex } = req.body;
    
    if (!sessionId || processIndex === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const state = await Round2State.findOne({ sessionId });
    if (!state) {
      return res.status(404).json({ error: 'Round 2 not initialized' });
    }

    // Check if process has any allocated resources
    const hasAllocatedResources = state.allocation[processIndex].some(val => val > 0);
    if (!hasAllocatedResources) {
      return res.status(400).json({ 
        error: 'Process has no resources to release' 
      });
    }

    const engine = new BankersEngine(
      state.processes,
      state.resources,
      state.allocation.map(row => [...row]),
      state.maxDemand.map(row => [...row]),
      [...state.available]
    );

    const result = engine.releaseResources(processIndex);

    // Update state
    state.allocation[processIndex] = new Array(state.resources.length).fill(0);
    state.available = result.newAvailable;
    state.score += 5;

    // Add to history
    state.history.push({
      timestamp: new Date(),
      action: 'RELEASE',
      process: state.processes[processIndex],
      granted: true,
      reason: 'Resources released successfully'
    });

    await state.save();

    res.json({
      success: true,
      newAvailable: result.newAvailable,
      score: state.score
    });
  } catch (error) {
    console.error('Release error:', error);
    res.status(500).json({ error: 'Failed to release resources' });
  }
});

// Reset Round 2
router.post('/reset', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    await Round2State.deleteOne({ sessionId });

    res.json({ message: 'Round 2 reset successfully' });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Failed to reset Round 2' });
  }
});

// Complete Round 2
router.post('/complete', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    const state = await Round2State.findOne({ sessionId });
    if (!state) {
      return res.status(404).json({ error: 'Round 2 not initialized' });
    }

    state.completed = true;
    state.endTime = new Date();
    
    const duration = (state.endTime - state.startTime) / 1000; // seconds
    const bonusScore = Math.max(0, 100 - Math.floor(duration / 10));
    state.score += bonusScore;

    await state.save();

    res.json({
      message: 'Round 2 completed!',
      finalScore: state.score,
      duration,
      history: state.history
    });
  } catch (error) {
    console.error('Complete error:', error);
    res.status(500).json({ error: 'Failed to complete Round 2' });
  }
});

module.exports = router;
