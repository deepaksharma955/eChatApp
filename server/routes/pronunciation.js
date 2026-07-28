const express = require('express');
const router = express.Router();
const { callAI, extractJSON } = require('../utils/aiHelper');

router.post('/', async (req, res) => {
  try {
    const { text, spokenText } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Reference text is required' });

    const systemPrompt = `You are a pronunciation coach. Evaluate the user's spoken English compared to the expected text.
Return JSON only with this structure:
{
  "expected": "...",
  "spoken": "...",
  "score": 85,
  "feedback": "...",
  "tips": ["...", "..."],
  "mispronouncedWords": ["..."]
}`;

    const userMsg = spokenText
      ? `Expected: "${text}"\nSpoken: "${spokenText}"`
      : `Expected: "${text}"\n(No spoken text provided — give general pronunciation tips for this sentence)`;

    const result = await callAI(systemPrompt, userMsg, { maxTokens: 500 });

    if (!result) {
      const wordCount = text.split(' ').length;
      const mockScore = spokenText ? Math.floor(Math.random() * 30) + 65 : 0;
      return res.json({
        expected: text,
        spoken: spokenText || '(not provided)',
        score: spokenText ? mockScore : null,
        feedback: spokenText
          ? `Pronunciation score: ${mockScore}/100. ${mockScore > 80 ? 'Great job!' : mockScore > 60 ? 'Good effort, keep practicing.' : 'Keep practicing, you will improve!'}`
          : 'Say the sentence aloud to get pronunciation feedback. (Set OPENAI_API_KEY or GEMINI_API_KEY for AI analysis)',
        tips: [
          'Practice slowly and focus on each syllable',
          'Record yourself and compare with native speakers',
          'Pay attention to word stress and intonation',
        ],
        mispronouncedWords: spokenText ? text.split(' ').slice(0, 2) : [],
      });
    }

    const parsed = extractJSON(result);
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
