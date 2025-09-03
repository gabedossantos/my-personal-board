import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import ConversationDB from '@/lib/conversation-db';

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get conversation from database
    const conversation = await ConversationDB.getConversationBySessionId(sessionId);
    
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Format artifacts for frontend
    const formattedArtifacts = conversation.artifacts?.map(artifact => ({
      id: artifact.id,
      type: artifact.artifactType,
      chartType: artifact.chartType,
      title: artifact.title,
      description: artifact.description,
      data: artifact.data,
      config: artifact.config,
      createdAt: artifact.createdAt.toISOString()
    })) || [];

    return NextResponse.json({
      success: true,
      artifacts: formattedArtifacts
    });

  } catch (error) {
    console.error('Error retrieving conversation artifacts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve artifacts' 
      },
      { status: 500 }
    );
  }
}
