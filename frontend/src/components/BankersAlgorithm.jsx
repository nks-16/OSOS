import React, { useState, useEffect } from 'react';
import { initializeRound2, getState, checkSafety, requestResources, releaseResources, resetRound2 } from '../services/api';
import '../styles/bankers.css';

export default function BankersAlgorithm({ sessionId, username }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [request, setRequest] = useState([]);
  const [safetyResult, setSafetyResult] = useState(null);
  const [message, setMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    initializeGame();
  }, [sessionId]);

  const initializeGame = async () => {
    try {
      setLoading(true);
      const response = await initializeRound2(sessionId);
      setState(response.state);
      setRequest(new Array(response.state.resources.length).fill(0));
      setMessage(response.message);
      setLoading(false);
    } catch (error) {
      setMessage('Error initializing Round 2: ' + error.message);
      setLoading(false);
    }
  };

  const handleCheckSafety = async () => {
    try {
      const result = await checkSafety(sessionId);
      setSafetyResult(result);
      
      // Refresh complete state to get updated score and history
      const updatedState = await getState(sessionId);
      setState(updatedState);
      
      setMessage(result.safe ? '✓ System is in SAFE state!' : '✗ System is in UNSAFE state!');
    } catch (error) {
      setMessage('Error checking safety: ' + error.message);
    }
  };

  const handleRequestResources = async () => {
    if (selectedProcess === null) {
      setMessage('❌ Please select a process first');
      return;
    }

    // Validate that at least one resource is requested
    const hasValidRequest = request.some(val => val > 0);
    if (!hasValidRequest) {
      setMessage('❌ Please request at least one resource (value must be greater than 0)');
      return;
    }

    // Validate that request doesn't exceed available resources
    const exceedsAvailable = request.some((val, idx) => val > state.available[idx]);
    if (exceedsAvailable) {
      setMessage('❌ Request exceeds available resources');
      return;
    }

    // Validate that request doesn't exceed process need
    const need = calculateNeed(selectedProcess);
    const exceedsNeed = request.some((val, idx) => val > need[idx]);
    if (exceedsNeed) {
      setMessage('❌ Request exceeds process maximum need');
      return;
    }

    try {
      const result = await requestResources(sessionId, selectedProcess, request);
      
      // Refresh complete state to get updated history and all data
      const updatedState = await getState(sessionId);
      setState(updatedState);
      
      if (result.granted) {
        setSafetyResult(result.safetyCheck);
        
        // Check if round is completed
        if (updatedState.completed) {
          setMessage(`🎉 Round 2 Complete! All processes successfully executed. Final Score: ${updatedState.score}`);
        } else {
          setMessage(`✅ Request granted! System remains in safe state.`);
        }
        setRequest(new Array(updatedState.resources.length).fill(0));
      } else {
        setMessage(`❌ Request denied: ${result.reason}`);
        setSafetyResult(result.safetyCheck);
      }
    } catch (error) {
      setMessage('❌ Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleReleaseResources = async (processIndex) => {
    try {
      const result = await releaseResources(sessionId, processIndex);
      
      // Refresh state
      const newState = await getState(sessionId);
      setState(newState);
      setMessage(`✓ Resources released from ${state.processes[processIndex]}`);
    } catch (error) {
      setMessage('Error releasing resources: ' + error.message);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset Round 2?')) {
      try {
        await resetRound2(sessionId);
        setSafetyResult(null);
        setSelectedProcess(null);
        await initializeGame();
      } catch (error) {
        setMessage('Error resetting: ' + error.message);
      }
    }
  };

  const calculateNeed = (processIndex) => {
    if (!state) return [];
    const need = [];
    for (let j = 0; j < state.resources.length; j++) {
      need.push(state.maxDemand[processIndex][j] - state.allocation[processIndex][j]);
    }
    return need;
  };

  if (loading) {
    return <div className="bankers-container"><div className="loading">Loading Round 2...</div></div>;
  }

  if (!state) {
    return <div className="bankers-container"><div className="error">Failed to load Round 2</div></div>;
  }

  return (
    <div className="bankers-container">
      <div className="bankers-header">
        <h1>Round 2: Banker's Algorithm</h1>
        <div className="header-info">
          <span className="username">Player: {username}</span>
          <span className="score">Score: {state.score}</span>
          {state.completed && <span className="completed-badge">✓ COMPLETED</span>}
        </div>
      </div>

      {state.completed && (
        <div className="message success" style={{ fontSize: '18px', fontWeight: '600' }}>
          Congratulations! All processes have been successfully executed. Round 2 Complete!
        </div>
      )}

      <div className="objective-panel">
        <h3>Objective</h3>
        <p>Experiment with resource allocation and understand the Banker's Algorithm for deadlock avoidance.</p>
        <ul>
          <li>Select a process and request resources</li>
          <li>Check if the system remains in a safe state</li>
          <li>Find safe sequences for process execution</li>
          <li>Release resources when processes complete</li>
        </ul>
      </div>

      {message && (
        <div className={`message ${message.includes('✓') ? 'success' : message.includes('✗') ? 'error' : 'info'}`}>
          {message}
        </div>
      )}

      <div className="main-grid">
        {/* Process Nodes Visualization */}
        <div className="processes-section">
          <h3>Processes</h3>
          <div className="nodes-grid">
            {state.processes.map((proc, i) => {
              const need = calculateNeed(i);
              const isSelected = selectedProcess === i;
              
              return (
                <div 
                  key={proc} 
                  className={`process-node ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedProcess(i)}
                >
                  <div className="process-name">{proc}</div>
                  <div className="process-arrays">
                    <div>
                      <strong>Allocated:</strong>
                      <span>[{state.allocation[i].join(', ')}]</span>
                    </div>
                    <div>
                      <strong>Max Demand:</strong>
                      <span>[{state.maxDemand[i].join(', ')}]</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resource Status */}
        <div className="resources-section">
          <h3>Resource Status</h3>
          <div className="resources-grid">
            {state.resources.map((res, j) => (
              <div key={res} className="resource-card">
                <div className="resource-name">{res}</div>
                <div className="resource-stats">
                  <div className="stat">
                    <span className="stat-label">Total:</span>
                    <span className="stat-value">{state.totalResources[j]}</span>
                  </div>
                  <div className="stat available">
                    <span className="stat-label">Available:</span>
                    <span className="stat-value">{state.available[j]}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Allocated:</span>
                    <span className="stat-value">
                      {state.allocation.reduce((sum, proc) => sum + proc[j], 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Request Panel - Moved below main grid */}
      <div className="request-panel">
        <h3>Make a Request</h3>
        <div className="selected-process">
          Selected Process: <strong>{selectedProcess !== null ? state.processes[selectedProcess] : 'None'}</strong>
        </div>
        <div className="request-inputs">
          {state.resources.map((res, j) => (
            <div key={res} className="input-group">
              <label>{res}:</label>
              <input
                type="number"
                min="0"
                value={request[j] || 0}
                onChange={(e) => {
                  const newRequest = [...request];
                  newRequest[j] = parseInt(e.target.value) || 0;
                  setRequest(newRequest);
                }}
                disabled={selectedProcess === null}
              />
            </div>
          ))}
        </div>
        <button 
          className="primary"
          onClick={handleRequestResources}
          disabled={selectedProcess === null}
        >
          Request Resources
        </button>
      </div>

      {/* Safety Check Section */}
      <div className="safety-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Safety Analysis</h3>
          <button className="secondary" onClick={handleCheckSafety}>
            Check Safety
          </button>
        </div>
        
        {safetyResult && (
          <div className={`safety-result ${safetyResult.safe ? 'safe' : 'unsafe'}`}>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>
              {safetyResult.safe ? '✓' : '✗'} System is in {safetyResult.safe ? 'SAFE' : 'UNSAFE'} state
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="secondary" onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? 'Hide' : 'Show'} History
        </button>
        <button className="danger" onClick={handleReset}>
          Reset Round
        </button>
      </div>

      {/* History */}
      {showHistory && state.history && (
        <div className="history-panel">
          <h3>Action History</h3>
          <div className="history-list">
            {state.history.slice().reverse().map((entry, i) => (
              <div key={i} className="history-item">
                <span className="timestamp">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span className="action">{entry.action}</span>
                <span className="process">{entry.process}</span>
                {entry.request && <span className="request">Request: [{entry.request.join(', ')}]</span>}
                <span className={`result ${entry.granted ? 'granted' : 'denied'}`}>
                  {entry.granted ? '✓' : '✗'}
                </span>
                <span className="reason">{entry.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
