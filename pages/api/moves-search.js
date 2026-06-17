import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { moveName, moveDesc } = req.body;
  if (!moveName) return res.status(400).json({ error: 'moveName required' });

  try {
    const query = [moveName, moveDesc].filter(Boolean).join(' — ');

    const embedResp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const vector = embedResp.data[0].embedding;

    const index = pinecone.index(
      process.env.PINECONE_INDEX,
      process.env.PINECONE_HOST
    );

    const queryResp = await index.query({
      vector,
      topK: 10,
      includeMetadata: true,
      filter: { type: { $in: ['article', 'podcast', 'whitepaper'] } },
    });

    const matches = (queryResp.matches || [])
      .filter(m => m.score > 0.25)
      .slice(0, 3)
      .map(m => ({
        title: m.metadata?.title || m.id,
        url: m.metadata?.url || '',
        type: m.metadata?.type || 'article',
      }));

    return res.status(200).json({ matches });
  } catch (err) {
    console.error('[/api/moves-search]', err);
    return res.status(500).json({ error: err.message });
  }
}
