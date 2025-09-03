

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

    // Get conversation stats
    const stats = await ConversationDB.getConversationStats(conversation.id);

    // Format messages for frontend
    const formattedMessages = conversation.messages.map(msg => ({
      id: msg.id,
      type: msg.messageType === 'board_member' ? 'board_member' : msg.messageType,
      persona: msg.persona,
      name: (msg.metadata as any)?.name,
      title: (msg.metadata as any)?.title,
      animalSpirit: (msg.metadata as any)?.animalSpirit,
      mantra: (msg.metadata as any)?.mantra,
  providerUsed: (msg.metadata as any)?.providerUsed,
      tokens: (msg.metadata as any)?.tokens,
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
      isComplete: msg.isComplete,
      isNewIntroduction: (msg.metadata as any)?.isNewIntroduction || false
    }));

    // Format artifacts for frontend
    const formattedArtifacts = conversation.artifacts.map(artifact => ({
      id: artifact.id,
      type: artifact.artifactType,
      chartType: artifact.chartType,
      title: artifact.title,
      description: artifact.description,
      data: artifact.data,
      config: artifact.config,
      createdAt: artifact.createdAt.toISOString()
    }));

  return NextResponse.json({
      success: true,
      conversation: {
        sessionId: conversation.sessionId,
        id: conversation.id,
        projectName: conversation.projectName,
        phase: conversation.phase,
        status: conversation.status,
        strategy: conversation.strategy,
        messages: formattedMessages,
        artifacts: formattedArtifacts,
        isActive: conversation.status === 'active',
        createdAt: conversation.createdAt.toISOString(),
        lastActivity: conversation.updatedAt.toISOString(),
        stats: stats || {
          messageCount: formattedMessages.length,
          artifactCount: formattedArtifacts.length,
          totalTokens: 0,
          totalCost: 0,
          phase: conversation.phase,
          status: conversation.status
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving conversation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve conversation. Please try again.' 
      },
      { status: 500 }
    );
  }
}

// Update conversation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const { status, phase } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const conversation = await ConversationDB.getConversationBySessionId(sessionId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Update status if provided
    if (status) {
      if (status === 'completed') {
        await ConversationDB.completeConversation(conversation.id);
      }
    }

    // Update phase if provided
    if (phase) {
      await ConversationDB.updateConversationPhase(conversation.id, phase);
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation updated successfully'
    });

  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update conversation' 
      },
      { status: 500 }
    );
  }
}
