const express = require('express');
const router = express.Router();
const { callAI, extractJSON } = require('../utils/aiHelper');

const FALLBACK_WORDS = [
  { word: 'Ephemeral', definition: 'Lasting for a very short time', pronunciation: '/ɪˈfem.ər.əl/', example: 'The beauty of cherry blossoms is ephemeral.', synonyms: ['brief', 'transient', 'fleeting'], partOfSpeech: 'adjective' },
  { word: 'Eloquent', definition: 'Fluent or persuasive in speaking or writing', pronunciation: '/ˈel.ə.kwənt/', example: 'She gave an eloquent speech at the ceremony.', synonyms: ['articulate', 'fluent', 'expressive'], partOfSpeech: 'adjective' },
  { word: 'Resilient', definition: 'Able to recover quickly from difficulties', pronunciation: '/rɪˈzɪl.i.ənt/', example: 'Children are often more resilient than adults.', synonyms: ['tough', 'adaptable', 'flexible'], partOfSpeech: 'adjective' },
  { word: 'Ambiguous', definition: 'Open to more than one interpretation', pronunciation: '/æmˈbɪɡ.ju.əs/', example: 'The ending of the movie was deliberately ambiguous.', synonyms: ['unclear', 'vague', 'uncertain'], partOfSpeech: 'adjective' },
  { word: 'Empathy', definition: 'The ability to understand others feelings', pronunciation: '/ˈem.pə.θi/', example: 'A good leader shows empathy toward their team.', synonyms: ['compassion', 'understanding', 'sympathy'], partOfSpeech: 'noun' },
];

let wordIndex = 0;

router.get('/', async (req, res) => {
  try {
    const { level } = req.query;

    const systemPrompt = `You are a vocabulary teacher. Generate a single English vocabulary word for a ${level || 'intermediate'} learner.
Return JSON only with this structure:
{
  "word": "...",
  "definition": "...",
  "pronunciation": "...",
  "example": "...",
  "synonyms": ["...", "..."],
  "partOfSpeech": "..."
}`;

    const result = await callAI(systemPrompt, 'Give me a useful English word to learn today.', { maxTokens: 300, temperature: 0.9 });

    if (!result) {
      const word = FALLBACK_WORDS[wordIndex % FALLBACK_WORDS.length];
      wordIndex++;
      return res.json(word);
    }

    const parsed = extractJSON(result);
    res.json(parsed);
  } catch (e) {
    const word = FALLBACK_WORDS[wordIndex % FALLBACK_WORDS.length];
    wordIndex++;
    res.json(word);
  }
});

router.post('/quiz', async (req, res) => {
  try {
    const { word } = req.body;
    const systemPrompt = `Generate a multiple choice quiz for the word "${word}".
Return JSON only:
{
  "word": "${word}",
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "correctIndex": 0
}`;

    const result = await callAI(systemPrompt, 'Create a vocabulary quiz question.', { maxTokens: 300 });

    if (!result) {
      return res.json({
        word,
        question: `What does "${word}" mean?`,
        options: ['Meaning A', 'Meaning B', 'Meaning C', 'Meaning D'],
        correctIndex: 0,
      });
    }

    const parsed = extractJSON(result);
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
