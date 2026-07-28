const express = require('express');
const router = express.Router();
const { callAI, extractJSON } = require('../utils/aiHelper');

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Text is required' });

    const systemPrompt = `You are an English grammar expert. Correct the user's text and explain the corrections.
Return JSON only with this structure:
{
  "original": "...",
  "corrected": "...",
  "corrections": [
    { "error": "...", "correction": "...", "explanation": "..." }
  ],
  "score": 85
}`;

    const result = await callAI(systemPrompt, `Correct this: "${text}"`, { maxTokens: 1000 });

    if (!result) {
      const words = text.split(' ');
      const corrected = text.charAt(0).toUpperCase() + text.slice(1);
      return res.json({
        original: text,
        corrected: corrected.endsWith('.') || corrected.endsWith('?') || corrected.endsWith('!') ? corrected : corrected + '.',
        corrections: [{ error: 'Auto-capitalization', correction: 'First letter capitalized', explanation: 'Mock response — set OPENAI_API_KEY or GEMINI_API_KEY for AI corrections.' }],
        score: 100,
      });
    }

    const parsed = extractJSON(result);
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message, original: req.body.text, corrected: req.body.text, corrections: [], score: 100 });
  }
});

module.exports = router;
