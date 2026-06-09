/**
 * POST /api/index-post
 * 
 * Receives a webhook from WordPress when a post is published or updated.
 * Fetches full post content, embeds it, and upserts into Pinecone.
 * Also invalidates the related posts cache for this post.
 * 
 * Secured with a shared secret (WEBHOOK_SECRET env var).
 */

import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const WP_BASE = 'https://www.gettingsmart.com/wp-json/wp/v2';

// Map WordPress post type to our type label and ID prefix
const POST_TYPE_CONFIG = {
  post:       { label: 'article',    prefix: '',            endpoint: 'posts' },
  episode:    { label: 'podcast',    prefix: 'podcast-',    endpoint: 'episode' },
  page:       { label: 'page',       prefix: 'page-',       endpoint: 'pages' },
  whitepaper: { label: 'whitepaper', prefix: 'whitepaper-', endpoint: 'whitepaper' },
};

function stripHtml(html = '') {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '...')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchPost(postType, postId) {
  const config = POST_TYPE_CONFIG[postType];
  if (!config) throw new Error(`Unknown post type: ${postType}`);

  const url = `${WP_BASE}/${config.endpoint}/${postId}?_fields=id,title,content,excerpt,date,link`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`WP API error ${res.status} for ${postType}/${postId}`);
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Verify webhook secret
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    console.warn('[/api/index-post] Unauthorized request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { post_id, post_type = 'post', post_status } = req.body;

  if (!post_id) return res.status(400).json({ error: 'post_id required' });

  // Only index published posts
  if (post_status && post_status !== 'publish') {
    return res.status(200).json({ message: `Skipped — status is ${post_status}` });
  }

  const config = POST_TYPE_CONFIG[post_type];
  if (!config) return res.status(400).json({ error: `Unsupported post type: ${post_type}` });

  try {
    console.log(`[/api/index-post] Indexing ${post_type} ${post_id}...`);

    // 1. Fetch post from WordPress
    const post = await fetchPost(post_type, post_id);

    const title   = stripHtml(post.title?.rendered || '');
    const content = stripHtml(post.content?.rendered || '');
    const excerpt = stripHtml(post.excerpt?.rendered || '');
    const url     = post.link || '';
    const date    = post.date || '';

    if (!title && !content) {
      return res.status(200).json({ message: 'Post has no content — skipped' });
    }

    // 2. Embed the post
    const textToEmbed = `${title}\n\n${content}`.slice(0, 6000);
    const embedResp   = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: textToEmbed,
    });
    const vector = embedResp.data[0].embedding;

    // 3. Upsert into Pinecone
    const index  = pinecone.index(process.env.PINECONE_INDEX, process.env.PINECONE_HOST);
    const pineconeId = `${config.prefix}${post_id}`;

    await index.upsert({
      records: [{
        id:     pineconeId,
        values: vector,
        metadata: {
          title,
          excerpt:  excerpt.slice(0, 500),
          content:  content.slice(0, 4000),
          url,
          date,
          type:     config.label,
        },
      }]
    });

    console.log(`[/api/index-post] Upserted ${pineconeId} — "${title}"`);

    // 4. Pre-compute related posts and cache them in WP post meta
    // Fire and forget — don't block the response
    cacheRelatedPosts(post_id, post_type, vector).catch(err =>
      console.error('[/api/index-post] Related posts cache error:', err)
    );

    return res.status(200).json({
      success: true,
      id:      pineconeId,
      title,
      type:    config.label,
    });

  } catch (err) {
    console.error('[/api/index-post]', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Query Pinecone for related posts and write them back to WordPress post meta
 * via the REST API — equivalent to what gs-pinecone-related plugin does on publish.
 */
async function cacheRelatedPosts(postId, postType, vector) {
  const index = pinecone.index(process.env.PINECONE_INDEX, process.env.PINECONE_HOST);

  const results = await index.query({
    vector,
    topK: 5,
    includeMetadata: true,
    filter: { type: { $eq: 'article' } }, // related posts are articles only
  });

  // Filter out the post itself
  const config    = POST_TYPE_CONFIG[postType];
  const selfId    = `${config.prefix}${postId}`;
  const relatedIds = (results.matches || [])
    .filter(m => m.id !== selfId && m.score > 0.4)
    .slice(0, 4)
    .map(m => m.id);

  if (relatedIds.length === 0) return;

  // Write back to WordPress via REST API
  const wpUrl  = `https://www.gettingsmart.com/wp-json/wp/v2/posts/${postId}`;
  const wpResp = await fetch(wpUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(
        `${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`
      ).toString('base64'),
    },
    body: JSON.stringify({
      meta: { _gs_related_ids: relatedIds.join(',') }
    }),
  });

  if (wpResp.ok) {
    console.log(`[cacheRelatedPosts] Cached ${relatedIds.length} related posts for ${postId}`);
  } else {
    const err = await wpResp.text();
    console.error('[cacheRelatedPosts] WP write failed:', err);
  }
}
