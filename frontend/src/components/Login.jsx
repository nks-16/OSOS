import React, { useState } from 'react';
import api from '../services/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!username) return alert('Enter username');
    const res = await api.login(username);
    if (res.sessionId) onLogin({ sessionId: res.sessionId, username: res.username });
  };

  return (
    <div>
      <form onSubmit={submit}>
        <label>Username: </label>
        <input value={username} onChange={e=>setUsername(e.target.value)} />
        <button className="button" type="submit">Login</button>
      </form>
      <div className="cheatsheet">
        <strong>Cheatsheet</strong><br/>
        ls, ls -a, cd &nbsp;|&nbsp; pwd &nbsp;|&nbsp; cat, less &nbsp;|&nbsp; find &nbsp;|&nbsp; tar -xvzf &nbsp;|&nbsp; ps aux &nbsp;|&nbsp; kill -9 &nbsp;|&nbsp; ls -l &nbsp;|&nbsp; chmod +x
      </div>
    </div>
  );
}
