"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ConversationSession } from "@gabe/types";
import { useConversationSession } from "../../../hooks/use-conversation-session";
import { BOARD_PERSONAS } from "@gabe/ai-prompts";
import {
  Send,
  Users,
  Loader2,
  Sparkles,
  TrendingUp,
  Home,
  Clock,
  MessageCircle,
  BarChart3,
  DollarSign,
  Eye,
} from "lucide-react";
import {
  Button,
  Textarea,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ArtifactDisplay,
} from "@gabe/components";

// DomainArtifact related types removed – not directly used here

interface ConversationPageProps {
  sessionId: string;
  initialConversation: ConversationSession | null;
}

export default function ConversationPage({
  sessionId,
  initialConversation,
}: ConversationPageProps) {
  const [userMessage, setUserMessage] = useState("");
  const {
    conversation,
    artifacts,
    stats,
    isLoading,
    isResponding,
    error,
    streamingMessage,
    currentRespondingMember,
    sendUserMessage,
  } = useConversationSession({
    sessionId,
    initialConversation: initialConversation || undefined,
    pollArtifacts: true,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Effects moved below after callbacks are defined to satisfy exhaustive-deps

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Scroll on new messages/artifacts/stream updates
  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, streamingMessage, artifacts, scrollToBottom]);

  const sendMessage = () => {
    if (!userMessage.trim() || isResponding || !conversation) return;
    const msg = userMessage.trim();
    setUserMessage("");
    void sendUserMessage(msg);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getActiveAdvisors = () => {
    if (!conversation?.messages) return ["cfo"];

    const advisors = new Set(["cfo"]);
    conversation.messages.forEach((msg) => {
      if (msg.type === "board_member" && msg.persona) {
        advisors.add(msg.persona);
      }
    });

    return Array.from(advisors);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-emerald-600 font-medium">
            Loading conversation...
          </p>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>{error || "Conversation not found"}</p>
            <Link href="/">
              <Button className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeAdvisors = getActiveAdvisors();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {conversation.projectName || "Business Strategy Discussion"}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(conversation.createdAt).toLocaleDateString()}
                  </div>
                  <Badge
                    variant={
                      conversation.status === "active" ? "default" : "secondary"
                    }
                  >
                    {conversation.status}
                  </Badge>
                  <Badge variant="outline">
                    {conversation.phase?.replace("_", " ") || "active"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="hidden md:flex items-center space-x-6 text-sm">
                <div className="flex items-center text-gray-600">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {stats.messageCount} messages
                </div>
                <div className="flex items-center text-gray-600">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  {stats.artifactCount} charts
                </div>
                <div className="flex items-center text-gray-600">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {stats.totalTokens?.toLocaleString?.() || 0} tokens
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Active Advisors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeAdvisors.map((advisorKey) => {
                  const advisor =
                    BOARD_PERSONAS[advisorKey as keyof typeof BOARD_PERSONAS];
                  return (
                    <div
                      key={advisorKey}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="relative w-30 h-30">
                        <Image
                          src={advisor.avatar}
                          alt={advisor.name}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {advisor.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {advisor.title}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Conversation URL Share */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Share Conversation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Share this conversation URL to continue later or with others:
                </p>
                <div className="bg-gray-50 p-2 rounded text-xs break-all font-mono">
                  {typeof window !== "undefined" ? window.location.href : ""}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Messages */}
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle>Boardroom Discussion</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {conversation.messages.map((message, index) => (
                    <div key={message.id || index}>
                      {message.type === "system" && (
                        <div className="text-center">
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm">
                            <Sparkles className="w-4 h-4 mr-1" />
                            {message.content}
                          </div>
                        </div>
                      )}

                      {message.type === "user" && (
                        <div className="flex justify-end">
                          <div className="max-w-[80%] bg-emerald-600 text-white p-4 rounded-lg">
                            <p>{message.content}</p>
                          </div>
                        </div>
                      )}

                      {message.type === "board_member" && (
                        <div className="flex items-start space-x-3">
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <Image
                              src={
                                BOARD_PERSONAS[
                                  message.persona as keyof typeof BOARD_PERSONAS
                                ]?.avatar ||
                                "/images/orion_guardian_cfo_owl.png"
                              }
                              alt={message.name || "Board Member"}
                              fill
                              className="rounded-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="bg-white border rounded-lg p-4 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {message.name || "Board Member"}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {message.title}
                                  </p>
                                </div>
                                {message.isNewIntroduction && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Just joined!
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-800">{message.content}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Streaming message */}
                  {isResponding &&
                    currentRespondingMember &&
                    streamingMessage && (
                      <div className="flex items-start space-x-3">
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <Image
                            src={BOARD_PERSONAS[currentRespondingMember].avatar}
                            alt={BOARD_PERSONAS[currentRespondingMember].name}
                            fill
                            className="rounded-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="bg-white border rounded-lg p-4 shadow-sm">
                            <div className="flex items-center mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {BOARD_PERSONAS[currentRespondingMember].name}
                              </h4>
                              <div className="ml-2 flex space-x-1">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                                <div
                                  className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                  className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                              </div>
                            </div>
                            <p className="text-gray-800">{streamingMessage}</p>
                          </div>
                        </div>
                      </div>
                    )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t pt-4">
                  <div className="flex space-x-2">
                    <Textarea
                      ref={textareaRef}
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        conversation.isActive
                          ? "Ask a question or provide more details... (try addressing specific advisors like 'CMO, what do you think?')"
                          : "This conversation has ended"
                      }
                      className="flex-1 min-h-[80px] resize-none"
                      disabled={!conversation.isActive || isResponding}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={
                        !userMessage.trim() ||
                        isResponding ||
                        !conversation.isActive
                      }
                      className="self-end"
                    >
                      {isResponding ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Artifacts */}
            {artifacts.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Generated Insights & Charts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {artifacts.map((artifact) => (
                      <ArtifactDisplay key={artifact.id} artifact={artifact} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
