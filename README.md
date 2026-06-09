# Getting Smart Tools — Next.js App

A suite of AI-powered interactive tools for Getting Smart, built on Next.js and deployed on Vercel.

## Tools

- **SmartPath** (`/smartpath`) — AI-powered professional learning module generator grounded in the Getting Smart Learning Innovation Framework

## Setup

### 1. Clone and install

```bash
cd smartpath-app
npm install
```

### 2. Set environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Required variables:
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
PINECONE_API_KEY=pcsk_...
PINECONE_HOST=https://gettingsmart-q9kulcy.svc.aped-4627-b74a.pinecone.io
PINECONE_INDEX=gettingsmart
```

### 3. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`

## Deploy to Vercel

### First deploy

```bash
npm install -g vercel
vercel deploy
```

### Set environment variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add all five variables from `.env.example`.

### Connect subdomain

In Vercel → Project → Settings → Domains, add `tools.gettingsmart.com`.

Then in your DNS provider (you manage this), add:
```
CNAME  tools  cname.vercel-dns.com
```

## API Routes

All AI and database calls happen server-side — API keys are never exposed to the browser.

| Route | Purpose |
|-------|---------|
| `POST /api/rewrite` | Rewrites user query via Claude Haiku, detects podcast intent |
| `POST /api/search` | Embeds query, queries Pinecone with recency + type boost |
| `POST /api/summarize` | Generates 3-paragraph topic summary + 3 focus options |
| `POST /api/generate` | Builds full learning module JSON via Claude Sonnet |

## Adding a new tool

1. Create `pages/your-tool.jsx`
2. Add any new API routes in `pages/api/`
3. Add an entry to the `TOOLS` array in `pages/index.jsx`

## Monitoring usage

Vercel logs all API route calls under Project → Logs. Each `/api/generate` call logs Claude token usage to the console for cost tracking.
