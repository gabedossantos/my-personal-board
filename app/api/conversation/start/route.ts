// This file is server-only and should not be imported in edge or client contexts.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { BusinessStrategy } from '@/lib/types';
import { generateBoardMemberPrompt, BOARD_PERSONAS } from '@/lib/board-prompts';
import { generateText } from '@/lib/text-generation';
import ConversationDB from '@/lib/conversation-db';
import { estimateTokens } from '@/lib/utils';
import { extractPdfTextFromBase64 } from '@/lib/pdf-utils';

export async function POST(request: NextRequest) {
  try {
    const { strategy } = await request.json() as { strategy: BusinessStrategy };
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // If a supplementary file is present in initial strategy, ensure there's a concise text excerpt
    let enrichedStrategy: BusinessStrategy = strategy;
    try {
      if (strategy?.supplementaryFile?.content && !strategy?.supplementaryFile?.textExcerpt) {
        const sf = strategy.supplementaryFile;
        if (sf.type === 'pdf-base64') {
          const text = await extractPdfTextFromBase64(sf.content, 4000).catch(() => '');
          if (text) {
            enrichedStrategy = {
              ...strategy,
              supplementaryFile: { ...sf, textExcerpt: text }
            };
          }
        } else if (sf.type === 'text/markdown' || sf.type === 'text/plain') {
          const t = (sf.content || '').trim();
          enrichedStrategy = { ...strategy, supplementaryFile: { ...sf, textExcerpt: t.slice(0, 4000) } };
        }
      }
    } catch (e) {
      console.warn('Failed to derive excerpt on start:', e);
    }

    // Create conversation in database
    const conversation = await ConversationDB.createConversation({
      sessionId,
      strategy: enrichedStrategy,
      projectName: enrichedStrategy.projectName || 'Untitled Project'
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
  const prompt = generateBoardMemberPrompt('cfo', enrichedStrategy);
      const { content, provider } = await generateText({ messages: [{ role: 'user', content: prompt }], maxTokens: 300 });
      const outputTokenEstimate = estimateTokens(content.trim());
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
          providerUsed: provider,
          tokens: {
            input: estimateTokens(prompt),
            output: outputTokenEstimate,
            total: estimateTokens(prompt) + outputTokenEstimate
          }
        }
      });

      // Track token usage for initial greeting
      await ConversationDB.addTokenUsage({
        conversationId: conversation.id,
        requestType: 'initial_greeting',
        persona: 'cfo',
        inputTokens: estimateTokens(prompt),
        outputTokens: outputTokenEstimate,
        cost: 0
      });
    } catch (memberError) {
      console.error('Error generating CFO response:', memberError);
      
      // Add fallback message
      const persona = BOARD_PERSONAS.cfo;
      const fbText = `Hello! I'm ${persona.name}, your ${persona.title}. I'm excited to discuss your business strategy! Could you start by telling me about the core problem or opportunity you're addressing?`;
      await ConversationDB.addMessage({
        conversationId: conversation.id,
        messageType: 'board_member',
        persona: 'cfo',
        content: fbText,
        metadata: {
          name: persona.name,
          title: persona.title,
          animalSpirit: persona.animalSpirit,
          mantra: persona.mantra,
          tokens: {
            input: 0,
            output: estimateTokens(fbText),
            total: estimateTokens(fbText)
          }
        }
      });

      // Track token usage for fallback (approximate only output)
      await ConversationDB.addTokenUsage({
        conversationId: conversation.id,
        requestType: 'initial_greeting',
        persona: 'cfo',
        inputTokens: 0,
  outputTokens: estimateTokens(fbText),
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
          tokens: (msg.metadata as any)?.tokens,
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
}
