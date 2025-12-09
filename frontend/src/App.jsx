import React, { useState, useEffect } from 'react';
import Terminal from './components/Terminal';
import Login from './components/Login';

export default function App() {
  const [session, setSession] = useState(() => localStorage.getItem('sessionId') || null);
  const [username, setUsername] = useState(() => localStorage.getItem('username') || null);

  const onLogin = ({ sessionId, username }) => {
    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('username', username);
    setSession(sessionId);
    setUsername(username);
  };

  const onLogout = () => {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('username');
    setSession(null);
    setUsername(null);
  };

  return (
    <div className="app">
      <h1>OS Escape — Round 1 (File System)</h1>
      {session ? <div><div style={{float:'right'}}>User: {username} <button onClick={onLogout}>Logout</button></div><Terminal sessionId={session} /></div> : <Login onLogin={onLogin} />}
    </div>
  );
}
