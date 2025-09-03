import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import ConversationDB from '@/lib/conversation-db';
import { Artifact } from '@prisma/client';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

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
    const formattedArtifacts = conversation.artifacts?.map((artifact: Artifact) => ({
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
