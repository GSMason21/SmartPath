import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are a content strategist for GettingSmart.com, a K-12 education thought leadership platform. You have retrieved articles, podcasts, and whitepapers from the Getting Smart content library relevant to a user query.

Write a rich 3-paragraph editorial summary giving the user a genuine sense of the BREADTH and DEPTH of Getting Smart content on this topic. Each paragraph covers a distinct dimension. Be specific — reference actual content types, themes, and perspectives found in the retrieved content. Write in a warm, authoritative editorial voice.

Then generate exactly 3 focus options to help the user narrow their learning path. Each option represents a meaningfully different angle.

Return ONLY valid JSON, no markdown fences:
{
  "summary": ["paragraph 1", "paragraph 2", "paragraph 3"],
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
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `User query: "${query}"\n\nRetrieved Getting Smart content:\n${context}\n\nWrite the 3-paragraph summary and 3 focus options as JSON.`
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
