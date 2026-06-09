/**
 * GET /api/related-posts?post_id=123&post_type=post
 * 
 * Returns the 4 most semantically related articles for a given post.
 * First checks WordPress post meta cache (_gs_related_ids).
 * If cache is empty, queries Pinecone directly.
 */

import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const POST_TYPE_PREFIX = {
  post:       '',
  episode:    'podcast-',
  page:       'page-',
  whitepaper: 'whitepaper-',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { post_id, post_type = 'post' } = req.query;
  if (!post_id) return res.status(400).json({ error: 'post_id required' });

  try {
    const prefix    = POST_TYPE_PREFIX[post_type] || '';
    const pineconeId = `${prefix}${post_id}`;
    const index      = pinecone.index(process.env.PINECONE_INDEX, process.env.PINECONE_HOST);

    // Fetch the post's own vector
    let postVector;
    try {
      const fetchResp = await index.fetch({ ids: [pineconeId] });
      postVector = fetchResp.records?.[pineconeId]?.values;
    } catch (e) {
      console.warn(`[/api/related-posts] Post ${pineconeId} not in index yet`);
    }

    if (!postVector) {
      return res.status(404).json({ error: 'Post not indexed yet', post_id });
    }

    // Query for similar posts, excluding self
    const results = await index.query({
      vector: postVector,
      topK:   6,
      includeMetadata: true,
      filter: { type: { $eq: 'article' } },
    });

    const related = (results.matches || [])
      .filter(m => m.id !== pineconeId && m.score > 0.4)
      .slice(0, 4)
      .map(m => ({
        id:      m.id,
        title:   m.metadata?.title   || '',
        url:     m.metadata?.url     || '',
        excerpt: m.metadata?.excerpt || '',
        date:    m.metadata?.date    ? m.metadata.date.slice(0, 10) : '',
        score:   m.score,
      }));

    // Set cache headers — related posts are stable, cache for 1 hour
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json({ related, count: related.length });

  } catch (err) {
    console.error('[/api/related-posts]', err);
    return res.status(500).json({ error: err.message });
  }
}
