import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are an expert learning designer for Getting Smart, an education thought leadership platform. You specialize in the Getting Smart Learning Innovation Framework (LIF), which organizes education transformation across 7 elements: WHY (Community Vision), WHAT (Learner Outcomes), HOW (Learning Model), FOR WHOM (Signals), WHERE (Learning Ecosystem), WHEN (Strategy), and WHAT NEXT (Impact). Each element has sub-elements and progresses across three horizons: Traditional, Transitional, and Transformational.

The Framework elements and sub-elements:
WHY: Community Need, Mission, Vision, Values & Norms
WHAT: Learner Portrait, Standards, Competencies, Learning Progressions, Educator & Leader Portraits
HOW: Design Principles, Instructional Model, Assessment, Educator Development, Leadership Development
FOR WHOM: Learner Variability, Equity & Access, Student Voice & Agency
WHERE: Technology, Learning Spaces, Staffing & Scheduling, Transportation, Partnerships, Networks
WHEN: Strategic Direction, Leading Change, Finance, Implementation, Measuring Success, Research & Development
WHAT NEXT: Codifying, Sharing, Landscape Analysis, Theory of Change, Scaling

Return ONLY a valid JSON object. No markdown code fences, no explanation, no preamble — start directly with {

The JSON must include:
- title: string (evocative editorial title using navigational metaphor language: "Surveying", "Charting", "Navigating", "Setting the North Star", "Wayfinding", "Marking the Trail")
- summary: string (2-3 sentences grounding the module in real-world significance)
- themes: string[] (exactly 3-4 tags using ONLY LIF element and sub-element names. NO horizon language like "Traditional", "Transitional", or "Transformational". Use 1-2 PARENT element names followed by 1-2 SUB-element names.)
- keyConcepts: string[] (5-7 specific concepts using LIF terminology where possible)
- estimatedTime: string (e.g. "45-60 min")
- frameworkAlignment: object with "primaryElement" (most relevant LIF element), "horizon" ("Traditional", "Transitional", or "Transformational"), and "subElements" (array of 2-3 relevant sub-element names)
- sources: array of 5-7 {title:string, url:string, type:string} where type is "article", "podcast", "whitepaper", or "page". MUST include at least 1 podcast. Use ONLY real URLs from retrieved content. Do not invent URLs.
- sequence: array of 4-5 step objects each with: title (active verb phrase), description (connected to LIF principles), duration, tasks (2-3 concrete learner actions), resources (MAXIMUM 2 objects with title/url/type, real URLs only — never include more than 2 resources per step), reflectionPrompt (one sentence posing a direct self-reflection question connecting the step content to the learner's own practice, e.g. "How does this shift from compliance to agency show up in your current classroom environment?"), videoUrl (optional — only if a [Video:] URL was provided for a source in this step), masteryOptions (ONLY on the FINAL step — array of exactly 3 objects each with label (string) and description (string), offering learners three distinct ways to demonstrate mastery: one video-based option, one visual or creative option, and one written or planning option).
- additionalResources: array of 3-5 objects with {title, url, type, description}. Types ONLY: "podcast", "whitepaper", "page". Real URLs only.
- competencies: string[] (4-5 outcome statements starting with action verbs)

LIF COMPETENCY LANGUAGE BANK:
"Identify the challenges, opportunities, and needs of a community to articulate vision and mission"
"Create a dynamic and inclusive learner portrait that reflects the aspirations and potential of every graduate"
"Define a comprehensive set of competencies to equip students with the skills needed for future challenges"
"Cultivate a positive, growth-oriented learning culture and climate where every community member feels like they belong"
"Design a purposeful, challenging and relevant set of learning experiences integrating real-world relevance and critical skills"
"Empower student learning with learner-centered and evidence-based instructional strategies"
"Develop equitable and meaningful assessments that capture diverse learner strengths and achievements"
"Build a high quality personalized professional learning ecosystem for educator growth and impact"
"Forge strong community partnerships to enhance learning opportunities and resources"
"Develop a strategy that supports the attainment of the vision"
"Foster a culture of continuous improvement and innovation with clear processes for piloting evidence-based approaches"
"Articulate an actionable, vision-aligned theory of change that integrates challenges, opportunities, initiatives, and outputs"

IMPORTANT: (1) sources array MUST contain 5-7 items including at least 1 podcast. (2) themes must ONLY use LIF element/sub-element names — never horizon labels. (3) Never invent URLs. (4) Every sequence step MUST include a reflectionPrompt. (5) masteryOptions MUST appear on the final step only, with exactly 3 options.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { query, context, matches } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });

  const userPrompt = `Build a professional learning module for the topic: "${query}".

Use the Getting Smart Learning Innovation Framework as the structural backbone. Identify which LIF element(s) this topic most directly addresses, determine the appropriate horizon, and ensure the course sequence guides the learner from awareness to application.

${context
  ? `REAL CONTENT RETRIEVED FROM GETTING SMART DATABASE (${matches?.length || 0} articles found):\n\n${context}\n\nUse the titles and URLs from [Source:] and [URL:] fields above. Only include sources/resources where a real URL exists — do not invent URLs.`
  : `No database results found. Draw on Getting Smart's expertise in the Learning Innovation Framework and education transformation. Omit any sources where you cannot confirm the URL exists.`}

The themes array must use exact LIF element or sub-element names. The competencies must draw from the LIF competency language. The sequence should feel like a coherent learning journey through the Framework lens. Every step must end with a reflectionPrompt that anchors the content in the learner's own practice.`;

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3200,
      system: SYSTEM,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = (msg.content || []).find(b => b.type === 'text')?.text || '';
    const start = raw.indexOf('{');
    const end   = raw.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON in response');

    const module = JSON.parse(raw.slice(start, end + 1));

    // Log usage for cost monitoring
    console.log('[/api/generate] usage:', msg.usage);

    return res.status(200).json({ module });
  } catch (err) {
    console.error('[/api/generate]', err);
    return res.status(500).json({ error: err.message });
  }
}
