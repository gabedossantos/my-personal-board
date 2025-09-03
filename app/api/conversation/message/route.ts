import { NextRequest } from 'next/server';
import { BusinessStrategy } from '@/lib/types';
import { generateConversationResponsePrompt, generateBoardMemberPrompt, generateDirectAddressingPrompt, shouldIntroduceAdvisors, detectArtifactOpportunity, detectDirectAdvisorAddressing, detectMultiAdvisorRequest, BOARD_PERSONAS } from '@/lib/board-prompts';
import { generateText } from '@/lib/text-generation';
import ConversationDB from '@/lib/conversation-db';
import { estimateTokens } from '@/lib/utils';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { 
      sessionId, 
      userMessage
    } = await request.json() as { 
      sessionId: string;
      userMessage: string;
    };

    if (!userMessage?.trim()) {
      return new Response('User message is required', { status: 400 });
    }

    if (!sessionId) {
      return new Response('Session ID is required', { status: 400 });
    }

    // Load conversation from database
    const conversation = await ConversationDB.getConversationBySessionId(sessionId);
    if (!conversation) {
      return new Response('Conversation not found', { status: 404 });
    }

    // Save user message to database
    await ConversationDB.addMessage({
      conversationId: conversation.id,
      messageType: 'user',
      content: userMessage.trim(),
    });

    // Get updated conversation with new user message
    const updatedConversation = await ConversationDB.getConversationBySessionId(sessionId);
    if (!updatedConversation) {
      throw new Error('Failed to retrieve updated conversation');
    }

    const strategy = updatedConversation.strategy as BusinessStrategy;
    const messages = updatedConversation.messages;
    
    // Count user responses for advisor introduction logic
    const userResponseCount = await ConversationDB.getUserResponseCount(conversation.id);
    
    // Check for direct advisor addressing first
    const directlyAddressed = detectDirectAdvisorAddressing(userMessage);
    
    // Check if we should introduce new advisors
    const advisorDecision = shouldIntroduceAdvisors(messages, userResponseCount);
    
  // Determine which member should respond
    let respondingMember: 'cfo' | 'cmo' | 'coo';
    let isNewAdvisorIntroduction = false;
    let isDirectlyAddressed = false;
  let queuedResponders: ('cfo'|'cmo'|'coo')[] = [];
    
    if (directlyAddressed) {
      // User directly addressed a specific advisor
      respondingMember = directlyAddressed;
      isDirectlyAddressed = true;
      
      // If addressing a new advisor that hasn't joined yet, introduce them
      if (conversation.phase === 'cfo_only' && respondingMember !== 'cfo') {
        await ConversationDB.updateConversationPhase(conversation.id, 'advisors_joined');
        await ConversationDB.addAdvisorToConversation(conversation.id, respondingMember);
        isNewAdvisorIntroduction = true;
      } else if (conversation.phase === 'advisors_joined') {
        const activeAdvisors = await ConversationDB.getActiveAdvisors(conversation.id);
        const activePersonas = activeAdvisors.map(a => a.persona);
        if (!activePersonas.includes(respondingMember) && respondingMember !== 'cfo') {
          await ConversationDB.addAdvisorToConversation(conversation.id, respondingMember);
          isNewAdvisorIntroduction = true;
        }
      }
    } else if (conversation.phase === 'cfo_only' && advisorDecision.introduce) {
      // Transition to advisors_joined phase and introduce first new advisor
      await ConversationDB.updateConversationPhase(conversation.id, 'advisors_joined');
      respondingMember = advisorDecision.advisors[0]; // Start with first advisor
      isNewAdvisorIntroduction = true;
      
      // Add advisor to conversation
      await ConversationDB.addAdvisorToConversation(conversation.id, respondingMember);
    } else if (conversation.phase === 'advisors_joined' && advisorDecision.introduce) {
      // Add any remaining advisors not yet introduced
      const activeAdvisors = await ConversationDB.getActiveAdvisors(conversation.id);
      const activePersonas = activeAdvisors.map(a => a.persona);
      const newAdvisors = advisorDecision.advisors.filter(advisor => !activePersonas.includes(advisor));
      
      if (newAdvisors.length > 0) {
        respondingMember = newAdvisors[0];
        isNewAdvisorIntroduction = true;
        await ConversationDB.addAdvisorToConversation(conversation.id, respondingMember);
      } else {
        // Determine responder based on message content
        respondingMember = determineResponder(userMessage, userResponseCount);
      }
    } else {
      // Default: CFO continues or determine based on content
      respondingMember = conversation.phase === 'cfo_only' ? 'cfo' : determineResponder(userMessage, userResponseCount);
    }

    // If user asked for multiple advisors (e.g., "all three"), queue the others to answer after the first
    const multi = detectMultiAdvisorRequest(userMessage);
    if (multi.length > 0) {
      const activeAdvisors = await ConversationDB.getActiveAdvisors(conversation.id);
      const active = new Set(activeAdvisors.map(a => a.persona).concat(['cfo']));
      // Ensure we are in advisors_joined phase to allow others
      if (conversation.phase === 'cfo_only') {
        await ConversationDB.updateConversationPhase(conversation.id, 'advisors_joined');
      }
      // Add any requested advisors not yet active
      for (const adv of multi) {
        if (!active.has(adv) && adv !== 'cfo') {
          await ConversationDB.addAdvisorToConversation(conversation.id, adv);
          active.add(adv);
        }
      }
      // Queue requested advisors excluding the first responder
      queuedResponders = multi.filter(p => p !== respondingMember);
    }

    // Build conversation history for context
    const historyText = messages
      .filter(msg => msg.messageType !== 'system')
      .map(msg => {
        if (msg.messageType === 'user') {
          return `User: ${msg.content}`;
        } else if (msg.messageType === 'board_member') {
          const metadata = msg.metadata as any;
          return `${metadata?.name || msg.persona}: ${msg.content}`;
        }
        return '';
      })
      .filter(text => text.length > 0);

    // Generate appropriate prompt
    let prompt: string;
    if (isDirectlyAddressed && !isNewAdvisorIntroduction) {
      // User directly addressed this advisor - use special direct addressing prompt
      prompt = generateDirectAddressingPrompt(respondingMember, strategy, historyText, userMessage);
    } else if (isNewAdvisorIntroduction) {
      // New advisor introduction
      prompt = generateBoardMemberPrompt(respondingMember, strategy, historyText);
    } else {
      // Regular conversation response
      prompt = generateConversationResponsePrompt(respondingMember, strategy, historyText, userMessage);
    }

  const encoder = new TextEncoder();
  let fullResponse = '';
    const personaMeta = BOARD_PERSONAS[respondingMember];

  // For simplicity, generate a single response and stream it chunked
  const { content, provider } = await generateText({ messages: [{ role: 'user', content: prompt }], maxTokens: 350 });
  fullResponse = content.trim();
  const inputTokenEstimate = estimateTokens(prompt + '\n' + userMessage);
  const outputTokenEstimate = estimateTokens(fullResponse);

    const payloads: string[] = [];
    // Chunk the response to simulate streaming
    const chunks = fullResponse.match(/.{1,80}(\s|$)/g) || [fullResponse];
    for (const chunk of chunks) {
      payloads.push(JSON.stringify({
        content: chunk,
        persona: respondingMember,
        name: personaMeta.name,
        title: personaMeta.title,
        isNewIntroduction: isNewAdvisorIntroduction,
        providerUsed: provider
      }));
    }

    const readable = new ReadableStream({
      async start(controller) {
        for (const p of payloads) {
          controller.enqueue(encoder.encode(`data: ${p}\n\n`));
          await new Promise(r => setTimeout(r, 20));
        }

        // Persist the full message in DB
    await ConversationDB.addMessage({
          conversationId: conversation.id,
          messageType: 'board_member',
          persona: respondingMember,
          content: fullResponse,
          metadata: {
            name: personaMeta.name,
            title: personaMeta.title,
            animalSpirit: personaMeta.animalSpirit,
            mantra: personaMeta.mantra,
            isNewIntroduction: isNewAdvisorIntroduction,
      providerUsed: provider,
      tokens: { input: inputTokenEstimate, output: outputTokenEstimate, total: inputTokenEstimate + outputTokenEstimate }
          }
        });

        // Track token usage for this exchange
        await ConversationDB.addTokenUsage({
          conversationId: conversation.id,
          requestType: 'message',
          persona: respondingMember,
          inputTokens: inputTokenEstimate,
          outputTokens: outputTokenEstimate,
          cost: 0
        });

        // Optionally check for artifacts opportunity (now stricter)
  const finalConversation = await ConversationDB.getConversationBySessionId(sessionId);
        if (finalConversation) {
          const artifactOpportunity = detectArtifactOpportunity(finalConversation.messages, strategy);
          if (artifactOpportunity?.shouldGenerate) {
            generateArtifactAsync(sessionId, artifactOpportunity.type, artifactOpportunity.description);
          }
        }

        // If there are queued responders (from multi-advisor request), trigger them sequentially
        if (queuedResponders.length > 0) {
          for (const nextPersona of queuedResponders) {
            try {
              const nextPrompt = generateConversationResponsePrompt(nextPersona, strategy, historyText, userMessage);
              const { content: c2, provider: p2 } = await generateText({ messages: [{ role: 'user', content: nextPrompt }], maxTokens: 350 });
              const text2 = c2.trim();
              const in2 = estimateTokens(nextPrompt + '\n' + userMessage);
              const out2 = estimateTokens(text2);
              const meta2 = BOARD_PERSONAS[nextPersona];
              await ConversationDB.addMessage({
                conversationId: conversation.id,
                messageType: 'board_member',
                persona: nextPersona,
                content: text2,
                metadata: {
                  name: meta2.name,
                  title: meta2.title,
                  animalSpirit: meta2.animalSpirit,
                  mantra: meta2.mantra,
                  providerUsed: p2,
                  tokens: { input: in2, output: out2, total: in2 + out2 }
                }
              });
              await ConversationDB.addTokenUsage({
                conversationId: conversation.id,
                requestType: 'message',
                persona: nextPersona,
                inputTokens: in2,
                outputTokens: out2,
                cost: 0
              });
            } catch (e) {
              console.error('Multi-advisor response error:', e);
            }
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' } });

  } catch (error) {
    console.error('Error processing conversation message:', error);
    return new Response('Failed to process message', { status: 500 });
  }
}

// Helper function to determine which member should respond based on content
function determineResponder(userMessage: string, responseCount: number): 'cfo' | 'cmo' | 'coo' {
  const messageContent = userMessage.toLowerCase();
  
  // Financial topics -> CFO
  if (messageContent.includes('cost') || messageContent.includes('money') || 
      messageContent.includes('financial') || messageContent.includes('revenue') || 
      messageContent.includes('profit') || messageContent.includes('budget')) {
    return 'cfo';
  }
  
  // Marketing/customer topics -> CMO
  if (messageContent.includes('customer') || messageContent.includes('market') || 
      messageContent.includes('marketing') || messageContent.includes('audience') ||
      messageContent.includes('brand') || messageContent.includes('growth')) {
    return 'cmo';
  }
  
  // Operations topics -> COO
  if (messageContent.includes('operation') || messageContent.includes('scale') || 
      messageContent.includes('team') || messageContent.includes('process') ||
      messageContent.includes('deliver') || messageContent.includes('build')) {
    return 'coo';
  }
  
  // Round-robin based on response count if no clear topic match
  const members: ('cfo' | 'cmo' | 'coo')[] = ['cfo', 'cmo', 'coo'];
  return members[responseCount % 3];
}

// Async function to trigger artifact generation
async function generateArtifactAsync(sessionId: string, artifactType: string, description: string) {
  try {
    console.log(`Triggering async artifact generation for session ${sessionId}`);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const url = baseUrl.startsWith('http') ? `${baseUrl}/api/artifacts/generate` : `https://${baseUrl}/api/artifacts/generate`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, artifactType, description }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('Artifact generated successfully:', result.artifact.title);
      } else {
        console.error('Artifact generation failed:', result.error);
      }
    } else {
      console.error('Artifact generation API error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error in async artifact generation:', error);
  }
}
