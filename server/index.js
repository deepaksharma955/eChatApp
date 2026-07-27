const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.OPENAI_API_KEY;

function requireApiKey(req, res, next) {
  next();
}

function callOpenAI(messages, options = {}) {
  if (apiKey) {
    const fetch = require('node-fetch');
    return fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o-mini',
        messages,
        max_tokens: options.maxTokens || 500,
        temperature: options.temperature || 0.7,
      }),
    }).then(r => r.json()).then(d => d.choices?.[0]?.message?.content || '');
  }
  return null;
}

const grammarRoutes = require('./routes/grammar');
const aiChatRoutes = require('./routes/aiChat');
const translationRoutes = require('./routes/translation');
const vocabularyRoutes = require('./routes/vocabulary');
const challengesRoutes = require('./routes/challenges');
const pronunciationRoutes = require('./routes/pronunciation');
const speakingCoachRoutes = require('./routes/speakingCoach');
const progressRoutes = require('./routes/progress');

app.use('/api/grammar', requireApiKey, grammarRoutes);
app.use('/api/ai-chat', requireApiKey, aiChatRoutes);
app.use('/api/translate', requireApiKey, translationRoutes);
app.use('/api/vocabulary', requireApiKey, vocabularyRoutes);
app.use('/api/challenges', requireApiKey, challengesRoutes);
app.use('/api/pronunciation', requireApiKey, pronunciationRoutes);
app.use('/api/speaking-coach', requireApiKey, speakingCoachRoutes);
app.use('/api/progress', requireApiKey, progressRoutes);

app.get('/api/health', (req, res) => {
  const configured = !!(apiKey || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.OLLAMA_BASE_URL);
  res.json({ status: 'ok', aiConfigured: configured });
});

app.listen(PORT, () => {
  console.log(`EchatApp AI Server running on port ${PORT}`);
  if (!apiKey && !process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY && !process.env.OLLAMA_BASE_URL) {
    console.log('No AI provider configured — using mock responses. See .env.example to set one up.');
  }
});
