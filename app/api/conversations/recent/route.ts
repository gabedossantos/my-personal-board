import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        sessionId: true,
        projectName: true,
        status: true,
        phase: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true, artifacts: true } }
      }
    });

    return NextResponse.json({
      success: true,
      sessions: conversations.map(c => ({
        id: c.id,
        sessionId: c.sessionId,
        projectName: c.projectName || 'Untitled Project',
        status: c.status,
        phase: c.phase,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        messageCount: c._count.messages,
        artifactCount: c._count.artifacts,
      }))
    });
  } catch (error) {
    console.error('Recent sessions error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load sessions' }, { status: 500 });
  }
}
