import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `A visitor is reading a Getting Smart article titled "${title}". Write 4 short questions they might ask a research assistant about education innovation related to this topic. Return ONLY a valid JSON array of 4 question strings, nothing else.`,
    }],
  });

  try {
    const raw = msg.content[0].text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const questions = JSON.parse(raw);
    res.json({ questions });
  } catch {
    res.status(500).json({ error: 'parse error' });
  }
}
