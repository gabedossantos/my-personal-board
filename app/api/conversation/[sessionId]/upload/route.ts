import { NextRequest, NextResponse } from 'next/server';
import ConversationDB from '@/lib/conversation-db';
import { processFile } from '@/lib/file-processor';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    if (!sessionId) return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });

    const conversation = await ConversationDB.getConversationBySessionId(sessionId);
    if (!conversation) return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });

    // Enforce size limit (10MB) and allowed types similar to initial upload
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File size must be less than 10MB' }, { status: 400 });
    }
    const allowed = ['application/pdf', 'text/markdown', 'text/plain'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Unsupported file type. Please upload PDF, Markdown (.md), or TXT files.' }, { status: 400 });
    }

    // Process file to extract content or base64
    const processed = await processFile(file);
    if (!processed.success) {
      return NextResponse.json({ success: false, error: processed.error || 'File processing failed' }, { status: 400 });
    }

    // Merge into strategy
    const prev = (conversation.strategy as any) || {};
    const supplementaryFile = {
      name: processed.fileName,
      content: processed.content || '',
      type: processed.fileType || ''
    };

    const { prisma } = await import('@/lib/db');
    const updated = await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        strategy: { ...(prev || {}), supplementaryFile } as any,
        updatedAt: new Date()
      }
    });

    // Add a system note message for visibility
    await ConversationDB.addMessage({
      conversationId: conversation.id,
      messageType: 'system',
      content: `A new file was attached: ${processed.fileName}`
    });

    return NextResponse.json({ success: true, file: processed, strategy: updated.strategy });
  } catch (error) {
    console.error('Conversation upload error:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload to conversation' }, { status: 500 });
  }
}
