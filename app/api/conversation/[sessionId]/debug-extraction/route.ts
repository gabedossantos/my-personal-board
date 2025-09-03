import { NextRequest, NextResponse } from 'next/server';
import ConversationDB from '../../../../../lib/conversation-db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    if (!sessionId) return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });

    const conversation = await ConversationDB.getConversationBySessionId(sessionId);
    if (!conversation) return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });

    const strategy: any = conversation.strategy || {};
    const sf: any = strategy.supplementaryFile || null;
    const hasFile = !!sf;
    const hasExcerpt = !!sf?.textExcerpt && typeof sf.textExcerpt === 'string' && sf.textExcerpt.length > 0;
    const excerptPreview = hasExcerpt ? String(sf.textExcerpt).slice(0, 500) : null;

    return NextResponse.json({
      success: true,
      hasFile,
      fileMeta: hasFile ? { name: sf.name, type: sf.type, contentBytes: (sf.content ? Buffer.from(sf.content, 'base64').byteLength : 0) } : null,
      hasExcerpt,
      excerptPreview,
      excerptLength: hasExcerpt ? sf.textExcerpt.length : 0
    });
  } catch (e) {
    console.error('debug-extraction error', e);
    return NextResponse.json({ success: false, error: 'Debug extraction failed' }, { status: 500 });
  }
}
