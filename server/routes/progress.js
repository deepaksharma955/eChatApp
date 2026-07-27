const express = require('express');
const router = express.Router();
const { callAI } = require('../utils/aiHelper');

router.get('/insights', async (req, res) => {
  try {
    const { data } = req.query;
    if (!data) return res.status(400).json({ error: 'Progress data is required' });

    const systemPrompt = `You are a learning analytics coach. Analyze the user's English learning progress data.
Return JSON only with this structure:
{
  "summary": "...",
  "strengthAreas": ["...", "..."],
  "weakAreas": ["...", "..."],
  "recommendations": ["...", "..."],
  "nextMilestone": "..."
}`;

    const result = await callAI(systemPrompt, `Progress data: ${data}`, { maxTokens: 400 });

    if (!result) {
      return res.json({
        summary: 'You are making consistent progress in your English learning journey.',
        strengthAreas: ['Vocabulary', 'Reading comprehension'],
        weakAreas: ['Grammar', 'Speaking fluency'],
        recommendations: ['Practice speaking daily', 'Review grammar basics', 'Learn 5 new words each day'],
        nextMilestone: 'Complete 7-day speaking streak',
      });
    }

    const parsed = JSON.parse(result);
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
