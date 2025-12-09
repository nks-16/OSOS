# Round 2: Banker's Algorithm - Documentation

## Overview

Round 2 is an **independent, educational module** focused on teaching and experimenting with the **Banker's Algorithm** for deadlock avoidance in operating systems. It features an interactive visualization where participants can request resources, check system safety, and understand resource allocation strategies.

## Problem Statement

The system has:
- **7 Processes**: P0 through P6
- **4 Resource Types**: A, B, C, D
- **Total Resources**: A=12, B=6, C=8, D=9

### Initial State (Time T₀)

#### Allocation Matrix
```
Process  A  B  C  D
P0       0  1  0  2
P1       2  0  0  0
P2       3  0  2  1
P3       2  1  1  1
P4       0  0  2  2
P5       1  0  0  0
P6       1  1  1  1
```

#### Maximum Demand Matrix
```
Process  A  B  C  D
P0       7  5  3  4
P1       3  2  2  2
P2       9  0  2  2
P3       2  2  2  0
P4       4  3  3  3
P5       5  3  3  3
P6       3  2  2  2
```

#### Available Resources (Calculated)
```
A=3, B=3, C=2, D=1
```

## Architecture

### Backend Structure

```
backend/
├── engine/
│   └── bankersEngine.js    # Core Banker's Algorithm implementation
├── models/
│   └── Round2State.js      # MongoDB model for game state
├── routes/
│   └── bankers.js          # API endpoints for Round 2
└── server.js               # Updated to include Round 2 routes
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── BankersAlgorithm.jsx    # Main Round 2 component
│   ├── styles/
│   │   └── bankers.css             # Round 2 styling
│   ├── services/
│   │   └── api.js                  # API service (updated)
│   └── App.jsx                     # Updated with round navigation
```

## Features

### 1. Process Visualization
- **Interactive Process Nodes**: Each process (P0-P6) is displayed as a clickable card
- **Real-time State Display**: Shows Allocation, Max Demand, and calculated Need for each process
- **Visual Selection**: Selected process is highlighted for resource requests
- **Active State Indicator**: Processes with allocated resources are visually marked

### 2. Resource Management
- **Resource Cards**: Display total, available, and allocated amounts for each resource type (A, B, C, D)
- **Request Interface**: Intuitive input form to request resources for selected process
- **Validation**: Automatic checking if requests exceed need or available resources

### 3. Safety Algorithm
- **Real-time Safety Checks**: Verify if the system is in a safe state
- **Safe Sequence Display**: Shows the order in which processes can safely execute
- **Execution Log**: Detailed step-by-step breakdown of the safety algorithm
- **Visual Feedback**: Color-coded indicators for safe/unsafe states

### 4. Game Mechanics
- **Scoring System**:
  - Safety check: +10 points
  - Successful resource allocation: +20 points
  - Resource release: +15 points
  - Time bonus: up to +100 points
- **Action History**: Complete log of all operations
- **Reset Functionality**: Start over without losing session

## API Endpoints

### POST /api/bankers/initialize
Initialize Round 2 for a session
```json
Request: { "sessionId": "string" }
Response: { "message": "string", "state": {...} }
```

### GET /api/bankers/state/:sessionId
Get current system state

### POST /api/bankers/check-safety
Check if current state is safe
```json
Request: { "sessionId": "string" }
Response: { 
  "safe": boolean,
  "safeSequence": ["P0", "P1", ...],
  "executionLog": [...],
  "score": number
}
```

### POST /api/bankers/request
Request resource allocation
```json
Request: { 
  "sessionId": "string",
  "processIndex": number,
  "request": [number, number, number, number]
}
Response: { 
  "granted": boolean,
  "reason": "string",
  "newState": {...},
  "safetyCheck": {...}
}
```

### POST /api/bankers/release
Release resources from a process
```json
Request: { 
  "sessionId": "string",
  "processIndex": number
}
Response: { 
  "success": boolean,
  "newAvailable": [...]
}
```

### POST /api/bankers/reset
Reset Round 2 to initial state

### POST /api/bankers/complete
Mark Round 2 as completed and calculate final score

## Banker's Algorithm Implementation

### Core Components

1. **Need Calculation**
   ```
   Need[i][j] = Max[i][j] - Allocation[i][j]
   ```

2. **Safety Algorithm**
   - Simulates system state to find if processes can complete
   - Uses a Work vector (copy of Available)
   - Iteratively finds processes that can run with current Work
   - When a process completes, adds its Allocation back to Work

3. **Resource Request Algorithm**
   - Validates request against Need and Available
   - Temporarily allocates resources
   - Runs Safety Algorithm
   - If safe: commits allocation
   - If unsafe: rolls back allocation

## Design Principles

### Color Palette
- **Primary Gradient**: Purple to Blue (#667eea → #764ba2)
- **Success States**: Green (#38a169)
- **Error States**: Red (#e53e3e)
- **Background**: White cards on gradient background
- **Text**: Dark gray (#2d3748) for readability

### UI/UX Features
- **Responsive Design**: Works on desktop and mobile
- **Visual Feedback**: Animations and color changes for user actions
- **Clear Information Hierarchy**: Important data prominently displayed
- **Accessible**: High contrast, readable fonts

## Educational Objectives

1. **Understand Resource Allocation**: Learn how OSes manage limited resources
2. **Deadlock Avoidance**: See how Banker's Algorithm prevents deadlocks
3. **Safe States**: Experiment with safe vs unsafe states
4. **Process Scheduling**: Understand safe sequences for process execution

## Deployment Compatibility

### Docker Support
The application is containerizable:
- Backend runs on Node.js with MongoDB
- Frontend is built with Vite for optimal performance
- Environment variables for configuration

### Environment Variables
```
MONGO_URI=mongodb://127.0.0.1:27017/os-escape
PORT=5000
```

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

## Single Point of Connection

Round 2 integrates with the existing system through:
- **Shared Authentication**: Uses the same session system as Round 1
- **Session ID**: Single session ID tracks progress across all rounds
- **User Management**: Same login/logout flow
- **Database**: Shared MongoDB instance

## Usage Instructions

### For Participants

1. **Login**: Use existing credentials or create new account
2. **Select Round 2**: From the main menu
3. **Experiment**: 
   - Click a process to select it
   - Enter resource request values
   - Click "Request Resources"
   - Observe if request is granted
   - Check safety to see safe sequence
4. **Learn**: 
   - Try different allocation patterns
   - See what makes a state unsafe
   - Find optimal safe sequences
   - Release resources and observe changes

### For Instructors

Round 2 provides:
- **Real-time Feedback**: Immediate validation of concepts
- **Visual Learning**: Process nodes and resource visualization
- **Experimentation**: Safe environment to try different scenarios
- **Performance Tracking**: Scoring system for engagement

## Technical Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React, Vite, Axios
- **Algorithm**: Pure JavaScript implementation of Banker's Algorithm
- **Styling**: Modern CSS with gradients and animations

## Future Enhancements

1. **Multiple Problem Sets**: Different resource configurations
2. **Difficulty Levels**: Varying complexity scenarios
3. **Tutorial Mode**: Step-by-step guided learning
4. **Leaderboard**: Compare scores with other participants
5. **Export Results**: Save and share execution traces

## Testing

### Manual Testing Scenarios

1. **Safe Allocation**: Request resources that maintain safe state
2. **Unsafe Allocation**: Try to create unsafe state (should be denied)
3. **Resource Release**: Release resources and see availability increase
4. **Safety Check**: Verify safe sequence calculation
5. **Edge Cases**: Request exact Need amounts, release all resources

## Conclusion

Round 2 provides a comprehensive, interactive learning experience for the Banker's Algorithm. It combines theoretical concepts with practical experimentation, making complex OS concepts accessible and engaging.
