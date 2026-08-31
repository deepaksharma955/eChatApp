const fetch = require('node-fetch');

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const OLLAMA_BASE = process.env.OLLAMA_BASE_URL;

const GROQ_BASE = 'https://api.groq.com/openai';

async function openaiCompatibleChat(messages, options = {}) {
  const useGroq = GROQ_KEY && !OPENAI_KEY && !OLLAMA_BASE;
  const baseUrl = OLLAMA_BASE || (useGroq ? GROQ_BASE : 'https://api.openai.com');
  const model = options.model || (OLLAMA_BASE ? 'llama3.2' : useGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini');
  const headers = { 'Content-Type': 'application/json' };
  const apiKey = GROQ_KEY && !OPENAI_KEY && !OLLAMA_BASE ? GROQ_KEY : OPENAI_KEY;
  if (!OLLAMA_BASE && apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  try {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`${baseUrl} returned ${res.status}: ${text}`);
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (e) {
    console.error('AI error:', e.message);
    return null;
  }
}

async function callAI(systemPrompt, userMessage, options = {}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  if (OLLAMA_BASE) return openaiCompatibleChat(messages, { ...options, model: options.model || 'llama3.2' });
  if (OPENAI_KEY) return openaiCompatibleChat(messages, options);
  if (GROQ_KEY) return openaiCompatibleChat(messages, { ...options, model: 'llama-3.3-70b-versatile' });

  if (GEMINI_KEY) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }],
          generationConfig: { maxOutputTokens: options.maxTokens || 1000, temperature: options.temperature || 0.7 },
        }),
      });
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
      console.error('Gemini error:', e.message);
      return null;
    }
  }

  return null;
}

async function callAIChat(messages, options = {}) {
  if (OLLAMA_BASE) return openaiCompatibleChat(messages, { ...options, model: options.model || 'llama3.2' });
  if (OPENAI_KEY) return openaiCompatibleChat(messages, options);
  if (GROQ_KEY) return openaiCompatibleChat(messages, { ...options, model: 'llama-3.3-70b-versatile' });

  if (GEMINI_KEY) {
    const sysMsg = messages.find(m => m.role === 'system')?.content || '';
    const history = messages.filter(m => m.role !== 'system').slice(-10);
    const context = history.map(m => `${m.role}: ${m.content}`).join('\n');
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${sysMsg}\n\n${context}` }] }],
          generationConfig: { maxOutputTokens: options.maxTokens || 1000, temperature: options.temperature || 0.7 },
        }),
      });
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
      console.error('Gemini error:', e.message);
      return null;
    }
  }

  return null;
}

function extractJSON(raw) {
  if (!raw) throw new Error('Empty AI response');
  const cleaned = String(raw).replace(/```(?:json)?\s*/gi, '').replace(/\s*```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (_) {}
    }
    throw new Error('Invalid JSON from AI: ' + cleaned.slice(0, 300));
  }
}

module.exports = { callAI, callAIChat, extractJSON };
