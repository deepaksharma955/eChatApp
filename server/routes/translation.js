const express = require('express');
const router = express.Router();
const { callAI, extractJSON } = require('../utils/aiHelper');

const LANGUAGES = [
  { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' }, { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' }, { code: 'pt', name: 'Portuguese' }, { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' }, { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' }, { code: 'hi', name: 'Hindi' }, { code: 'bn', name: 'Bengali' },
  { code: 'ur', name: 'Urdu' }, { code: 'tr', name: 'Turkish' }, { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' }, { code: 'nl', name: 'Dutch' }, { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' }, { code: 'da', name: 'Danish' }, { code: 'fi', name: 'Finnish' },
  { code: 'el', name: 'Greek' }, { code: 'he', name: 'Hebrew' }, { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' }, { code: 'cs', name: 'Czech' }, { code: 'hu', name: 'Hungarian' },
  { code: 'ro', name: 'Romanian' }, { code: 'uk', name: 'Ukrainian' },
];

router.get('/languages', (req, res) => {
  res.json(LANGUAGES);
});

router.post('/', async (req, res) => {
  try {
    const { text, from, to } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Text is required' });
    if (!to) return res.status(400).json({ error: 'Target language is required' });

    const systemPrompt = `You are a translator. Translate the given text.
Return JSON only with this structure:
{
  "translated": "...",
  "from": "...",
  "to": "...",
  "sourceText": "..."
}`;

    const fromText = from && from !== 'auto' ? ` from ${from}` : '';
    const result = await callAI(systemPrompt, `Translate${fromText} to ${to}: "${text}"`, { maxTokens: 500, temperature: 0.3 });

    if (!result) {
      return res.json({
        translated: `[Translated to ${to}]: ${text}`,
        from: from || 'auto',
        to,
        sourceText: text,
      });
    }

    const parsed = extractJSON(result);
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message, translated: req.body.text, from: req.body.from || 'auto', to: req.body.to, sourceText: req.body.text });
  }
});

module.exports = router;
