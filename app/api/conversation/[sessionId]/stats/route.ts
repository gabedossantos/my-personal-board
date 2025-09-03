import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import ConversationDB from '../../../../../lib/conversation-db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const conversation = await ConversationDB.getConversationBySessionId(sessionId);
    if (!conversation) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const stats = await ConversationDB.getConversationStats(conversation.id);
    return NextResponse.json({ success: true, stats });
  } catch (e) {
    console.error('Stats endpoint error:', e);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
