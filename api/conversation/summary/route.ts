import { NextRequest, NextResponse } from "next/server";
import {
  ConversationSummaryRequestSchema,
  ExecutiveSummarySchema,
  ErrorResponse,
} from "@/packages/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = ConversationSummaryRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: "Invalid conversation data",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }
    const { conversation } = parsed.data;

    // Build conversation context for summary generation
    const strategyInfo = [];
    if (conversation.strategy.projectName)
      strategyInfo.push(`Project: ${conversation.strategy.projectName}`);
    if (conversation.strategy.oneSentenceSummary)
      strategyInfo.push(`Summary: ${conversation.strategy.oneSentenceSummary}`);
    if (conversation.strategy.targetCustomer)
      strategyInfo.push(
        `Target Customer: ${conversation.strategy.targetCustomer}`,
      );
    if (conversation.strategy.keyProblem)
      strategyInfo.push(`Key Problem: ${conversation.strategy.keyProblem}`);
    if (conversation.strategy.estimatedCost)
      strategyInfo.push(
        `Estimated Cost: ${conversation.strategy.estimatedCost}`,
      );
    if (conversation.strategy.detailedDescription)
      strategyInfo.push(
        `Description: ${conversation.strategy.detailedDescription}`,
      );

    const strategyText =
      strategyInfo.length > 0
        ? strategyInfo.join("\n")
        : "Limited strategy information provided";

    // Extract conversation history
    const conversationHistory = conversation.messages
      .filter((msg) => msg.type !== "system")
      .map((msg) => {
        if (msg.type === "user") {
          return `User: ${msg.content}`;
        } else if (msg.type === "board_member") {
          return `${msg.name} (${msg.title}): ${msg.content}`;
        }
        return "";
      })
      .filter((text) => text.length > 0)
      .join("\n\n");

    const summaryPrompt = `You are an executive assistant creating a comprehensive summary of a boardroom conversation about a business strategy.

ORIGINAL STRATEGY INFORMATION:
${strategyText}

FULL CONVERSATION TRANSCRIPT:
${conversationHistory}

INSTRUCTIONS:
1. Analyze the entire conversation to understand the strategy and feedback provided
2. Identify 3-4 key risks mentioned by board members across the conversation
3. Identify 3-4 key opportunities highlighted during the discussion
4. Provide 4-5 specific, actionable recommendations based on the conversation
5. Give an overall assessment of the strategy's viability and next steps
6. Consider how the conversation evolved and what new insights emerged

Respond in JSON format with the following structure:
{
  "overallAssessment": "A 2-3 sentence overall assessment based on the full conversation",
  "keyRisks": ["risk1", "risk2", "risk3", "risk4"],
  "keyOpportunities": ["opportunity1", "opportunity2", "opportunity3", "opportunity4"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3", "recommendation4", "recommendation5"],
  "conversationHighlights": ["highlight1", "highlight2", "highlight3"]
}

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: summaryPrompt }],
        max_tokens: 1200,
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `AI API error: ${response.status} ${response.statusText}`,
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content received from AI API");

    // Validate AI JSON – if invalid, fall back below
    const parsedSummary = (() => {
      try {
        return JSON.parse(content);
      } catch {
        return null;
      }
    })();
    const validated = parsedSummary
      ? ExecutiveSummarySchema.safeParse(parsedSummary)
      : null;

    if (validated?.success) {
      return NextResponse.json({
        success: true,
        executiveSummary: validated.data,
      });
    }
    // else fall through to fallback summary
  } catch (error) {
    console.error("Error generating conversation summary:", error);

    // Provide fallback summary
    const fallbackSummary = {
      overallAssessment:
        "Based on your boardroom conversation, your strategy shows potential but would benefit from further development in key areas identified by our board members.",
      keyRisks: [
        "Market validation needs more comprehensive research",
        "Financial projections require stronger supporting data",
        "Operational scalability needs detailed planning",
        "Competitive positioning could be strengthened",
      ],
      keyOpportunities: [
        "Strong market demand for innovative solutions",
        "Potential for significant customer impact",
        "Opportunity to establish market leadership",
        "Scalable business model with growth potential",
      ],
      recommendations: [
        "Conduct thorough market research and validation",
        "Develop detailed financial models with multiple scenarios",
        "Create comprehensive operational plans for scaling",
        "Strengthen competitive differentiation strategy",
        "Build strategic partnerships to accelerate growth",
      ],
      conversationHighlights: [
        "Board members provided valuable insights across financial, marketing, and operational areas",
        "Key questions were raised about market validation and competitive positioning",
        "Opportunities for improvement were identified in multiple strategic areas",
      ],
    };

    return NextResponse.json({
      success: true,
      executiveSummary: fallbackSummary,
      fallback: true,
    });
  }
}
