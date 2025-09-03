<<<<<<< HEAD
# Dynamic Pricing Dashboard (Simulated Boardroom)

Dynamic Pricing Dashboard is an AI-powered web app for startup founders and business leaders to stress-test their business strategies. Present your ideas to virtual board members and receive realistic, persona-driven feedback before your next investor meeting.

## Features

- Input your business strategy and key details
- Simulate a boardroom conversation with AI personas
- Receive executive summaries, risks, opportunities, and recommendations
- No login required; session-based simulation

## Tech Stack

- Next.js (React, TypeScript)
- Tailwind CSS
- Custom UI components

## Getting Started

1. Clone this repo
2. Run `npm install`
3. Run `npm run dev` to start the app locally

## Deployment

- Designed for Vercel, but can be deployed anywhere Next.js is supported.

## Privacy & Security

- No secrets or API keys are included in this repo.
- Do not commit any `.env` or secret files.
- Review your own deployment for any additional privacy needs.

## License

MIT (or your preferred license)
=======
# Simulated Boardroom

A Next.js app for strategy testing with virtual board advisors. This repo is provider-agnostic and contains no external AI calls or secrets.

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
- No references to OpenAI/Copilot/LLM/Abacus remain.
- Package manager: npm only.

### Prisma / Migrations
- This repo uses `prisma db push` for local development to sync schema to your database.
- If you previously used SQLite migrations, remove old `prisma/migrations` and run `npx prisma db push`.
- For production, manage migrations with `npx prisma migrate dev` and commit the generated migrations.

## Troubleshooting
- If Prisma complains about the database, ensure `DATABASE_URL` is set and reachable.
- Lint rules are relaxed for DX. You can tighten them in `.eslintrc.json` as needed.
>>>>>>> 9a3bd97 (Commit all recent changes)
