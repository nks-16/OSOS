import React, { useState, useEffect } from 'react';
import Terminal from './components/Terminal';
import Login from './components/Login';
import BankersAlgorithm from './components/BankersAlgorithm';
import Round3Quiz from './components/Round3Quiz';

export default function App() {
  const [session, setSession] = useState(() => localStorage.getItem('sessionId') || null);
  const [username, setUsername] = useState(() => localStorage.getItem('username') || null);
  const [currentRound, setCurrentRound] = useState(() => localStorage.getItem('currentRound') || 'menu');

  const onLogin = ({ sessionId, username }) => {
    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('username', username);
    setSession(sessionId);
    setUsername(username);
    setCurrentRound('menu');
  };

  const onLogout = () => {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('username');
    localStorage.removeItem('currentRound');
    setSession(null);
    setUsername(null);
    setCurrentRound('menu');
  };

  const selectRound = (round) => {
    setCurrentRound(round);
    localStorage.setItem('currentRound', round);
  };

  if (!session) {
    return (
      <div className="app">
        <Login onLogin={onLogin} />
      </div>
    );
  }

  if (currentRound === 'menu') {
    return (
      <div className="app">
        <div className="round-selection">
          <h1>OS Escape Game</h1>
          <div className="user-bar">
            <span>Welcome, {username}!</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
          
          <div className="rounds-container">
            <div className="round-card" onClick={() => selectRound('round1')}>
              <div className="round-icon">[ FS ]</div>
              <h2>Round 1</h2>
              <h3>File System Navigation</h3>
              <p>Master Linux terminal commands and navigate through a virtual file system</p>
              <button className="play-btn">Play Round 1</button>
            </div>

            <div className="round-card" onClick={() => selectRound('round2')}>
              <div className="round-icon">[ BA ]</div>
              <h2>Round 2</h2>
              <h3>Banker's Algorithm</h3>
              <p>Experiment with resource allocation and understand deadlock avoidance</p>
              <button className="play-btn">Play Round 2</button>
            </div>

            <div className="round-card" onClick={() => selectRound('round3')}>
              <div className="round-icon">[ QUIZ ]</div>
              <h2>Round 3</h2>
              <h3>Comprehension Quiz</h3>
              <p>Test your understanding of concurrency and threading concepts</p>
              <button className="play-btn">Play Round 3</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentRound === 'round1') {
    return (
      <div className="app">
        <div className="round-header">
          <h1>Round 1: File System</h1>
          <div className="header-controls">
            <span>User: {username}</span>
            <button onClick={() => selectRound('menu')} className="back-btn">← Back to Menu</button>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
        <Terminal sessionId={session} />
      </div>
    );
  }

  if (currentRound === 'round2') {
    return (
      <div className="app">
        <div className="nav-controls">
          <button onClick={() => selectRound('menu')} className="back-btn">← Back to Menu</button>
        </div>
        <BankersAlgorithm sessionId={session} username={username} />
      </div>
    );
  }

  if (currentRound === 'round3') {
    return (
      <div className="app">
        <div className="nav-controls">
          <button onClick={() => selectRound('menu')} className="back-btn">← Back to Menu</button>
        </div>
        <Round3Quiz sessionId={session} username={username} />
      </div>
    );
  }

  return null;
}
