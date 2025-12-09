import axios from 'axios';
const API = axios.create({ baseURL:  'http://localhost:5000/api' });

// Round 1 - Terminal/File System APIs
export const login = async (username) => {
  const r = await API.post('/auth/login', { username });
  return r.data;
};

export const getSession = async (sessionId) => {
  const r = await API.get(`/auth/session/${sessionId}`).catch(()=>null);
  return r ? r.data : null;
};

export const execCommand = async (sessionId, command) => {
  const r = await API.post('/terminal/exec', { sessionId, command });
  return r.data;
};

// Round 2 - Banker's Algorithm APIs
export const initializeRound2 = async (sessionId) => {
  const r = await API.post('/bankers/initialize', { sessionId });
  return r.data;
};

export const getState = async (sessionId) => {
  const r = await API.get(`/bankers/state/${sessionId}`);
  return r.data;
};

export const checkSafety = async (sessionId) => {
  const r = await API.post('/bankers/check-safety', { sessionId });
  return r.data;
};

export const requestResources = async (sessionId, processIndex, request) => {
  const r = await API.post('/bankers/request', { sessionId, processIndex, request });
  return r.data;
};

export const releaseResources = async (sessionId, processIndex) => {
  const r = await API.post('/bankers/release', { sessionId, processIndex });
  return r.data;
};

export const resetRound2 = async (sessionId) => {
  const r = await API.post('/bankers/reset', { sessionId });
  return r.data;
};

export const completeRound2 = async (sessionId) => {
  const r = await API.post('/bankers/complete', { sessionId });
  return r.data;
};

export default {
  login,
  getSession,
  execCommand,
  initializeRound2,
  getState,
  checkSafety,
  requestResources,
  releaseResources,
  resetRound2,
  completeRound2
};
