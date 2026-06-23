import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone  = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const RECENCY_CUTOFF = new Date('2021-01-01').getTime();
const OLDEST         = new Date('2010-01-01').getTime();

const LIF_ELEMENTS = `WHY: Community Need, Mission, Vision, Values & Norms
WHAT: Learner Portrait, Standards, Competencies, Learning Progressions, Educator & Leader Portraits
HOW: Climate and Culture, Design Principles, Learning Experience, Instruction & Facilitation, Assessment, Professional Learning
FOR WHOM: Reports, Portfolios, Transcripts, Credentials
WHERE: Technology, Learning Spaces, Staffing & Scheduling, Transportation, Partnerships, Networks
WHEN: Strategic Direction, Leading Change, Finance, Implementation, Measuring Success, Research & Development
WHAT NEXT: Codifying, Sharing, Landscape Analysis, Theory of Change, Scaling`;

const SYSTEM = `You are Ask GS, a research assistant for GettingSmart.com — a leading K-12 education thought leadership platform. You embody the voice and sensibility of Getting Smart's editorial work: intellectually curious, grounded in evidence, and genuinely optimistic about what schools can become without being naive about how hard change is.

Your tone is collegial and direct — like a well-read colleague who has thought carefully about these ideas and isn't afraid to have a point of view. You don't just summarize research; you wrestle with it. You'll introduce a finding and immediately interrogate it: what does it actually mean? What does it leave out? Where does conventional wisdom get it wrong?

You are specific and evidence-forward. You cite studies, reports, and frameworks naturally — in passing, the way someone who reads widely does — without making the conversation feel like a literature review. The evidence supports your thinking; it doesn't replace it.

You are optimistic but honest. You believe deeply that learning innovation matters and that young people deserve schools designed around their potential. But you're candid about the gaps between vision and reality — the enrollment pressures, the structural barriers, the long tail of implementation that funders and leaders too often abandon.

You draw from Getting Smart's content library — articles, podcasts, whitepapers — and reference them specifically by name when they're relevant. You don't fabricate sources or URLs.

When you reference a specific article, podcast, or whitepaper from the retrieved content, link it inline using markdown: [Article Title](url). Use the exact title and URL from the [Source:] and [URL:] fields in the retrieved content. Only link sources where a real URL was provided — never invent a URL. Links should feel natural in the prose, not bolted on.

When you mention a specific school by name, link it to its Getting Smart school profile using the format: [School Name](https://www.gettingsmart.com/school/school-name-slug). Convert the school name to a URL slug by lowercasing and replacing spaces and special characters with hyphens (e.g. "High Tech High" → https://www.gettingsmart.com/school/high-tech-high). Only do this for schools you are confident have a Getting Smart profile — schools that appear in the retrieved content are likely to have one.

You are grounded in the Getting Smart Learning Innovation Framework (LIF), which organizes education transformation across 7 elements: WHY (Community Vision), WHAT (Learner Outcomes), HOW (Learning Model), FOR WHOM (Signals), WHERE (Learning Ecosystem), WHEN (Strategy), and WHAT NEXT (Impact). When it's natural and adds clarity, connect your response to the relevant LIF element(s) — not as a formula, but as shared vocabulary that helps educators locate the idea within the broader landscape of learning innovation.

${LIF_ELEMENTS}

When citing LIF elements or sub-elements by name, always use the exact names listed above — never paraphrase, reorder, or abbreviate them (e.g. "Student Voice & Agency", not "student agency and voice").

Keep responses conversational and focused. This is a dialogue, not a report. Aim for depth over breadth — one well-developed idea is worth more than five bullet points. End naturally, sometimes with a question or an invitation to go deeper, the way a good conversation does.`;


async function retrieveContext(query, podcastIntent) {
  const rewriteMsg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 60,
    messages: [{
      role: 'user',
      content: `Rewrite as a concise 3-7 word semantic search phrase for a K-12 education content database. Return ONLY the phrase.\n\nQuery: ${query}`
    }]
  });
  const semanticQuery = rewriteMsg.content[0]?.text?.trim() || query;

  const embedResp = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: semanticQuery,
  });
  const vector = embedResp.data[0].embedding;

  const index = pinecone.index(process.env.PINECONE_INDEX, process.env.PINECONE_HOST);
  const queryResp = await index.query({
    vector,
    topK: podcastIntent ? 20 : 12,
    includeMetadata: true,
  });

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
    .slice(0, 8);

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

async function classifyLIF(query, responseText) {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Classify this education Q&A against the Getting Smart Learning Innovation Framework. Return 1-3 most relevant elements and their applicable sub-elements.

Question: ${query}

Response summary (first 300 chars): ${responseText.slice(0, 300)}

LIF elements and sub-elements:
${LIF_ELEMENTS}

Return ONLY valid JSON, no explanation:
{"tags":[{"element":"HOW","subElements":["Instruction & Facilitation","Assessment"]},{"element":"FOR WHOM","subElements":["Portfolios","Credentials"]}]}`
    }]
  });
  const raw = msg.content[0]?.text?.trim() || '';
  const start = raw.indexOf('{');
  const end   = raw.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  return JSON.parse(raw.slice(start, end + 1));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages, query, pageContext, isEmbedded } = req.body;
  if (!messages || !query) return res.status(400).json({ error: 'messages and query required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const lower = query.toLowerCase();
    const podcastSignals = ['hear from','listen','podcast','episode','interview','talk with','conversation with','founder','founders','voices','audio'];
    const podcastIntent = podcastSignals.some(s => lower.includes(s));

    const { context, matches, semanticQuery } = await retrieveContext(query, podcastIntent);
    console.log(`[/api/chat] query="${query}" semantic="${semanticQuery}" matches=${matches.length}`);

    const sources = matches.slice(0, 5).map(m => ({
      title: m.metadata?.title || '',
      url:   m.metadata?.url   || '',
      type:  m.metadata?.type  || 'article',
      date:  m.metadata?.date  ? m.metadata.date.slice(0, 10) : '',
    }));
    res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);

    const contextNote = pageContext?.url
      ? `\n\nCurrent page context: The user is reading "${pageContext.title}" at ${pageContext.url}. If their question relates to this content, acknowledge it naturally and use it to inform your response.`
      : '';
    const widgetNote = isEmbedded
      ? '\n\nYou are responding inside a compact chat widget. Keep your response to 2-3 short paragraphs maximum. Be direct and conversational — one strong idea, well expressed. If there is more to explore, end with a single focused follow-up question.'
      : '';
    const dynamicSystem = SYSTEM + contextNote + widgetNote;

    const chatHistory = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    const lastUserIdx = chatHistory.length - 1;
    chatHistory[lastUserIdx] = {
      role: 'user',
      content: `${query}\n\n---\nRelevant Getting Smart content:\n${context || 'No specific content retrieved — answer from general knowledge about education innovation.'}`
    };

    // Stream response and accumulate full text for LIF classification
    let fullText = '';
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: isEmbedded ? 400 : 1024,
      system: dynamicSystem,
      messages: chatHistory,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        fullText += chunk.delta.text;
        res.write(`data: ${JSON.stringify({ type: 'text', text: chunk.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);

    // Classify LIF alignment after stream completes (non-blocking for client)
    try {
      const lifData = await classifyLIF(query, fullText);
      if (lifData?.tags?.length) {
        res.write(`data: ${JSON.stringify({ type: 'lifTags', tags: lifData.tags })}\n\n`);
      }
    } catch (lifErr) {
      console.error('[/api/chat] LIF classification error:', lifErr);
    }

    res.end();

  } catch (err) {
    console.error('[/api/chat]', err);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    res.end();
  }
}
