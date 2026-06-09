import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      messages: [{
        role: 'user',
        content: `Rewrite this search query as a concise 3-7 word semantic search phrase for a K-12 education content database. Strip conversational language. Preserve the core topic and any named people, series, or content types (podcast, interview, article, whitepaper). Return ONLY the rewritten phrase, nothing else.\n\nQuery: ${query}`
      }]
    });

    const rewritten = msg.content[0]?.text?.trim() || query;

    // Detect podcast intent signals
    const lower = query.toLowerCase();
    const podcastSignals = [
      'hear from','listen','podcast','episode','interview','talk with',
      'conversation with','founder','founders','voices','spoke with',
      'in conversation','on the show','audio'
    ];
    const podcastIntent = podcastSignals.some(s => lower.includes(s));

    return res.status(200).json({ rewritten, podcastIntent });
  } catch (err) {
    console.error('[/api/rewrite]', err);
    return res.status(500).json({ error: err.message });
  }
}
