# Quick Start Guide - Round 2

## Installation

### Prerequisites
- Node.js (v14+)
- MongoDB (running locally or remote)
- npm or yarn

### Setup

1. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

4. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   # Server will run on http://localhost:5000
   ```

5. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   # Frontend will run on http://localhost:5173
   ```

## First Time Usage

1. Open browser to `http://localhost:5173`
2. Login with any username (creates new account)
3. Select "Round 2: Banker's Algorithm" from menu
4. Start experimenting!

## Quick Tutorial

### Basic Workflow

1. **Select a Process**
   - Click on any process node (P0-P6)
   - Selected process will be highlighted

2. **Request Resources**
   - Enter resource amounts in the input fields (A, B, C, D)
   - Click "Request Resources"
   - System will check if request is safe

3. **Check Safety**
   - Click "Check Safety" button
   - View the safe sequence if system is safe
   - See execution log for detailed steps

4. **Release Resources**
   - When a process is done, you can release its resources
   - This makes them available for other processes

### Example Scenario

**Goal**: Successfully allocate resources to P1

1. Select process P1 (click on P1 card)
2. P1 currently has: [2, 0, 0, 0]
3. P1 needs: [1, 2, 2, 2] (Max - Allocation)
4. Available: [3, 3, 2, 1]

**Try requesting**: [1, 2, 2, 1]
- This should be granted if it maintains safe state
- Check safety to see the safe sequence

### Understanding the Display

**Process Cards show:**
- Allocated: Currently held resources
- Max: Maximum resource demand
- Need: Remaining resources needed (Max - Allocated)

**Resource Cards show:**
- Total: Total instances in system
- Available: Currently unallocated
- Allocated: Sum of all process allocations

### Tips

- Start with small requests
- Always check safety after allocation
- Watch for processes where Need ≤ Available
- Try to find the safe sequence manually, then verify

## Scoring

- Check Safety: +10 points
- Successful Request: +20 points
- Release Resources: +15 points
- Time Bonus: Up to +100 points (faster = better)

## Common Issues

### Backend won't start
- Check if MongoDB is running
- Verify port 5000 is not in use
- Check MONGO_URI in backend/server.js

### Frontend won't connect
- Verify backend is running on port 5000
- Check API endpoint in frontend/src/services/api.js
- Look for CORS errors in browser console

### Request denied
- Check if request exceeds Need
- Verify sufficient resources are available
- Request might lead to unsafe state (intended behavior)

## Testing the Algorithm

### Test Case 1: Safe Request
Process: P5
Request: [1, 1, 1, 1]
Expected: Should be granted (if safe)

### Test Case 2: Check Initial Safety
Click "Check Safety" immediately after initialization
Should show a safe sequence exists

### Test Case 3: Release and Request
1. Release resources from P1
2. Available increases by [2, 0, 0, 0]
3. Try requesting for another process

## File Structure Quick Reference

```
backend/
├── engine/bankersEngine.js      # Algorithm logic
├── routes/bankers.js            # API endpoints
├── models/Round2State.js        # Database model
└── server.js                    # Main server

frontend/
├── src/
│   ├── components/BankersAlgorithm.jsx   # Main UI
│   ├── styles/bankers.css                # Styling
│   └── App.jsx                           # Navigation
```

## Next Steps

1. Read `ROUND2_README.md` for detailed documentation
2. Experiment with different allocation patterns
3. Try to create an unsafe state (system will prevent it)
4. Study the execution log to understand the algorithm
5. Challenge yourself to get the highest score!

## Support

For issues or questions:
1. Check the console for error messages
2. Review the action history in the UI
3. Verify MongoDB connection
4. Check network requests in browser DevTools

Happy Learning! 🎓
