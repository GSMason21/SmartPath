import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are a content strategist for GettingSmart.com, a K-12 education thought leadership platform. You have retrieved articles, podcasts, and whitepapers from the Getting Smart content library relevant to a user query.

Write ONE short paragraph (2-3 sentences) that orients the learner to this topic in the Getting Smart context. Be warm and specific — name what's at stake and why Getting Smart covers it.

Then extract 3-5 key themes from the retrieved content. Each theme should be a short label (2-5 words) paired with a real URL from the retrieved content that best represents that theme. Only use URLs that appear in the [URL:] fields of the retrieved content — never invent URLs.

Then generate exactly 3 focus options to help the user choose a module direction. Each option represents a meaningfully different angle on the topic.

Return ONLY valid JSON, no markdown fences:
{
  "summary": "One short paragraph here.",
  "themes": [
    { "label": "Theme label", "url": "https://real-url-from-content" },
    { "label": "Theme label", "url": "https://real-url-from-content" }
  ],
  "options": [
    { "title": "Short title", "description": "One sentence describing this angle" },
    { "title": "Short title", "description": "One sentence describing this angle" },
    { "title": "Short title", "description": "One sentence describing this angle" }
  ]
}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { query, context } = req.body;
  if (!query || !context) return res.status(400).json({ error: 'query and context required' });

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `User query: "${query}"\n\nRetrieved Getting Smart content:\n${context}\n\nWrite the short summary, key themes with real URLs, and 3 focus options as JSON.`
      }]
    });

    const raw = (msg.content[0]?.text || '').trim().replace(/^```json|^```|```$/g, '').trim();
    const data = JSON.parse(raw);

    return res.status(200).json(data);
  } catch (err) {
    console.error('[/api/summarize]', err);
    return res.status(500).json({ error: err.message });
  }
}
