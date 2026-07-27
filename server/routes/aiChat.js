const express = require('express');
const router = express.Router();
const { callAIChat } = require('../utils/aiHelper');

const SYSTEM_PROMPT = `You are a friendly AI English conversation partner. Your role:
- Help users practice English conversation
- Correct their grammar naturally by modeling correct usage in your response
- Adjust your language level to match theirs
- Encourage them to keep talking
- Keep responses conversational and natural (1-3 sentences usually)
- If they make a mistake, gently model the correction in your reply
- Ask follow-up questions to keep the conversation going`;

router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history || []).slice(-20),
      { role: 'user', content: message },
    ];

    const result = await callAIChat(messages, { maxTokens: 500 });

    if (!result) {
      return res.json({
        reply: `That's interesting! Tell me more about "${message.slice(0, 30)}..." — What do you enjoy most about it? (Set OPENAI_API_KEY or GEMINI_API_KEY for AI responses)`,
      });
    }

    res.json({ reply: result });
  } catch (e) {
    res.status(500).json({ error: e.message, reply: 'Sorry, I had trouble responding. Can you try again?' });
  }
});

module.exports = router;
