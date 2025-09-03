<<<<<<< HEAD
import { NextRequest, NextResponse } from "next/server";

// Example: Replace with your actual logic
export async function POST(_req: NextRequest) {
  // Parse request body if needed
  // const data = await req.json();

  // Example response
  return NextResponse.json(
    { message: "Conversation started!" },
    { status: 200 },
  );
=======

import { NextRequest, NextResponse } from 'next/server';
import { BusinessStrategy } from '@/lib/types';
import { generateBoardMemberPrompt, BOARD_PERSONAS } from '@/lib/board-prompts';
import { generateText } from '@/lib/text-generation';
import ConversationDB from '@/lib/conversation-db';
import { estimateTokens } from '@/lib/utils';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { strategy } = await request.json() as { strategy: BusinessStrategy };
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create conversation in database
    const conversation = await ConversationDB.createConversation({
      sessionId,
      strategy,
      projectName: strategy.projectName || 'Untitled Project'
    });

    // Add initial system message
    const hasMinimalInfo = !!(strategy.projectName || strategy.oneSentenceSummary || strategy.detailedDescription);
    
    const systemMessage = hasMinimalInfo 
      ? 'Welcome to the boardroom! Orion, our CFO, will start by discussing the financial aspects of your strategy.'
      : 'Welcome to the boardroom! Orion, our CFO, will begin with some questions to understand your business concept.';
    
    await ConversationDB.addMessage({
      conversationId: conversation.id,
      messageType: 'system',
      content: systemMessage,
    });

    // Generate CFO greeting only (local generator)
    try {
    const persona = BOARD_PERSONAS.cfo;
    const prompt = generateBoardMemberPrompt('cfo', strategy);
    const { content, provider } = await generateText({ messages: [{ role: 'user', content: prompt }], maxTokens: 300 });
      await ConversationDB.addMessage({
        conversationId: conversation.id,
        messageType: 'board_member',
        persona: 'cfo',
        content: content.trim(),
        metadata: {
          name: persona.name,
          title: persona.title,
          animalSpirit: persona.animalSpirit,
      mantra: persona.mantra,
      providerUsed: provider
        }
      });

      // Track token usage for initial greeting
      await ConversationDB.addTokenUsage({
        conversationId: conversation.id,
        requestType: 'initial_greeting',
        persona: 'cfo',
        inputTokens: estimateTokens(prompt),
        outputTokens: estimateTokens(content.trim()),
  cost: 0
      });
    } catch (memberError) {
      console.error('Error generating CFO response:', memberError);
      
      // Add fallback message
      const persona = BOARD_PERSONAS.cfo;
      await ConversationDB.addMessage({
        conversationId: conversation.id,
        messageType: 'board_member',
        persona: 'cfo',
        content: `Hello! I'm ${persona.name}, your ${persona.title}. I'm excited to discuss your business strategy! Could you start by telling me about the core problem or opportunity you're addressing?`,
        metadata: {
          name: persona.name,
          title: persona.title,
          animalSpirit: persona.animalSpirit,
          mantra: persona.mantra
        }
      });

      // Track token usage for fallback (approximate only output)
      await ConversationDB.addTokenUsage({
        conversationId: conversation.id,
        requestType: 'initial_greeting',
        persona: 'cfo',
        inputTokens: 0,
        outputTokens: estimateTokens(
          `Hello! I'm ${persona.name}, your ${persona.title}. I'm excited to discuss your business strategy! Could you start by telling me about the core problem or opportunity you're addressing?`
        ),
        cost: 0
      });
    }

  // Fetch the complete conversation with messages
    const completeConversation = await ConversationDB.getConversationBySessionId(sessionId);

    if (!completeConversation) {
      throw new Error('Failed to retrieve conversation after creation');
    }

    // Gather stats
    const stats = await ConversationDB.getConversationStats(completeConversation.id);

    return NextResponse.json({
      success: true,
      conversation: {
        sessionId: completeConversation.sessionId,
        id: completeConversation.id,
        phase: completeConversation.phase,
        status: completeConversation.status,
        strategy: completeConversation.strategy,
        messages: completeConversation.messages.map(msg => ({
          id: msg.id,
          type: msg.messageType === 'board_member' ? 'board_member' : msg.messageType,
          persona: msg.persona,
          name: (msg.metadata as any)?.name,
          title: (msg.metadata as any)?.title,
          content: msg.content,
          timestamp: msg.createdAt.toISOString(),
          isComplete: msg.isComplete
        })),
        isActive: completeConversation.status === 'active',
        createdAt: completeConversation.createdAt.toISOString(),
        lastActivity: completeConversation.updatedAt.toISOString(),
        stats: stats || {
          messageCount: completeConversation.messages.length,
          artifactCount: completeConversation.artifacts.length,
          totalTokens: 0,
          totalCost: 0,
          phase: completeConversation.phase,
          status: completeConversation.status
        }
      }
    });

  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to start conversation. Please try again.' 
      },
      { status: 500 }
    );
  }
>>>>>>> 9a3bd97 (Commit all recent changes)
}
