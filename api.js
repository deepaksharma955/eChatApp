import { Platform } from 'react-native';

const LIVE_URL = 'https://echatapp-production-fe62.up.railway.app';
const DEV_PORT = 3001;
const TIMEOUT = 15000;

const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'web') return `http://localhost:${DEV_PORT}`;
    if (Platform.OS === 'android') return `http://10.0.2.2:${DEV_PORT}`;
    if (Platform.OS === 'ios') return `http://localhost:${DEV_PORT}`;
    return `http://localhost:${DEV_PORT}`;
  }
  return LIVE_URL;
};

export const API_BASE = getBaseUrl();

async function fetchWithTimeout(url, options, timeout = TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    if (e.name === 'AbortError') throw new Error('Request timed out. Is the AI server running?');
    throw e;
  }
}

export const api = {
  post: async (endpoint, body) => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      return data;
    } catch (e) {
      throw e;
    }
  },
  get: async (endpoint) => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}${endpoint}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      return data;
    } catch (e) {
      throw e;
    }
  },
};
