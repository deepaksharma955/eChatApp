const express = require('express');
const router = express.Router();
const { callAI } = require('../utils/aiHelper');

const CHALLENGE_TYPES = ['writing', 'speaking', 'vocabulary', 'grammar', 'comprehension'];

const FALLBACK_CHALLENGES = [
  { type: 'writing', title: 'Describe Your Morning', description: 'Write 3-5 sentences describing your typical morning routine.', difficulty: 'beginner' },
  { type: 'speaking', title: 'Introduce Yourself', description: 'Record a 30-second introduction about yourself.', difficulty: 'beginner' },
  { type: 'vocabulary', title: 'Use 5 New Words', description: 'Write sentences using these words: accomplish, significant, opportunity, challenge, benefit.', difficulty: 'intermediate' },
  { type: 'grammar', title: 'Past Tense Practice', description: 'Describe what you did yesterday using past tense verbs.', difficulty: 'beginner' },
  { type: 'comprehension', title: 'Summarize a Story', description: 'Read a short story and write a 3-sentence summary.', difficulty: 'intermediate' },
];

let challengeIndex = 0;

router.get('/', async (req, res) => {
  try {
    const { level } = req.query;

    const systemPrompt = `You are an English teacher. Create a daily English challenge.
Return JSON only with this structure:
{
  "type": "writing|speaking|vocabulary|grammar|comprehension",
  "title": "...",
  "description": "...",
  "difficulty": "${level || 'intermediate'}",
  "hints": ["...", "..."]
}`;

    const result = await callAI(systemPrompt, 'Create an engaging English learning challenge for today.', { maxTokens: 400, temperature: 0.8 });

    if (!result) {
      const c = FALLBACK_CHALLENGES[challengeIndex % FALLBACK_CHALLENGES.length];
      challengeIndex++;
      return res.json(c);
    }

    const parsed = JSON.parse(result);
    res.json(parsed);
  } catch (e) {
    const c = FALLBACK_CHALLENGES[challengeIndex % FALLBACK_CHALLENGES.length];
    challengeIndex++;
    res.json(c);
  }
});

router.post('/submit', async (req, res) => {
  try {
    const { challengeType, response } = req.body;
    if (!response || !response.trim()) return res.status(400).json({ error: 'Response is required' });

    const systemPrompt = `You are an English teacher. Evaluate the student's ${challengeType || 'writing'} exercise.
Provide constructive feedback and a score out of 100.
Return JSON only with this structure:
{
  "score": 85,
  "feedback": "...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "tips": ["...", "..."]
}`;

    const result = await callAI(systemPrompt, `Student's response: "${response}"`, { maxTokens: 600 });

    if (!result) {
      return res.json({
        score: Math.floor(Math.random() * 30) + 60,
        feedback: 'Good effort! Try to use more varied vocabulary and check your grammar. (Set OPENAI_API_KEY or GEMINI_API_KEY for detailed AI feedback)',
        strengths: ['You completed the challenge', 'Your message is clear'],
        improvements: ['Try using more complex sentences', 'Expand your vocabulary'],
        tips: ['Read your response aloud to check for errors', 'Use a thesaurus to find alternative words'],
      });
    }

    const parsed = JSON.parse(result);
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
