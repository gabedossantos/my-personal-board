import { NextRequest, NextResponse } from "next/server";
import {
  StartConversationRequestSchema,
  ErrorResponse,
  StartConversationRequest,
} from "@gabe/types/api-schemas";
import { generateBoardMemberPrompt, BOARD_PERSONAS } from "@gabe/ai-prompts";
import ConversationDB from "@/lib/conversation-db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = StartConversationRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: "Invalid request",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }
    const { strategy }: StartConversationRequest = parsed.data;

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create conversation in database
    const conversation = await ConversationDB.createConversation({
      sessionId,
      strategy,
      projectName: strategy.projectName || "Untitled Project",
    });

    // Add initial system message
    const hasMinimalInfo = !!(
      strategy.projectName ||
      strategy.oneSentenceSummary ||
      strategy.detailedDescription
    );

    const systemMessage = hasMinimalInfo
      ? "Welcome to the boardroom! Orion, our CFO, will start by discussing the financial aspects of your strategy."
      : "Welcome to the boardroom! Orion, our CFO, will begin with some questions to understand your business concept.";

    await ConversationDB.addMessage({
      conversationId: conversation.id,
      messageType: "system",
      content: systemMessage,
    });

    // Generate CFO greeting only
    try {
      const persona = BOARD_PERSONAS.cfo;
      const prompt = generateBoardMemberPrompt("cfo", strategy);

      // Prepare messages array with PDF support for API call
      type FilePart = {
        type: "file";
        file: { filename: string; file_data: string };
      };
      type TextPart = { type: "text"; text: string };
      const apiMessages: Array<{
        role: "user";
        content: string | (FilePart | TextPart)[];
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

      console.log("Making API call to generate CFO response...");
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: apiMessages,
            max_tokens: 300,
            temperature: 0.7,
          }),
        },
      );

      if (response.ok) {
        const aiResult = await response.json();
        const content = aiResult.choices?.[0]?.message?.content;

        // Track token usage
        const usage = aiResult.usage;
        if (usage) {
          await ConversationDB.addTokenUsage({
            conversationId: conversation.id,
            requestType: "cfo_greeting",
            persona: "cfo",
            inputTokens: usage.prompt_tokens || 0,
            outputTokens: usage.completion_tokens || 0,
          });
        }

        if (content) {
          console.log("CFO response received, saving to database...");
          await ConversationDB.addMessage({
            conversationId: conversation.id,
            messageType: "board_member",
            persona: "cfo",
            content: content.trim(),
            metadata: {
              name: persona.name,
              title: persona.title,
              animalSpirit: persona.animalSpirit,
              mantra: persona.mantra,
            },
          });
        } else {
          throw new Error("No content in CFO response");
        }
      } else {
        const errorText = await response.text();
        console.error(
          "CFO API error:",
          response.status,
          response.statusText,
          errorText,
        );
        throw new Error(`API error: ${response.status}`);
      }
    } catch (memberError) {
      console.error("Error generating CFO response:", memberError);

      // Add fallback message
      const persona = BOARD_PERSONAS.cfo;
      await ConversationDB.addMessage({
        conversationId: conversation.id,
        messageType: "board_member",
        persona: "cfo",
        content: `Hello! I'm ${persona.name}, your ${persona.title}. I'm excited to discuss your business strategy! Could you start by telling me about the core problem or opportunity you're addressing?`,
        metadata: {
          name: persona.name,
          title: persona.title,
          animalSpirit: persona.animalSpirit,
          mantra: persona.mantra,
        },
      });
    }

    // Fetch the complete conversation with messages
    const completeConversation =
      await ConversationDB.getConversationBySessionId(sessionId);

    if (!completeConversation) {
      throw new Error("Failed to retrieve conversation after creation");
    }

    return NextResponse.json({
      success: true,
      conversation: {
        sessionId: completeConversation.sessionId,
        id: completeConversation.id,
        phase: completeConversation.phase,
        status: completeConversation.status,
        strategy: completeConversation.strategy,
        messages: completeConversation.messages.map((msg) => ({
          id: msg.id,
          type:
            msg.messageType === "board_member"
              ? "board_member"
              : msg.messageType,
          persona: msg.persona,
          name: (msg.metadata as { name?: string } | null)?.name,
          title: (msg.metadata as { title?: string } | null)?.title,
          content: msg.content,
          timestamp: msg.createdAt.toISOString(),
          isComplete: msg.isComplete,
        })),
        isActive: completeConversation.status === "active",
        createdAt: completeConversation.createdAt.toISOString(),
        lastActivity: completeConversation.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error starting conversation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to start conversation. Please try again.",
      },
      { status: 500 },
    );
  }
}
