import { Suspense } from "react";
import { notFound } from "next/navigation";
import ConversationPage from "./conversation-page";
import ConversationDB from "@/lib/conversation-db";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { sessionId: string };
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps) {
  const { sessionId } = params;

  try {
    const conversation =
      await ConversationDB.getConversationBySessionId(sessionId);

    if (!conversation) {
      return {
        title: "Conversation Not Found - Simulated Boardroom",
        description: "The requested conversation could not be found.",
      };
    }

    const projectName = conversation.projectName || "Business Strategy";

    return {
      title: `${projectName} - Boardroom Discussion`,
      description: `Continue your boardroom discussion about ${projectName} with our AI advisors.`,
    };
  } catch (error) {
    return {
      title: "Conversation - Simulated Boardroom",
      description: "Continue your boardroom discussion with our AI advisors.",
    };
  }
}

export default async function Page({ params }: PageProps) {
  const { sessionId } = params;

  if (!sessionId) {
    notFound();
  }

  try {
    // Pre-load conversation data on server
    const conversation =
      await ConversationDB.getConversationBySessionId(sessionId);

    if (!conversation) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="text-emerald-600 font-medium">
                  Loading conversation...
                </p>
              </div>
            </div>
          }
        >
          <ConversationPage
            sessionId={sessionId}
            initialConversation={conversation}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("Error loading conversation page:", error);
    notFound();
  }
}
