import axios from 'axios';
const API = axios.create({ baseURL:  'http://localhost:5000/api' });

export default {
  login: async (username) => {
    const r = await API.post('/auth/login', { username });
    return r.data;
  },
  getSession: async (sessionId) => {
    const r = await API.get(`/auth/session/${sessionId}`).catch(()=>null);
    return r ? r.data : null;
  },
  execCommand: async (sessionId, command) => {
    const r = await API.post('/terminal/exec', { sessionId, command });
    return r.data;
  }
};
