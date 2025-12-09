import React, { useState, useEffect } from 'react';
import { initializeRound2, getState, checkSafety, requestResources, releaseResources } from '../services/api';
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
      
      setMessage(result.safe ? 'System is in SAFE state!' : 'System is in UNSAFE state!');
    } catch (error) {
      setMessage('Error checking safety: ' + error.message);
    }
  };

  const handleRequestResources = async () => {
    if (selectedProcess === null) {
      setMessage('Please select a process first');
      return;
    }

    // Validate that at least one resource is requested
    const hasValidRequest = request.some(val => val > 0);
    if (!hasValidRequest) {
      setMessage('Please request at least one resource (value must be greater than 0)');
      return;
    }

    // Validate that request doesn't exceed available resources
    const exceedsAvailable = request.some((val, idx) => val > state.available[idx]);
    if (exceedsAvailable) {
      setMessage('Request exceeds available resources');
      return;
    }

    // Validate that request doesn't exceed process need
    const need = calculateNeed(selectedProcess);
    const exceedsNeed = request.some((val, idx) => val > need[idx]);
    if (exceedsNeed) {
      setMessage('Request exceeds process maximum need');
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
          setMessage(`Round 2 Complete! All processes successfully executed. Final Score: ${updatedState.score}`);
        } else {
          setMessage(`Request granted! System remains in safe state.`);
        }
        setRequest(new Array(updatedState.resources.length).fill(0));
      } else {
        setMessage(`Request denied: ${result.reason}`);
        setSafetyResult(result.safetyCheck);
      }
    } catch (error) {
      setMessage('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleReleaseResources = async (processIndex) => {
    try {
      const result = await releaseResources(sessionId, processIndex);
      
      // Refresh state
      const newState = await getState(sessionId);
      setState(newState);
      setMessage(`Resources released from ${state.processes[processIndex]}`);
    } catch (error) {
      setMessage('Error releasing resources: ' + error.message);
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
      <div className="terminal-box">
        {/* Terminal Header */}
        <div className="term-header">
          <div className="term-buttons">
            <div className="term-dot close" />
            <div className="term-dot min" />
            <div className="term-dot max" />
          </div>
          <div className="header-center">Round 2: Banker's Algorithm</div>
          <div className="header-right">
            <span className="username">Player: {username}</span>
            <span className="score">Score: {state.score}</span>
            {state.completed && <span className="completed-badge">COMPLETED</span>}
          </div>
        </div>

        {/* Terminal Content */}
        <div className="term-content">

      {/* Completion Message */}
      {state.completed && (
        <div className="completion-message">
          Congratulations! All processes have been successfully executed. Round 2 Complete!
        </div>
      )}

      {/* Objective */}
      <div className="objective-panel">
        <h3>Objective</h3>
        <p>Experiment with resource allocation using the Banker's Algorithm for deadlock avoidance.</p>
      </div>

      {/* Status Message - Moved below request section */}

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Left Column: Processes */}
        <div className="section processes-section">
          <h3>Process Status</h3>
          <div className="processes-table">
            <div className="table-header">
              <span>Process</span>
              <span>Allocated</span>
              <span>Max Demand</span>
            </div>
            {state.processes.map((proc, i) => {
              const isSelected = selectedProcess === i;
              const needArray = calculateNeed(i);
              const isCompleted = needArray.every(n => n === 0);
              
              return (
                <div 
                  key={proc} 
                  className={`process-row ${isSelected ? 'selected' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => setSelectedProcess(i)}
                >
                  <span className="process-id">{proc}</span>
                  <span className="process-data">[{state.allocation[i].join(', ')}]</span>
                  <span className="process-data">[{state.maxDemand[i].join(', ')}]</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Resources */}
        <div className="section resources-section">
          <h3>Resource Pool</h3>
          <div className="resources-table">
            <div className="table-header">
              <span>Resource</span>
              <span>Total</span>
              <span>Available</span>
              <span>In Use</span>
            </div>
            {state.resources.map((res, j) => (
              <div key={res} className="resource-row">
                <span className="resource-name">{res}</span>
                <span className="resource-value">{state.totalResources[j]}</span>
                <span className="resource-value available">{state.available[j]}</span>
                <span className="resource-value">
                  {state.allocation.reduce((sum, proc) => sum + proc[j], 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Request Panel */}
      <div className="section request-section">
        <h3>Resource Request</h3>
        <div className="request-info">
          <span>Selected Process:</span>
          <span className="selected-value">
            {selectedProcess !== null ? state.processes[selectedProcess] : 'Click a process to select'}
          </span>
        </div>
        <div className="request-form">
          {state.resources.map((res, j) => (
            <div key={res} className="request-input">
              <label>{res}</label>
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
          <button 
            className="btn-request"
            onClick={handleRequestResources}
            disabled={selectedProcess === null}
          >
            Request Resources
          </button>
          <button 
            className="btn-safety"
            onClick={handleCheckSafety}
          >
            Check Safety
          </button>
        </div>
        
        {/* Status Message */}
        {message && (
          <div className={`status-message ${message.includes('granted') || message.includes('SAFE') || message.includes('Complete') || message.includes('released') ? 'success' : message.includes('denied') || message.includes('UNSAFE') || message.includes('exceeds') || message.includes('Error') ? 'error' : 'info'}`}>
            {message}
          </div>
        )}
      </div>

      {/* Safety Result */}
      {safetyResult && (
        <div className={`section safety-result ${safetyResult.safe ? 'safe' : 'unsafe'}`}>
          <div className="safety-status">
            {safetyResult.safe ? 'SAFE STATE' : 'UNSAFE STATE'}
          </div>
          {safetyResult.safe && safetyResult.sequence && (
            <div className="safe-sequence">
              Safe Sequence: {safetyResult.sequence.join(' → ')}
            </div>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="action-bar">
        <button className="btn-history" onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? '[-] Hide' : '[+] Show'} History
        </button>
      </div>

      {/* History Section */}
      {showHistory && state.history && state.history.length > 0 && (
        <div className="section history-section">
          <h3>Action History</h3>
          <div className="history-table">
            <div className="history-header">
              <span>Time</span>
              <span>Process</span>
              <span>Request</span>
              <span>Result</span>
              <span>Reason</span>
            </div>
            {state.history.slice().reverse().map((entry, i) => (
              <div key={i} className={`history-row ${entry.granted ? 'granted' : 'denied'}`}>
                <span className="history-time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span className="history-process">{entry.process}</span>
                <span className="history-request">{entry.request ? `[${entry.request.join(', ')}]` : '-'}</span>
                <span className="history-result">{entry.granted ? 'GRANTED' : 'DENIED'}</span>
                <span className="history-reason">{entry.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

        </div> {/* Close term-content */}

        {/* Terminal Footer */}
        <div className="term-footer">
          <div>Banker's Algorithm</div>
          <div style={{ opacity: 0.8 }}>OS Escape — Round 2</div>
        </div>
      </div> {/* Close terminal-box */}
    </div>
  );
}
