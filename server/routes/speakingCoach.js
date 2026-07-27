const express = require('express');
const router = express.Router();
const { callAI } = require('../utils/aiHelper');

const TOPICS = [
  'Introduce yourself and talk about your hobbies',
  'Describe your favorite place in the world',
  'Talk about your future goals and dreams',
  'Describe a memorable travel experience',
  'Explain your daily routine in detail',
  'Talk about a book or movie you enjoyed',
  'Describe your ideal weekend',
  'Discuss a skill you want to learn',
  'Talk about someone who inspires you',
  'Describe your favorite food and how to make it',
];

router.get('/topics', (req, res) => {
  res.json({ topics: TOPICS });
});

router.post('/', async (req, res) => {
  try {
    const { text, topic } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Your speech text is required' });

    const systemPrompt = `You are an English speaking coach. Analyze the user's spoken English response.
Provide detailed feedback on:
- Grammar and vocabulary usage
- Fluency and coherence
- Suggested improvements
Return JSON only with this structure:
{
  "grammarScore": 80,
  "vocabularyScore": 75,
  "fluencyScore": 85,
  "overallScore": 80,
  "feedback": "...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "suggestedPhrases": ["...", "..."],
  "correctedVersion": "..."
}`;

    const topicContext = topic ? `\nTopic given: "${topic}"` : '';
    const result = await callAI(systemPrompt, `User's spoken response: "${text}"${topicContext}`, { maxTokens: 800 });

    if (!result) {
      return res.json({
        grammarScore: Math.floor(Math.random() * 20) + 70,
        vocabularyScore: Math.floor(Math.random() * 20) + 65,
        fluencyScore: Math.floor(Math.random() * 20) + 70,
        overallScore: Math.floor(Math.random() * 15) + 70,
        feedback: 'You communicated your ideas clearly. Try to use more varied vocabulary and check your sentence structure. (Set OPENAI_API_KEY or GEMINI_API_KEY for detailed AI analysis)',
        strengths: ['Your message was understandable', 'Good effort in expressing your thoughts'],
        improvements: ['Try using more descriptive language', 'Vary your sentence structure'],
        suggestedPhrases: ['In my opinion...', 'One thing I really enjoy is...', 'For example...'],
        correctedVersion: text,
      });
    }

    const parsed = JSON.parse(result);
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
