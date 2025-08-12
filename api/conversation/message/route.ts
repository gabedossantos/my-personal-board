import { NextRequest } from "next/server";
import {
  SendMessageRequestSchema,
  ErrorResponse,
  SendMessageRequest,
} from "@gabe/types/api-schemas";
import {
  generateConversationResponsePrompt,
  generateBoardMemberPrompt,
  generateDirectAddressingPrompt,
  shouldIntroduceAdvisors,
  detectArtifactOpportunity,
  detectDirectAdvisorAddressing,
  BOARD_PERSONAS,
} from "@gabe/ai-prompts";
import ConversationDB from "@/lib/conversation-db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = SendMessageRequestSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request",
          issues: parsed.error.issues,
        } satisfies ErrorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const { sessionId, userMessage }: SendMessageRequest = parsed.data;

    if (!userMessage?.trim()) {
      return new Response("User message is required", { status: 400 });
    }

    if (!sessionId) {
      return new Response("Session ID is required", { status: 400 });
    }

    // Load conversation from database
    const conversation =
      await ConversationDB.getConversationBySessionId(sessionId);
    if (!conversation) {
      return new Response("Conversation not found", { status: 404 });
    }

    // Save user message to database
    await ConversationDB.addMessage({
      conversationId: conversation.id,
      messageType: "user",
      content: userMessage.trim(),
    });

    // Get updated conversation with new user message
    const updatedConversation =
      await ConversationDB.getConversationBySessionId(sessionId);
    if (!updatedConversation) {
      throw new Error("Failed to retrieve updated conversation");
    }

    const strategy = updatedConversation.strategy as unknown as {
      projectName?: string;
      oneSentenceSummary?: string;
      targetCustomer?: string;
      keyProblem?: string;
      estimatedCost?: string;
      detailedDescription?: string;
      supplementaryFile?: { type: string; name: string; content: string };
    };
    const messages = updatedConversation.messages;

    // Count user responses for advisor introduction logic
    const userResponseCount = await ConversationDB.getUserResponseCount(
      conversation.id,
    );

    // Check for direct advisor addressing first
    const directlyAddressed = detectDirectAdvisorAddressing(userMessage);

    // Check if we should introduce new advisors
    const advisorDecision = shouldIntroduceAdvisors(
      messages,
      userResponseCount,
    );

    // Determine which member should respond
    let respondingMember: "cfo" | "cmo" | "coo";
    let isNewAdvisorIntroduction = false;
    let isDirectlyAddressed = false;

    if (directlyAddressed) {
      // User directly addressed a specific advisor
      respondingMember = directlyAddressed;
      isDirectlyAddressed = true;

      // If addressing a new advisor that hasn't joined yet, introduce them
      if (conversation.phase === "cfo_only" && respondingMember !== "cfo") {
        await ConversationDB.updateConversationPhase(
          conversation.id,
          "advisors_joined",
        );
        await ConversationDB.addAdvisorToConversation(
          conversation.id,
          respondingMember,
        );
        isNewAdvisorIntroduction = true;
      } else if (conversation.phase === "advisors_joined") {
        const activeAdvisors = await ConversationDB.getActiveAdvisors(
          conversation.id,
        );
        const activePersonas = activeAdvisors.map(
          (a: { persona: string }) => a.persona,
        );
        if (
          !activePersonas.includes(respondingMember) &&
          respondingMember !== "cfo"
        ) {
          await ConversationDB.addAdvisorToConversation(
            conversation.id,
            respondingMember,
          );
          isNewAdvisorIntroduction = true;
        }
      }
    } else if (conversation.phase === "cfo_only" && advisorDecision.introduce) {
      // Transition to advisors_joined phase and introduce first new advisor
      await ConversationDB.updateConversationPhase(
        conversation.id,
        "advisors_joined",
      );
      respondingMember = advisorDecision.advisors[0]; // Start with first advisor
      isNewAdvisorIntroduction = true;

      // Add advisor to conversation
      await ConversationDB.addAdvisorToConversation(
        conversation.id,
        respondingMember,
      );
    } else if (
      conversation.phase === "advisors_joined" &&
      advisorDecision.introduce
    ) {
      // Add any remaining advisors not yet introduced
      const activeAdvisors = await ConversationDB.getActiveAdvisors(
        conversation.id,
      );
      const activePersonas = activeAdvisors.map(
        (a: { persona: string }) => a.persona,
      );
      const newAdvisors = advisorDecision.advisors.filter(
        (advisor: "cmo" | "coo") => !activePersonas.includes(advisor),
      );

      if (newAdvisors.length > 0) {
        respondingMember = newAdvisors[0];
        isNewAdvisorIntroduction = true;
        await ConversationDB.addAdvisorToConversation(
          conversation.id,
          respondingMember,
        );
      } else {
        // Determine responder based on message content
        respondingMember = determineResponder(userMessage, userResponseCount);
      }
    } else {
      // Default: CFO continues or determine based on content
      respondingMember =
        conversation.phase === "cfo_only"
          ? "cfo"
          : determineResponder(userMessage, userResponseCount);
    }

    // Build conversation history for context
    const historyText = messages
      .filter((msg) => msg.messageType !== "system")
      .map((msg) => {
        if (msg.messageType === "user") {
          return `User: ${msg.content}`;
        } else if (msg.messageType === "board_member") {
          const meta = (msg.metadata || {}) as { name?: string };
          return `${meta.name || msg.persona}: ${msg.content}`;
        }
        return "";
      })
      .filter((text) => text.length > 0);

    // Generate appropriate prompt
    let prompt: string;
    if (isDirectlyAddressed && !isNewAdvisorIntroduction) {
      // User directly addressed this advisor - use special direct addressing prompt
      prompt = generateDirectAddressingPrompt(
        respondingMember,
        strategy,
        historyText,
        userMessage,
      );
    } else if (isNewAdvisorIntroduction) {
      // New advisor introduction
      prompt = generateBoardMemberPrompt(
        respondingMember,
        strategy,
        historyText,
      );
    } else {
      // Regular conversation response
      prompt = generateConversationResponsePrompt(
        respondingMember,
        strategy,
        historyText,
        userMessage,
      );
    }

    // Prepare messages array with PDF support
    type PdfPart = {
      type: "file";
      file: { filename: string; file_data: string };
    };
    type TextPart = { type: "text"; text: string };
    const apiMessages: Array<{
      role: "user";
      content: string | (PdfPart | TextPart)[];
    }> = [];

    // Check if we have a PDF file to include
    if (strategy.supplementaryFile?.type === "pdf-base64") {
      apiMessages.push({
        role: "user",
        content: [
          {
            type: "file",
            file: {
              filename: strategy.supplementaryFile.name,
              file_data: `data:application/pdf;base64,${strategy.supplementaryFile.content}`,
            },
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      });
    } else {
      apiMessages.push({ role: "user", content: prompt });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: apiMessages,
        stream: true,
        max_tokens: 350,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `AI API error: ${response.status} ${response.statusText}`,
      );
    }

    const encoder = new TextEncoder();
    let fullResponse = "";
    let tokenUsage: {
      prompt_tokens?: number;
      completion_tokens?: number;
    } | null = null;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("No response body");
          }

          const decoder = new TextDecoder();
          let buffer = "";

          let finished = false;
          while (!finished) {
            const { done, value } = await reader.read();
            if (done) {
              finished = true;
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  // Save complete response to database
                  const persona = BOARD_PERSONAS[respondingMember];
                  await ConversationDB.addMessage({
                    conversationId: conversation.id,
                    messageType: "board_member",
                    persona: respondingMember,
                    content: fullResponse.trim(),
                    metadata: {
                      name: persona.name,
                      title: persona.title,
                      animalSpirit: persona.animalSpirit,
                      mantra: persona.mantra,
                      isNewIntroduction: isNewAdvisorIntroduction,
                    },
                  });

                  // Track token usage if available
                  if (tokenUsage) {
                    await ConversationDB.addTokenUsage({
                      conversationId: conversation.id,
                      requestType: isNewAdvisorIntroduction
                        ? "advisor_introduction"
                        : "message_response",
                      persona: respondingMember,
                      inputTokens: tokenUsage.prompt_tokens || 0,
                      outputTokens: tokenUsage.completion_tokens || 0,
                    });
                  }

                  // Check for artifact generation opportunity
                  const finalConversation =
                    await ConversationDB.getConversationBySessionId(sessionId);
                  if (finalConversation) {
                    const artifactOpportunity = detectArtifactOpportunity(
                      finalConversation.messages,
                      strategy,
                    );
                    if (artifactOpportunity?.shouldGenerate) {
                      console.log(
                        "Artifact generation opportunity detected:",
                        artifactOpportunity,
                      );
                      // Trigger artifact generation asynchronously
                      generateArtifactAsync(
                        sessionId,
                        artifactOpportunity.type,
                        artifactOpportunity.description,
                      );
                    }
                  }

                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || "";

                  // Capture usage data if available
                  if (parsed.usage) {
                    tokenUsage = parsed.usage;
                  }

                  if (content) {
                    fullResponse += content;
                    const persona = BOARD_PERSONAS[respondingMember];
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          content,
                          persona: respondingMember,
                          name: persona.name,
                          title: persona.title,
                          isNewIntroduction: isNewAdvisorIntroduction,
                        })}\n\n`,
                      ),
                    );
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error processing conversation message:", error);
    return new Response("Failed to process message", { status: 500 });
  }
}

// Helper function to determine which member should respond based on content
function determineResponder(
  userMessage: string,
  responseCount: number,
): "cfo" | "cmo" | "coo" {
  const messageContent = userMessage.toLowerCase();

  // Financial topics -> CFO
  if (
    messageContent.includes("cost") ||
    messageContent.includes("money") ||
    messageContent.includes("financial") ||
    messageContent.includes("revenue") ||
    messageContent.includes("profit") ||
    messageContent.includes("budget")
  ) {
    return "cfo";
  }

  // Marketing/customer topics -> CMO
  if (
    messageContent.includes("customer") ||
    messageContent.includes("market") ||
    messageContent.includes("marketing") ||
    messageContent.includes("audience") ||
    messageContent.includes("brand") ||
    messageContent.includes("growth")
  ) {
    return "cmo";
  }

  // Operations topics -> COO
  if (
    messageContent.includes("operation") ||
    messageContent.includes("scale") ||
    messageContent.includes("team") ||
    messageContent.includes("process") ||
    messageContent.includes("deliver") ||
    messageContent.includes("build")
  ) {
    return "coo";
  }

  // Round-robin based on response count if no clear topic match
  const members: ("cfo" | "cmo" | "coo")[] = ["cfo", "cmo", "coo"];
  return members[responseCount % 3];
}

// Async function to trigger artifact generation
async function generateArtifactAsync(
  sessionId: string,
  artifactType: string,
  description: string,
) {
  try {
    console.log(
      `Triggering async artifact generation for session ${sessionId}`,
    );

    // Make request to artifact generation endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/artifacts/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          artifactType,
          description,
        }),
      },
    );

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log("Artifact generated successfully:", result.artifact.title);
      } else {
        console.error("Artifact generation failed:", result.error);
      }
    } else {
      console.error(
        "Artifact generation API error:",
        response.status,
        response.statusText,
      );
    }
  } catch (error) {
    console.error("Error in async artifact generation:", error);
  }
}
