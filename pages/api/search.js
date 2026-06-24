import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const RECENCY_CUTOFF = new Date('2021-01-01').getTime();
const OLDEST         = new Date('2010-01-01').getTime();
const TYPES          = ['article', 'podcast', 'whitepaper', 'page'];

function scoreMatches(matches) {
  const NOW = Date.now();
  return (matches || [])
    .filter(m => m.score > 0.3)
    .map(m => {
      const date         = m.metadata?.date ? new Date(m.metadata.date).getTime() : 0;
      const recencyScore = date ? Math.max(0, (date - OLDEST) / (NOW - OLDEST)) : 0.3;
      const recencyBoost = date >= RECENCY_CUTOFF ? 0.2 : 0;
      const combinedScore = m.score + (recencyBoost * m.score) + (recencyScore * 0.1);
      return { ...m, combinedScore };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { query, topK = 25 } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });

  try {
    // 1. Embed the query
    const embedResp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const vector = embedResp.data[0].embedding;

    const index = pinecone.index(process.env.PINECONE_INDEX, process.env.PINECONE_HOST);

    // 2. Query Pinecone in parallel — one unfiltered for "All" tab + one per content type
    const [allResp, ...typeResps] = await Promise.all([
      index.query({ vector, topK, includeMetadata: true }),
      ...TYPES.map(type =>
        index.query({ vector, topK: 10, includeMetadata: true, filter: { type: { $eq: type } } })
      ),
    ]);

    // 3. Score each result set independently
    const matches = scoreMatches(allResp.matches);
    const byType  = Object.fromEntries(
      TYPES.map((type, i) => [type, scoreMatches(typeResps[i].matches)])
    );

    // 4. Build context string for AI consumers (summarize, generate)
    const context = matches
      .slice(0, 15)
      .map(m => {
        const d = m.metadata || {};
        return `[Source: ${d.title || ''}] [URL: ${d.url || ''}] [Type: ${d.type || ''}] [Date: ${d.date || ''}]\n${d.content || d.excerpt || ''}`;
      })
      .join('\n\n');

    return res.status(200).json({ matches, byType, context, count: matches.length });
  } catch (err) {
    console.error('[/api/search]', err);
    return res.status(500).json({ error: err.message });
  }
}
