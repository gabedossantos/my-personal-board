# Simulated Boardroom


## Overview

Simulated Boardroom is a Next.js 14 application for stress-testing business strategies with virtual board advisors. Entrepreneurs and teams can present their ideas, receive realistic feedback, and iterate on their plans in a safe, interactive environment—before facing real investors.

### Key Features
- **Virtual Boardroom Simulation:** Engage with three unique AI-powered advisors (CFO, CMO, COO), each with distinct animal-spirited personas and expertise.
- **Strategy Input & Session Management:** Start new sessions, resume previous ones, and view summaries of recent boardroom conversations.
- **Advisor Feedback:** Receive multi-perspective analysis, actionable questions, and recommendations tailored to your business strategy.
- **File Uploads:** Attach PDF, TXT, or Markdown files (e.g., pitch decks, market research) for advisors to reference. Robust PDF extraction includes OCR fallback for image-only documents.
- **Token Tracking:** Per-message and per-session token usage is tracked and surfaced for transparency.
- **Artifact & Chart Generation:** Advisors can generate financial charts, market analysis, and timelines based on your strategy and conversation context.
- **Executive Summary:** After each session, receive a comprehensive summary with key risks, opportunities, recommendations, and conversation highlights.
- **Diagnostics & Stats:** Lightweight endpoints and UI elements provide session stats, message counts, token usage, and artifact counts.

### Typical User Flow
1. **Present Your Idea:** Enter your business strategy details and optionally upload supporting files.
2. **Boardroom Discussion:** Interact with advisors, ask questions, and receive feedback. Advisors reference uploaded files and generate charts when relevant.
3. **Session Management:** Continue, resume, or end sessions. All feedback and artifacts are persisted.
4. **Executive Summary:** View a synthesized summary of board feedback, risks, opportunities, and next steps.

## Specification

- **Tech Stack:**
  - Next.js 14 App Router, React 18, TypeScript
  - Tailwind CSS, Radix UI, Lucide icons
  - Prisma ORM + PostgreSQL (Neon or local)
  - Local text/JSON generator for advisor responses (no external AI calls)
  - PDF extraction: pdfjs-dist, pdf-parse, @napi-rs/canvas, tesseract.js (OCR fallback)

- **Core Business Logic:**
  - Advisors (CFO, CMO, COO) have unique prompts, feedback logic, and chart/artifact generation
  - Session and message management with token tracking
  - File uploads processed and distilled into chat context
  - Executive summary generated from full conversation and strategy

- **Data Model:**
  - `BusinessStrategy`: Project details, summary, customer, problem, cost, description, and optional file
  - `ConversationSession`: Session metadata, strategy, messages, status, phase, timestamps
  - `ChatMessage`: User/board/system messages, persona, content, tokens, provider
  - `Artifact`: Generated charts/visualizations with type, data, config

## Usage

### Prerequisites
- Node.js 18+
- npm (use npm only)
- PostgreSQL database URL for Prisma (local or hosted)

### Setup
1. Copy env and set variables
	```
	cp .env.example .env
	# Edit .env and set DATABASE_URL
	```
2. Install dependencies
	```
	npm install
	```
3. Initialize database schema (first run)
	```
	npx prisma db push
	```
4. Generate Prisma client / build
	```
	npm run build
	```
5. Run dev server
	```
	npm run dev
	```
6. Production build/start
	```
	npm run build
	npm start
	```

### File Uploads
- Supported: PDF, TXT, Markdown (.md)
- PDFs are processed with text extraction and OCR fallback for image-only files
- Advisors reference uploaded files in their feedback and chart generation

### Session Management
- Start, resume, and end boardroom sessions
- View recent sessions and executive summaries
- All feedback, artifacts, and stats are persisted

### Advisor Personas
- **Orion (CFO, Owl):** Financial wisdom, risk assessment, unit economics
- **Pavo (CMO, Peacock):** Market opportunity, customer acquisition, brand differentiation
- **Castor (COO, Beaver):** Operational efficiency, scalability, team capabilities

## Technical Notes
- No external AI calls or secrets; provider-agnostic and safe for local development
- Token usage is estimated for development; can be adapted for real LLMs
- All business logic, prompt engineering, and artifact generation are local and transparent
- PDF extraction pipeline: pdfjs-dist, pdf-parse, @napi-rs/canvas, tesseract.js
- Prisma ORM for data persistence; see schema in `prisma/schema.prisma`

## Troubleshooting
- If Prisma complains about the database, ensure `DATABASE_URL` is set and reachable
- Lint rules are relaxed for DX. You can tighten them in `.eslintrc.json` as needed

## License & Contributions
- MIT License
- Contributions welcome! Please open issues or PRs for improvements, bug fixes, or new features

---
For more details, see code comments and UI tooltips throughout the app. This README reflects all recent enhancements, including OCR, session management, artifact/chart generation, and robust summary logic.

## Prerequisites
- Node.js 18+
- npm (use npm only)
- PostgreSQL database URL for Prisma (local or hosted)

## Setup
1. Copy env and set variables
```
cp .env.example .env
# Edit .env and set DATABASE_URL
```

2. Install dependencies
```
npm install
```

3. Initialize database schema (first run)
```
npx prisma db push
```

4. Generate Prisma client / build
```
npm run build
```

5. Run dev server
```
npm run dev
```

6. Production build/start
```
npm run build
npm start
```

## Notes
- Secrets are not committed. Use `.env` locally; `.env.example` shows required variables.
- The app uses a local text/JSON generator (`lib/text-generation.ts`) for development.
- Package manager: npm only.

### Prisma / Migrations
- This repo uses `prisma db push` for local development to sync schema to your database.
- If you previously used SQLite migrations, remove old `prisma/migrations` and run `npx prisma db push`.
- For production, manage migrations with `npx prisma migrate dev` and commit the generated migrations.

## Troubleshooting
- If Prisma complains about the database, ensure `DATABASE_URL` is set and reachable.
- Lint rules are relaxed for DX. You can tighten them in `.eslintrc.json` as needed.
