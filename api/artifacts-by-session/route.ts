import { NextRequest, NextResponse } from "next/server";
import ConversationDB from "@/lib/conversation-db";
import { Artifact } from "@prisma/client";
import { SessionIdParamSchema, ErrorResponse } from "@gabe/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionIdRaw = searchParams.get("sessionId");
    const sessionValidation = SessionIdParamSchema.safeParse({
      sessionId: sessionIdRaw,
    });
    if (!sessionValidation.success) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: "Session ID is required",
          issues: sessionValidation.error.flatten(),
        },
        { status: 400 },
      );
    }
    const { sessionId } = sessionValidation.data;

    // Get conversation from database
    const conversation =
      await ConversationDB.getConversationBySessionId(sessionId);

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 },
      );
    }

    // Format artifacts for frontend
    const formattedArtifacts =
      conversation.artifacts?.map((artifact: Artifact) => ({
        id: artifact.id,
        type: artifact.artifactType,
        chartType: artifact.chartType,
        title: artifact.title,
        description: artifact.description,
        data: artifact.data,
        config: artifact.config,
        createdAt: artifact.createdAt.toISOString(),
      })) || [];

    return NextResponse.json({
      success: true,
      artifacts: formattedArtifacts,
    });
  } catch (error) {
    console.error("Error retrieving conversation artifacts:", error);
    return NextResponse.json<ErrorResponse>(
      { success: false, error: "Failed to retrieve artifacts" },
      { status: 500 },
    );
  }
}
