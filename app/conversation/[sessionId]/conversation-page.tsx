

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { BusinessStrategy, ConversationSession } from '@/lib/types';
import { BOARD_PERSONAS } from '@/lib/board-prompts';
import { 
  Send, 
  Users, 
  Loader2, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  Home,
  Clock,
  MessageCircle,
  BarChart3,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ArtifactDisplay from '@/components/charts/artifact-display';

interface ConversationPageProps {
  sessionId: string;
  initialConversation: any;
}

export default function ConversationPage({ sessionId, initialConversation }: ConversationPageProps) {
  const router = useRouter();
  const [conversation, setConversation] = useState<ConversationSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userMessage, setUserMessage] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [currentRespondingMember, setCurrentRespondingMember] = useState<'cfo' | 'cmo' | 'coo' | null>(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const proceedToSummary = async () => {
    try {
      // Persist the latest conversation snapshot for the Summary page
      if (conversation) {
        sessionStorage.setItem('conversationSession', JSON.stringify(conversation));
      }
      // Mark conversation as completed (best-effort)
      if (conversation?.sessionId) {
        fetch(`/api/conversation/${conversation.sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed', phase: 'completed' })
        }).catch(() => {});
      }
      router.push('/summary');
    } catch (e) {
      router.push('/summary');
    }
  };

  useEffect(() => {
    if (initialConversation) {
      loadConversationData(initialConversation);
  // Hydrate with API response to include up-to-date stats and counts
  // Slight delay to avoid blocking initial paint
  setTimeout(() => { loadConversation(); }, 0);
    } else {
      loadConversation();
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, streamingMessage, artifacts]);

  // Poll for new artifacts periodically
  useEffect(() => {
    if (conversation?.isActive) {
      const interval = setInterval(loadArtifacts, 5000);
      return () => clearInterval(interval);
    }
  }, [conversation?.isActive]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationData = (conversationData: any) => {
    try {
      const formattedMessages = conversationData.messages?.map((msg: any) => ({
        id: msg.id,
        type: msg.messageType === 'board_member' ? 'board_member' : msg.messageType,
        persona: msg.persona,
        name: msg.metadata?.name,
        title: msg.metadata?.title,
        animalSpirit: msg.metadata?.animalSpirit,
        mantra: msg.metadata?.mantra,
        content: msg.content,
        timestamp: msg.createdAt,
        isComplete: msg.isComplete,
        isNewIntroduction: msg.metadata?.isNewIntroduction || false
      })) || [];

      const formattedArtifacts = conversationData.artifacts?.map((artifact: any) => ({
        id: artifact.id,
        type: artifact.artifactType,
        chartType: artifact.chartType,
        title: artifact.title,
        description: artifact.description,
        data: artifact.data,
        config: artifact.config,
        createdAt: artifact.createdAt
      })) || [];

      setConversation({
        sessionId: conversationData.sessionId,
        id: conversationData.id,
        projectName: conversationData.projectName,
        phase: conversationData.phase,
        status: conversationData.status,
        strategy: conversationData.strategy as BusinessStrategy,
        messages: formattedMessages,
        isActive: conversationData.status === 'active',
        createdAt: conversationData.createdAt,
        lastActivity: conversationData.updatedAt
      });

      setArtifacts(formattedArtifacts);
      if ((conversationData as any).stats) {
        setStats((conversationData as any).stats);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error processing conversation data:', error);
      setError('Failed to load conversation data');
      setIsLoading(false);
    }
  };

  const loadConversation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/conversation/${sessionId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Conversation not found');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load conversation');
      }

  setConversation(data.conversation);
  setArtifacts(data.conversation.artifacts || []);
  setStats(data.conversation.stats || null);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading conversation:', error);
      setError('Failed to load conversation');
      setIsLoading(false);
    }
  };

  const loadArtifacts = async () => {
    try {
      const response = await fetch(`/api/conversation/${sessionId}/artifacts`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.artifacts) {
          setArtifacts(data.artifacts);
        }
      }
    } catch (error) {
      console.error('Error loading artifacts:', error);
    }
  };

  // Lightweight stats refresh without reloading entire conversation
  const refreshStats = async () => {
    try {
      const res = await fetch(`/api/conversation/${sessionId}/stats`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setStats(data.stats);
      }
    } catch (e) {
      console.error('Error refreshing stats:', e);
    }
  };

  const onAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!conversation || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setUploading(true);
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/conversation/${conversation.sessionId}/upload`, {
        method: 'POST',
        body: form
      });
      if (!res.ok) throw new Error('Upload failed');
      await loadConversation();
    } catch (err) {
      console.error('Attach error:', err);
      setError('Failed to attach file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const sendMessage = async () => {
    if (!userMessage.trim() || isResponding || !conversation) return;

    try {
      setIsResponding(true);
      setCurrentRespondingMember(null);
      setStreamingMessage('');
      setError(null);

      // Add user message to local state immediately
      const userMsgObj = {
        id: Date.now().toString(),
        type: 'user' as const,
        content: userMessage.trim(),
        timestamp: new Date().toISOString(),
        isComplete: true
      };

      setConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, userMsgObj]
      } : null);

      const messageToSend = userMessage.trim();
      setUserMessage('');

      const response = await fetch('/api/conversation/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: conversation.sessionId,
          userMessage: messageToSend,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentMember: any = null;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsResponding(false);
              setCurrentRespondingMember(null);
              setStreamingMessage('');
              
              // Reload conversation to get the complete saved message
              await loadConversation();
              // And update stats lightweight
              await refreshStats();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.persona && !currentMember) {
                currentMember = {
                  persona: parsed.persona,
                  name: parsed.name,
                  title: parsed.title,
                  isNewIntroduction: parsed.isNewIntroduction
                };
                setCurrentRespondingMember(parsed.persona);
              }

              if (parsed.content) {
                setStreamingMessage(prev => prev + parsed.content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      setIsResponding(false);
      setCurrentRespondingMember(null);
      setStreamingMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getActiveAdvisors = () => {
    if (!conversation?.messages) return ['cfo'];
    
    const advisors = new Set(['cfo']);
    conversation.messages.forEach(msg => {
      if (msg.type === 'board_member' && msg.persona) {
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
          <p className="text-emerald-600 font-medium">Loading conversation...</p>
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
            <p>{error || 'Conversation not found'}</p>
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
                  {conversation.projectName || 'Business Strategy Discussion'}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(conversation.createdAt).toLocaleDateString()}
                  </div>
                  <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'}>
                    {conversation.status}
                  </Badge>
                  <Badge variant="outline">
                    {conversation.phase?.replace('_', ' ') || 'active'}
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
                  <span className="w-4 h-4 mr-1 text-center">#</span>
                  {stats.totalTokens.toLocaleString()} tokens
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
                {activeAdvisors.map(advisorKey => {
                  const advisor = BOARD_PERSONAS[advisorKey as keyof typeof BOARD_PERSONAS];
                  return (
                    <div key={advisorKey} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
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

            {/* Attached File */}
            {conversation.strategy?.supplementaryFile && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-emerald-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 7V17C8 18.657 9.343 20 11 20C12.657 20 14 18.657 14 17V6C14 4.343 12.657 3 11 3C9.343 3 8 4.343 8 6V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Attached File
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700">
                    <p className="font-medium break-words">{conversation.strategy.supplementaryFile.name}</p>
                    <p className="text-xs text-gray-500 mb-3">Type: {conversation.strategy.supplementaryFile.type}</p>
                    {conversation.strategy.supplementaryFile.type === 'pdf-base64' ? (
                      <div className="text-xs text-gray-600">
                        <p className="mb-2">PDF attached. Advisors will reference it when relevant.</p>
                        {conversation.strategy.supplementaryFile.textExcerpt && (
                          <div className="bg-gray-50 border rounded p-2 max-h-40 overflow-y-auto whitespace-pre-wrap">
                            {conversation.strategy.supplementaryFile.textExcerpt.slice(0, 500)}
                            {conversation.strategy.supplementaryFile.textExcerpt.length > 500 ? '…' : ''}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600 bg-gray-50 border rounded p-2 max-h-40 overflow-y-auto whitespace-pre-wrap">
                        {conversation.strategy.supplementaryFile.content?.slice(0, 500)}
                        {conversation.strategy.supplementaryFile.content && conversation.strategy.supplementaryFile.content.length > 500 ? '…' : ''}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

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
                  {typeof window !== 'undefined' ? window.location.href : ''}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Messages */}
            <Card className="h-[70vh] flex flex-col">
              <CardHeader>
                <CardTitle>Boardroom Discussion</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {conversation.messages.map((message, index) => (
                    <div key={message.id || index}>
                      {message.type === 'system' && (
                        <div className="text-center">
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm">
                            <Sparkles className="w-4 h-4 mr-1" />
                            {message.content}
                          </div>
                        </div>
                      )}

                      {message.type === 'user' && (
                        <div className="flex justify-end">
                          <div className="max-w-[80%] bg-emerald-600 text-white p-4 rounded-lg">
                            <p>{message.content}</p>
                          </div>
                        </div>
                      )}

                      {message.type === 'board_member' && (
                        <div className="flex items-start space-x-3">
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <Image
                              src={BOARD_PERSONAS[message.persona as keyof typeof BOARD_PERSONAS]?.avatar || '/images/orion_guardian_cfo_owl.png'}
                              alt={message.name || 'Board Member'}
                              fill
                              className="rounded-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="bg-white border rounded-lg p-4 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {message.name || 'Board Member'}
                                  </h4>
                                  <p className="text-sm text-gray-600">{message.title}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {message.isNewIntroduction && (
                                    <Badge variant="secondary" className="text-xs">
                                      Just joined!
                                    </Badge>
                                  )}
                                  {message.providerUsed && (
                                    <Badge variant="outline" className="text-[10px]">
                                      {message.providerUsed === 'openai' ? 'OpenAI' : 'Local'}
                                    </Badge>
                                  )}
                                  {message as any && (message as any).tokens && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge variant="outline" className="text-[10px] cursor-help"># tokens</Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <div className="text-xs">
                                            <div>Input: {(message as any).tokens.input}</div>
                                            <div>Output: {(message as any).tokens.output}</div>
                                            <div>Total: {(message as any).tokens.total}</div>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </div>
                              <p className="text-gray-800">{message.content}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Streaming message */}
                  {isResponding && currentRespondingMember && (
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
                            {!streamingMessage && (
                              <div className="ml-2 flex items-center space-x-2">
                                <img src="/images/processing.gif" alt="Processing" className="w-5 h-5" onError={(e: any) => { e.currentTarget.style.display='none'; }} />
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                              </div>
                            )}
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
                  <div className="flex space-x-2 items-end">
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
                    <div>
                      <label className="inline-flex items-center text-sm px-3 py-2 border rounded mr-2 cursor-pointer">
                        <input type="file" accept=".pdf,.md,.txt" className="hidden" onChange={onAttachFile} disabled={uploading || isResponding} />
                        {uploading ? 'Attaching…' : 'Attach file'}
                      </label>
                      <Button
                      onClick={sendMessage}
                      disabled={!userMessage.trim() || isResponding || !conversation.isActive}
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
                  <div className="flex justify-end mt-3">
                    <Button variant="outline" onClick={proceedToSummary}>
                      End Session & View Summary
                      <ArrowRight className="w-4 h-4 ml-1" />
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
                    {artifacts.map(artifact => (
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
