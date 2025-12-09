import React, { useState, useEffect } from 'react';
import { initializeRound2, getState, checkSafety, requestResources, releaseResources, resetRound2 } from '../services/api';
// Assuming the CSS for the terminal style is in this file or a separate 'terminal.css'
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
      
      setMessage(result.safe 
        ? `SAFE STATE detected. Sequence: [${(result.sequence || []).join(' -> ')}]` 
        : `UNSAFE STATE detected. No safe sequence found.`);
    } catch (error) {
      setMessage('Error checking safety: ' + error.message);
    }
  };

  const handleRequestResources = async () => {
    if (selectedProcess === null) {
      setMessage('ERROR: Please select a process first.');
      return;
    }

    const requestInts = request.map(val => parseInt(val) || 0);

    // Validate that at least one resource is requested
    const hasValidRequest = requestInts.some(val => val > 0);
    if (!hasValidRequest) {
      setMessage('ERROR: Request must be greater than zero for at least one resource.');
      return;
    }

    // Validation (Logic remains unchanged, only messages are styled)
    const exceedsAvailable = requestInts.some((val, idx) => val > state.available[idx]);
    if (exceedsAvailable) {
      setMessage('ERROR: Request exceeds available resources.');
      return;
    }

    const need = calculateNeed(selectedProcess);
    const exceedsNeed = requestInts.some((val, idx) => val > need[idx]);
    if (exceedsNeed) {
      setMessage('ERROR: Request exceeds process maximum need.');
      return;
    }

    try {
      const result = await requestResources(sessionId, selectedProcess, requestInts);
      
      // Refresh complete state to get updated history and all data
      const updatedState = await getState(sessionId);
      setState(updatedState);
      
      if (result.granted) {
        setSafetyResult(result.safetyCheck);

        if (updatedState.completed) {
          setMessage(`ALL PROCESSES COMPLETED. Final Score: ${updatedState.score}. Round 2 terminated.`);
        } else {
          setMessage(`Request granted for ${state.processes[selectedProcess]}. System remains safe.`);
        }
        setRequest(new Array(updatedState.resources.length).fill(0));
      } else {
        setMessage(`Request denied for ${state.processes[selectedProcess]}: ${result.reason}`);
        setSafetyResult(result.safetyCheck);
      }
    } catch (error) {
      setMessage('ERROR: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleReleaseResources = async (processIndex) => {
    try {
      await releaseResources(sessionId, processIndex);
      
      // Refresh state
      const newState = await getState(sessionId);
      setState(newState);
      setMessage(`Resources released by completed process ${state.processes[processIndex]}.`);
    } catch (error) {
      setMessage('ERROR: Error releasing resources: ' + error.message);
    }
  };

  const handleReset = async () => {
    if (window.confirm('WARNING: Resetting Round 2 will erase your progress. Proceed?')) {
      try {
        await resetRound2(sessionId);
        setSafetyResult(null);
        setSelectedProcess(null);
        await initializeGame();
        setMessage('System reset. Initial state loaded.');
      } catch (error) {
        setMessage('ERROR: Error resetting: ' + error.message);
      }
    }
  };

  const calculateNeed = (processIndex) => {
    if (!state) return [];
    const resourcesLen = Array.isArray(state.resources) ? state.resources.length : 0;
    const need = new Array(resourcesLen).fill(0);
    if (!Array.isArray(state.maxDemand) || !Array.isArray(state.allocation)) return need;
    const maxRow = state.maxDemand[processIndex] || new Array(resourcesLen).fill(0);
    const allocRow = state.allocation[processIndex] || new Array(resourcesLen).fill(0);
    for (let j = 0; j < resourcesLen; j++) {
      const maxVal = typeof maxRow[j] === 'number' ? maxRow[j] : 0;
      const allocVal = typeof allocRow[j] === 'number' ? allocRow[j] : 0;
      need[j] = maxVal - allocVal;
    }
    return need;
  };

  // --- JSX TEMPLATE MODIFICATIONS FOR TERMINAL UI ---

  if (loading) {
    return (
        <div className="terminal-container">
            <div className="terminal-header">Round 2: Banker's Algorithm</div>
            <div className="terminal-content">
                <div className="loading">Loading Round 2...</div>
            </div>
        </div>
    );
  }

  if (!state) {
    return (
        <div className="terminal-container">
            <div className="terminal-header">Round 2: Banker's Algorithm</div>
            <div className="terminal-content">
                <div className="error">FATAL ERROR: Failed to load Round 2</div>
            </div>
        </div>
    );
  }

  // Helper to format array for terminal display (defensive against malformed data)
  const formatArray = (arr) => {
    if (!Array.isArray(arr)) return '[]';
    return `[${arr.join(', ')}]`;
  };

  // Determine message styling class from message content
  const getMessageClass = (msg) => {
    if (!msg) return 'info-text';
    const lower = msg.toLowerCase();
    if (lower.includes('error') || lower.includes('denied') || lower.includes('failed')) return 'error-text';
    if (lower.includes('granted') || lower.includes('completed') || lower.includes('safe') || lower.includes('success')) return 'success-text';
    return 'info-text';
  };

  return (
    <div className="terminal-container">
      {/* Mimic Round 1 Header - Adjust styling in bankers.css */}
      <div className="terminal-header">
        <div className="traffic-lights">
          <span className="red"></span>
          <span className="yellow"></span>
          <span className="green"></span>
        </div>
        <div className="header-title">Round 2: Deadlock Avoidance (Banker's)</div>
        <div className="score-info">
            User: {username} | Score: {state.score}
            {state.completed && <span className="completed-badge"> | <span className="green-text">COMPLETED</span></span>}
            <button className="terminal-button-menu" onClick={() => window.location.href = '/menu'}>
                Back to Menu
            </button>
            <button className="terminal-button-logout" onClick={() => window.location.href = '/logout'}>
                Logout
            </button>
        </div>
      </div>
      
      <div className="terminal-content">
        
        {/* Status Messages */}
        <div className="terminal-prompt">
          /system/banker$ <span className="command-output">
            {state.completed 
                ? 'COMPLETED: All processes finished successfully.' 
                : 'Connected'
            }
          </span>
        </div>
        
        {/* Message moved below Execute Request button per UI change */}

        {/* System State Display */}
        <div className="terminal-section">
            <span className="prompt-label">SYSTEM STATE:</span>
            <table className="terminal-table">
                <thead>
                  <tr>
                    <th className="table-header">Process</th>
                    <th className="table-header">Allocated ({(state.resources || []).join(', ')})</th>
                    <th className="table-header">Max Demand ({(state.resources || []).join(', ')})</th>
                  </tr>
                </thead>
                <tbody>
                    {(state.processes || []).map((proc, i) => {
                      const need = calculateNeed(i);
                      const isSelected = selectedProcess === i;
                      const allocRow = (state.allocation && state.allocation[i]) || new Array((state.resources || []).length).fill(0);
                      const isCompleted = need.every(n => n === 0) && allocRow.some(a => a > 0);

                        return (
                            <tr 
                                key={proc} 
                                className={`terminal-row ${isSelected ? 'selected-row' : ''} ${isCompleted ? 'completed-row' : ''}`}
                                onClick={() => setSelectedProcess(i)}
                            >
                                <td className="process-cell">
                                    <span className={`process-name-cmd ${isSelected ? 'blink' : ''}`}>{proc}</span>
                                </td>
                                <td>{formatArray(allocRow)}</td>
                                <td>{formatArray((state.maxDemand && state.maxDemand[i]) || new Array((state.resources || []).length).fill(0))}</td>
                                {/* Status column removed per request; release button was part of it and removed */}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        
        {/* Available Resources */}
        <div className="terminal-section resource-status">
            <span className="prompt-label">AVAILABLE RESOURCES:</span>
            {(state.resources || []).map((res, j) => (
                <span key={res} className="resource-stat">
                    <span className="resource-name-cmd">{res}:</span> <span className="resource-value">{state.available[j]}</span> 
                </span>
            ))}
            <span className="total-allocated">
                <span className="prompt-label">TOTAL ALLOCATED:</span>
              {(state.resources || []).map((res, j) => (
                <span key={res} className="resource-stat">
                  <span className="resource-name-cmd">{res}:</span> <span className="resource-value">{(state.allocation || []).reduce((sum, proc) => sum + (proc[j] || 0), 0)}</span> 
                </span>
              ))}
            </span>
        </div>

        {/* Command Input/Request Panel */}
        <div className="terminal-command-panel">
            <div className="terminal-prompt-input">
                /system/banker$ request <span className="info-text">{selectedProcess !== null ? state.processes[selectedProcess] : '<SELECT_PROCESS>'}</span>
            </div>
            
            <div className="request-inputs-cmd">
                {(state.resources || []).map((res, j) => (
                    <div key={res} className="input-group-cmd">
                        <label className="input-label-cmd">{res}=</label>
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
                            className="terminal-input"
                        />
                    </div>
                ))}
            </div>
            
            <button 
                className="terminal-action-button primary-cmd"
                onClick={handleRequestResources}
                disabled={selectedProcess === null}
            >
                EXECUTE REQUEST
            </button>

            {/* Request result alert placed directly below the Execute button */}
            {message && (
              <div className={`message-output request-alert ${getMessageClass(message)}`}>
                {message}
              </div>
            )}
        </div>
        {/* Safety check, history and reset buttons removed per request; history panel also removed */}
        
        {/* End of terminal content marker (trailing prompt removed per request) */}
      </div>
    </div>
  );
}