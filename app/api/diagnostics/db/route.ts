import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const result: any = { ok: true };
  try {
    // Try a trivial DB query
    const count = await prisma.conversation.count();
    result.db = { connected: true, conversationCount: count };
  } catch (e: any) {
    result.db = { connected: false, error: e?.message };
  }

  result.env = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    openAIModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    runtime: process.env.NEXT_RUNTIME || 'nodejs',
    vercel: !!process.env.VERCEL,
  };

  return NextResponse.json(result);
}
