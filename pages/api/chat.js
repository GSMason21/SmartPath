import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone  = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const RECENCY_CUTOFF = new Date('2021-01-01').getTime();
const OLDEST         = new Date('2010-01-01').getTime();

const SYSTEM = `You are Ask GS, a research assistant for GettingSmart.com — a leading K-12 education thought leadership platform. You embody the voice and sensibility of Getting Smart's editorial work: intellectually curious, grounded in evidence, and genuinely optimistic about what schools can become without being naive about how hard change is.

Your tone is collegial and direct — like a well-read colleague who has thought carefully about these ideas and isn't afraid to have a point of view. You don't just summarize research; you wrestle with it. You'll introduce a finding and immediately interrogate it: what does it actually mean? What does it leave out? Where does conventional wisdom get it wrong?

You are specific and evidence-forward. You cite studies, reports, and frameworks naturally — in passing, the way someone who reads widely does — without making the conversation feel like a literature review. The evidence supports your thinking; it doesn't replace it.

You are optimistic but honest. You believe deeply that learning innovation matters and that young people deserve schools designed around their potential. But you're candid about the gaps between vision and reality — the enrollment pressures, the structural barriers, the long tail of implementation that funders and leaders too often abandon.

You draw from Getting Smart's content library — articles, podcasts, whitepapers — and reference them specifically by name when they're relevant. You don't fabricate sources or URLs.

When you reference a specific article, podcast, or whitepaper from the retrieved content, link it inline using markdown: [Article Title](url). Use the exact title and URL from the [Source:] and [URL:] fields in the retrieved content. Only link sources where a real URL was provided — never invent a URL. Links should feel natural in the prose, not bolted on.

When you mention a specific school by name, link it to its Getting Smart school profile using the format: [School Name](https://www.gettingsmart.com/school/school-name-slug). Convert the school name to a URL slug by lowercasing and replacing spaces and special characters with hyphens (e.g. "High Tech High" → https://www.gettingsmart.com/school/high-tech-high). Only do this for schools you are confident have a Getting Smart profile — schools that appear in the retrieved content are likely to have one.

Keep responses conversational and focused. This is a dialogue, not a report. Aim for depth over breadth — one well-developed idea is worth more than five bullet points. End naturally, sometimes with a question or an invitation to go deeper, the way a good conversation does.`;


async function retrieveContext(query, podcastIntent) {
  // Rewrite query for better retrieval
  const rewriteMsg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 60,
    messages: [{
      role: 'user',
      content: `Rewrite as a concise 3-7 word semantic search phrase for a K-12 education content database. Return ONLY the phrase.\n\nQuery: ${query}`
    }]
  });
  const semanticQuery = rewriteMsg.content[0]?.text?.trim() || query;

  // Embed
  const embedResp = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: semanticQuery,
  });
  const vector = embedResp.data[0].embedding;

  // Query Pinecone
  const index = pinecone.index(process.env.PINECONE_INDEX, process.env.PINECONE_HOST);
  const queryResp = await index.query({
    vector,
    topK: podcastIntent ? 20 : 12,
    includeMetadata: true,
  });

  // Score and rank
  const NOW = Date.now();
  const matches = (queryResp.matches || [])
    .filter(m => m.score > 0.3)
    .map(m => {
      const date  = m.metadata?.date ? new Date(m.metadata.date).getTime() : 0;
      const type  = m.metadata?.type || 'article';
      const recencyScore = date ? Math.max(0, (date - OLDEST) / (NOW - OLDEST)) : 0.3;
      const recencyBoost = date >= RECENCY_CUTOFF ? 0.5 : 0;
      const typeBoost    = podcastIntent && type === 'podcast' ? 0.4 : 0;
      const combinedScore = m.score + (recencyBoost * m.score) + (recencyScore * 0.1) + (typeBoost * m.score);
      return { ...m, combinedScore };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, 8); // top 8 for chat context

  const context = matches.map(m => {
    const meta  = m.metadata || {};
    const text  = meta.content || meta.excerpt || meta.text || '';
    const url   = meta.url || '';
    const type  = meta.type || 'article';
    const title = meta.title || m.id;
    const date  = meta.date ? meta.date.slice(0, 10) : '';
    return `[Source: ${title}] [URL: ${url}] [Type: ${type}] [Date: ${date}]\n${text}`;
  }).join('\n\n');

  return { context, matches, semanticQuery };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages, query, pageContext } = req.body;
  if (!messages || !query) return res.status(400).json({ error: 'messages and query required' });

  // Set up streaming headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Detect podcast intent
    const lower = query.toLowerCase();
    const podcastSignals = ['hear from','listen','podcast','episode','interview','talk with','conversation with','founder','founders','voices','audio'];
    const podcastIntent = podcastSignals.some(s => lower.includes(s));

    // Retrieve context
    const { context, matches, semanticQuery } = await retrieveContext(query, podcastIntent);
    console.log(`[/api/chat] query="${query}" semantic="${semanticQuery}" matches=${matches.length}`);

    // Send sources to client before streaming starts
    const sources = matches.slice(0, 5).map(m => ({
      title: m.metadata?.title || '',
      url:   m.metadata?.url   || '',
      type:  m.metadata?.type  || 'article',
      date:  m.metadata?.date  ? m.metadata.date.slice(0, 10) : '',
    }));
    res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);

    // Build dynamic system prompt — inject page context if available
    const contextNote = pageContext?.url
      ? `\n\nCurrent page context: The user is reading "${pageContext.title}" at ${pageContext.url}. If their question relates to this content, acknowledge it naturally and use it to inform your response.`
      : '';
    const dynamicSystem = SYSTEM + contextNote;

    // Build conversation history for Claude
    const chatHistory = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Add context to the latest user message
    const lastUserIdx = chatHistory.length - 1;
    chatHistory[lastUserIdx] = {
      role: 'user',
      content: `${query}\n\n---\nRelevant Getting Smart content:\n${context || 'No specific content retrieved — answer from general knowledge about education innovation.'}`
    };

    // Stream Claude response
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: dynamicSystem,
      messages: chatHistory,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ type: 'text', text: chunk.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (err) {
    console.error('[/api/chat]', err);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    res.end();
  }
}
