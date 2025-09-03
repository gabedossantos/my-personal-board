/* Legacy API route disabled. Use App Router under app/api/conversation/start. */
// @ts-nocheck
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ success: false, error: 'Legacy route disabled. Use app/api/conversation/start.' }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ success: false, error: 'Legacy route disabled. Use app/api/conversation/start.' }, { status: 410 });
}
