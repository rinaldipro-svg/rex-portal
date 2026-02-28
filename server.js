const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ===== ERROR HANDLING =====
class APIError extends Error {
    constructor(message, statusCode = 500, details = {}) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}

const handleError = (res, error) => {
    console.error('Error:', error);
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    res.status(statusCode).json({ error: { message, details: error.details || {} } });
};

// ===== CLAUDE (ANTHROPIC) API =====
async function generateWithClaude(userInput) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new APIError('ANTHROPIC_API_KEY not configured', 500);

    const systemPrompt = `Tu es un ingénieur senior expert en rédaction technique travaillant pour Hydro-Québec. 
Transformer des notes brutes en compte-rendu technique formel (Dossier REX) respectant la "Doctrine Hydro-Québec".
Le ton doit être souverain, axé sur la pérennité, la réduction des risques (dé-risquage), et la sécurité absolue (Tolérance Zéro).
Consignes strictes :
- Très concis (1-2 phrases par champ max).
- Génère obligatoirement un code UNSPSC pertinent.
- Invente un contexte hydroélectrique plausible si informations manquantes.

Réponds UNIQUEMENT en JSON valide (sans backticks) avec cette structure:
{
  "titre": "REX 0X : ...",
  "infrastructure": "...",
  "unspsc_code": "...",
  "unspsc_desc": "...",
  "localisation": "...",
  "contrainte": "...",
  "environnement": "...",
  "lignerouge": "...",
  "technologie": "...",
  "ingenierie": "...",
  "securite": "...",
  "metrique1_val": "...",
  "metrique1_titre": "...",
  "metrique1_desc": "...",
  "metrique2_val": "...",
  "metrique2_titre": "...",
  "metrique2_desc": "...",
  "metrique3_val": "...",
  "metrique3_titre": "...",
  "metrique3_desc": "...",
  "citation": "...",
  "auteur": "..."
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-opus-4-5-20251101',
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{ role: 'user', content: userInput }]
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new APIError(
            error.error?.message || 'Claude API Error',
            response.status,
            error
        );
    }

    const data = await response.json();
    let textContent = data.content?.[0]?.text;
    if (!textContent) throw new APIError('Empty response from Claude API', 500);

    textContent = textContent.replace(/^```json|^```|```$/gm, '').trim();
    return JSON.parse(textContent);
}

// ===== GEMINI API =====
async function generateWithGemini(userInput, apiKey) {
    if (!apiKey) throw new APIError('Google API Key required', 400);

    const systemPrompt = `Tu es un ingénieur senior expert en rédaction technique travaillant pour Hydro-Québec.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2-0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: userInput }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { responseMimeType: 'application/json' }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new APIError(
            error.error?.message || 'Gemini API Error',
            response.status,
            error
        );
    }

    const data = await response.json();
    let textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) throw new APIError('Empty response from Gemini API', 500);

    textContent = textContent.replace(/^```json|^```|```$/gm, '').trim();
    return JSON.parse(textContent);
}

// ===== API ENDPOINTS =====

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generate REX with Claude (recommended)
app.post('/api/generate-claude', async (req, res) => {
    try {
        const { userInput } = req.body;
        if (!userInput) throw new APIError('Missing userInput', 400);

        const result = await generateWithClaude(userInput);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error);
    }
});

// Generate REX with Gemini
app.post('/api/generate-gemini', async (req, res) => {
    try {
        const { userInput, apiKey } = req.body;
        if (!userInput) throw new APIError('Missing userInput', 400);
        if (!apiKey) throw new APIError('Missing apiKey', 400);

        const result = await generateWithGemini(userInput, apiKey);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Ensure ANTHROPIC_API_KEY is set in .env file`);
});
