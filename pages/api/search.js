import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const WP_BASE        = 'https://www.gettingsmart.com/wp-json/wp/v2';
const RECENCY_CUTOFF = new Date('2021-01-01').getTime();
const OLDEST         = new Date('2010-01-01').getTime();
const TYPES          = ['article', 'podcast', 'whitepaper', 'page'];

// WP REST endpoint slug → Pinecone type label
const WP_TYPE_MAP = { posts: 'article', episode: 'podcast', whitepaper: 'whitepaper' };

// Run a keyword content search against WP REST for each post type in parallel.
// Returns Pinecone-shaped match objects so they slot into the same result pool.
async function wpContentSearch(query) {
  try {
    const fields = '_fields=id,title,link,excerpt,date,type';
    const results = await Promise.allSettled(
      Object.entries(WP_TYPE_MAP).map(([endpoint, type]) =>
        fetch(`${WP_BASE}/${endpoint}?search=${encodeURIComponent(query)}&per_page=5&${fields}`)
          .then(r => r.ok ? r.json() : [])
          .then(posts => (Array.isArray(posts) ? posts : []).map(p => ({
            id:    `wp-${type}-${p.id}`,
            score: 0.45,
            combinedScore: 0.45,
            metadata: {
              title:   (p.title?.rendered || '').replace(/<[^>]+>/g, ''),
              excerpt: (p.excerpt?.rendered || '').replace(/<[^>]+>/g, '').trim().slice(0, 500),
              url:     p.link || '',
              date:    p.date || '',
              type,
              content: '',
            },
          })))
      )
    );
    return results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);
  } catch {
    return [];
  }
}

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
    // 1. Embed query + run WP keyword search in parallel (WP doesn't need the vector)
    const [embedResp, wpResults] = await Promise.all([
      openai.embeddings.create({ model: 'text-embedding-3-small', input: query }),
      wpContentSearch(query),
    ]);
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

    // 4. Merge WP keyword results — append any URLs not already in Pinecone results
    const seenUrls = new Set(matches.map(m => m.metadata?.url).filter(Boolean));
    const wpUnique = wpResults.filter(r => r.metadata?.url && !seenUrls.has(r.metadata.url));
    const mergedMatches = [...matches, ...wpUnique];

    // Also insert WP-unique hits into their type buckets
    for (const hit of wpUnique) {
      const t = hit.metadata?.type;
      if (t && byType[t]) {
        const typeSeen = new Set(byType[t].map(m => m.metadata?.url));
        if (!typeSeen.has(hit.metadata.url)) byType[t] = [...byType[t], hit];
      }
    }

    // 5. Build context string for AI consumers (summarize, generate)
    const context = mergedMatches
      .slice(0, 15)
      .map(m => {
        const d = m.metadata || {};
        return `[Source: ${d.title || ''}] [URL: ${d.url || ''}] [Type: ${d.type || ''}] [Date: ${d.date || ''}]\n${d.content || d.excerpt || ''}`;
      })
      .join('\n\n');

    return res.status(200).json({ matches: mergedMatches, byType, context, count: mergedMatches.length });
  } catch (err) {
    console.error('[/api/search]', err);
    return res.status(500).json({ error: err.message });
  }
}
