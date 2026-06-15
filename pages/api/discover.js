import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import Anthropic from '@anthropic-ai/sdk';

const embedder  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone  = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SEEDS = [
  'community vision and mission for schools',
  'school values culture transformation',
  'learner portrait graduate profile outcomes',
  'competency-based education student skills',
  'personalized learning progressions mastery',
  'project-based learning instructional design',
  'innovative assessment mastery learning',
  'educator professional development coaching',
  'instructional leadership principal development',
  'learner variability universal design for learning',
  'equity and access underserved students schools',
  'student voice agency empowerment ownership',
  'flexible learning spaces school design',
  'education technology tools student engagement',
  'community partnerships school improvement',
  'microschools learning pods alternative education',
  'strategic planning school transformation change',
  'school finance innovation funding models',
  'scaling education innovation systems change',
  'research and development learning outcomes',
  'theory of change school improvement',
  'AI artificial intelligence K-12 education',
  'future of work skills workforce readiness',
  'social emotional learning wellbeing',
  'blended hybrid learning models',
  'school redesign innovation models',
  'early childhood learning development',
  'STEM maker spaces hands-on learning',
  'deeper learning student engagement rigor',
  'career connected learning pathways',
];

const VALID_LIF = new Set(['WHY', 'WHAT', 'HOW', 'FOR WHOM', 'WHERE', 'WHEN', 'WHAT NEXT']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { seen = [] } = req.body;

  try {
    const seed = SEEDS[Math.floor(Math.random() * SEEDS.length)];

    const embedResp = await embedder.embeddings.create({
      model: 'text-embedding-3-small',
      input: seed,
    });
    const vector = embedResp.data[0].embedding;

    const index = pinecone.index(process.env.PINECONE_INDEX, process.env.PINECONE_HOST);
    const queryResp = await index.query({ vector, topK: 25, includeMetadata: true });

    let candidates = (queryResp.matches || []).filter(m => m.score > 0.25 && m.metadata?.url);
    const fresh = candidates.filter(m => !seen.includes(m.id));
    if (fresh.length > 0) candidates = fresh;

    if (!candidates.length) return res.status(404).json({ error: 'No resources found' });

    const pool = candidates.slice(0, 10);
    const match = pool[Math.floor(Math.random() * pool.length)];
    const meta  = match.metadata || {};

    const title = meta.title || 'Untitled';
    const url   = meta.url   || '';
    const type  = meta.type  || 'article';
    const date  = meta.date  ? meta.date.slice(0, 7) : '';
    const text  = (meta.content || meta.excerpt || meta.text || '').slice(0, 600);

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `You are a content curator for Getting Smart, a K-12 education innovation platform.

Title: ${title}
Type: ${type}
Excerpt: ${text}

Write a punchy 2-sentence description of what this resource covers and why it matters to educators.
Then identify the single most relevant Learning Innovation Framework element from exactly these options: WHY, WHAT, HOW, FOR WHOM, WHERE, WHEN, WHAT NEXT

Return ONLY valid JSON with no preamble: {"description":"...","lifElement":"HOW"}`
      }]
    });

    let description = `Explore this ${type} from Getting Smart's content library.`;
    let lifElement  = 'HOW';
    try {
      const raw   = msg.content[0]?.text?.trim() || '';
      const start = raw.indexOf('{');
      const end   = raw.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const parsed = JSON.parse(raw.slice(start, end + 1));
        if (parsed.description) description = parsed.description;
        if (parsed.lifElement && VALID_LIF.has(parsed.lifElement)) lifElement = parsed.lifElement;
      }
    } catch {}

    return res.status(200).json({ id: match.id, title, url, type, date, description, lifElement });
  } catch (err) {
    console.error('[/api/discover]', err);
    return res.status(500).json({ error: err.message });
  }
}
