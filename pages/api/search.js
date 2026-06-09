import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const RECENCY_CUTOFF = new Date('2021-01-01').getTime();
const OLDEST         = new Date('2010-01-01').getTime();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { query, podcastIntent = false, topK = 15 } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });

  try {
    // 1. Embed the query
    const embedResp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const vector = embedResp.data[0].embedding;

    // 2. Query Pinecone
    const index = pinecone.index(
      process.env.PINECONE_INDEX,
      process.env.PINECONE_HOST
    );
    const queryResp = await index.query({
      vector,
      topK: podcastIntent ? 25 : topK,
      includeMetadata: true,
    });

    // 3. Score with recency + type boost
    const NOW = Date.now();
    const matches = (queryResp.matches || [])
      .filter(m => m.score > 0.3)
      .map(m => {
        const date  = m.metadata?.date ? new Date(m.metadata.date).getTime() : 0;
        const type  = m.metadata?.type || 'article';
        const recencyScore = date ? Math.max(0, (date - OLDEST) / (NOW - OLDEST)) : 0.3;
        const recencyBoost = date >= RECENCY_CUTOFF ? 0.5 : 0;
        const typeBoost    = podcastIntent && type === 'podcast' ? 0.4 : 0;
        const combinedScore = m.score
          + (recencyBoost * m.score)
          + (recencyScore * 0.1)
          + (typeBoost * m.score);
        return { ...m, combinedScore };
      })
      .sort((a, b) => b.combinedScore - a.combinedScore);

    // 4. Build context string for Claude
    const context = matches.map(m => {
      const meta  = m.metadata || {};
      const text  = meta.content || meta.excerpt || meta.text || '';
      const url   = meta.url || '';
      const type  = meta.type || 'article';
      const title = meta.title || m.id;
      const date  = meta.date ? meta.date.slice(0, 10) : '';
      const ytMatch = text.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
      const ytId    = ytMatch?.[1] || '';
      const videoUrl = ytId ? `https://www.youtube.com/embed/${ytId}` : '';
      return `[Source: ${title}] [URL: ${url}] [Type: ${type}] [Date: ${date}]${videoUrl ? ` [Video: ${videoUrl}]` : ''}\n${text}`;
    }).join('\n\n');

    return res.status(200).json({ matches, context, count: matches.length });
  } catch (err) {
    console.error('[/api/search]', err);
    return res.status(500).json({ error: err.message });
  }
}
