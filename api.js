import { Platform } from 'react-native';
import { getCached, setCached } from './utils/cache';

const LIVE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://echatapp-nyxt.onrender.com';
const DEV_PORT = 3001;
const TIMEOUT = 30000;
const API_KEY = process.env.EXPO_PUBLIC_API_KEY || '';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_BACKEND_URL) return process.env.EXPO_PUBLIC_BACKEND_URL;
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

async function fetchWithRetry(url, options, retries = 2, delay = 1000) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchWithTimeout(url, options);
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
}

async function safeParse(res) {
  const ct = res.headers.get('content-type') || '';
  const text = await res.text();
  if (ct.includes('application/json')) {
    try { return JSON.parse(text); } catch (_) { return { error: 'Invalid JSON response' }; }
  }
  return null;
}

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['x-api-key'] = API_KEY;
  return headers;
};

export const api = {
  post: async (endpoint, body) => {
    const res = await fetchWithRetry(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await safeParse(res);
    if (!data) throw new Error(`Server returned non-JSON (status ${res.status}). Is the server updated?`);
    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
    return data;
  },
  get: async (endpoint) => {
    const cached = await getCached(endpoint);
    if (cached) return cached;
    const res = await fetchWithRetry(`${API_BASE}${endpoint}`, {
      headers: getHeaders(),
    });
    const data = await safeParse(res);
    if (!data) throw new Error(`Server returned non-JSON (status ${res.status}). Is the server updated?`);
    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
    await setCached(endpoint, data);
    return data;
  },
};
