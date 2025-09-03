
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BusinessStrategy, ChatMessage, ConversationSession } from '@/lib/types';
import { BOARD_PERSONAS } from '@/lib/board-prompts';
import { Send, Users, Loader2, ArrowRight, Sparkles, TrendingUp, Link, Copy, BarChart3, Hash, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ArtifactDisplay from '@/components/charts/artifact-display';

interface ConversationalBoardroomProps {
  strategy: BusinessStrategy;
}

export default function ConversationalBoardroom({ strategy }: ConversationalBoardroomProps) {
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
  const [urlCopied, setUrlCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    startConversation();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, streamingMessage, artifacts]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startConversation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/conversation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ strategy }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const result = await response.json();
      
      if (result.success) {
        setConversation(result.conversation);
        // Store conversation for potential summary page
        sessionStorage.setItem('conversationSession', JSON.stringify(result.conversation));
      } else {
        setError(result.error || 'Failed to start conversation');
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError('Failed to start conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userMessage.trim() || !conversation || isResponding) return;

    const messageToSend = userMessage.trim();
    setUserMessage('');
    setIsResponding(true);
    setStreamingMessage('');

    // Immediately echo the user's message locally for snappy UX
    setConversation(prev => prev ? {
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: String(Date.now()),
          type: 'user',
          content: messageToSend,
          timestamp: new Date().toISOString(),
          isComplete: true
        } as any
      ]
    } : prev);

    try {
      const response = await fetch('/api/conversation/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: conversation.sessionId,
          userMessage: messageToSend
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let partialRead = '';
      let fullResponse = '';
      let respondingMember: 'cfo' | 'cmo' | 'coo' | null = null;
      let isNewIntroduction = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          partialRead += decoder.decode(value, { stream: true });
          let lines = partialRead.split('\n');
          partialRead = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                // Refresh conversation from database to get updated messages
                await refreshConversation();
                setStreamingMessage('');
                setIsResponding(false);
                setCurrentRespondingMember(null);
                
                // Check for new artifacts
                await checkForArtifacts();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.content || '';
                if (content) {
                  fullResponse += content;
                  setStreamingMessage(fullResponse);
                  
                  // Set responding member and introduction status
                  if (parsed.persona && !respondingMember) {
                    respondingMember = parsed.persona;
                    isNewIntroduction = parsed.isNewIntroduction || false;
                    setCurrentRespondingMember(respondingMember);
                  }
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      setIsResponding(false);
      setCurrentRespondingMember(null);
      setStreamingMessage('');
    }
  };

  const refreshConversation = async () => {
    if (!conversation?.sessionId) return;

    try {
      const response = await fetch(`/api/conversation/${conversation.sessionId}`, {
        method: 'GET',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConversation(result.conversation);
          if (result.conversation.stats) {
            setStats(result.conversation.stats);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing conversation:', error);
    }
  };

  const checkForArtifacts = async () => {
    if (!conversation?.sessionId) return;

    try {
      const response = await fetch(`/api/conversation/${conversation.sessionId}/artifacts`, {
        method: 'GET',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.artifacts) {
          setArtifacts(result.artifacts);
        }
      }
    } catch (error) {
      console.error('Error checking for artifacts:', error);
    }
  };

  const copyConversationUrl = async () => {
    if (!conversation?.sessionId) return;
    
    const url = `${window.location.origin}/conversation/${conversation.sessionId}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const openConversationUrl = () => {
    if (!conversation?.sessionId) return;
    
    const url = `/conversation/${conversation.sessionId}`;
    window.open(url, '_blank');
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
      await refreshConversation();
    } catch (err) {
      console.error('Attach error:', err);
      setError('Failed to attach file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };



  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const proceedToSummary = () => {
    router.push('/summary');
  };

  const getPersonaGradient = (memberType: 'cfo' | 'cmo' | 'coo') => {
    switch (memberType) {
      case 'cfo': return 'from-amber-400 to-orange-500'; // Owl colors
      case 'cmo': return 'from-emerald-400 to-teal-500'; // Peacock colors
      case 'coo': return 'from-amber-600 to-yellow-500'; // Beaver colors
      default: return 'from-gray-400 to-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="bg-white rounded-2xl shadow-lg border p-8 max-w-md mx-auto">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Starting Boardroom Session</h3>
            <p className="text-gray-600">
              Our virtual board members are preparing to discuss your strategy...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md mx-auto">
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={startConversation}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-emerald-400 to-blue-500 p-3 rounded-2xl">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
            Boardroom Conversation
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Chat with our virtual board members about "{strategy.projectName || 'your strategy'}". 
          They will provide insights to help you build something practical.
        </p>
      </div>

      {/* Conversation Controls & Stats */}
      {conversation && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Conversation URL Sharing */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Link className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">Continue Later</h3>
              </div>
              <Button 
                onClick={openConversationUrl}
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Open
              </Button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Save this conversation URL to continue anytime or share with others.
            </p>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-xs font-mono text-gray-700 truncate">
                {typeof window !== 'undefined' ? `${window.location.origin}/conversation/${conversation.sessionId}` : 'Loading...'}
              </div>
              <Button 
                onClick={copyConversationUrl}
                variant="outline" 
                size="sm"
                className="shrink-0"
              >
                {urlCopied ? (
                  <span className="text-green-600 text-xs">Copied!</span>
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Token Usage Stats */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">Conversation Stats</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MessageCircle className="w-3 h-3 text-gray-500" />
                </div>
                <p className="font-semibold text-gray-900">
                  {stats?.messageCount || conversation.messages.length}
                </p>
                <p className="text-xs text-gray-500">Messages</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3 text-gray-500" />
                </div>
                <p className="font-semibold text-gray-900">
                  {stats?.artifactCount || artifacts.length}
                </p>
                <p className="text-xs text-gray-500">Charts</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Hash className="w-3 h-3 text-gray-500" />
                </div>
                <p className="font-semibold text-gray-900">
                  {stats?.totalTokens?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-500">Tokens</p>
              </div>
            </div>
            {(
              <div className="mt-3 pt-3 border-t text-center">
                <p className="text-xs text-gray-500">
                  Tokens used: <span className="font-medium">#{(stats?.totalTokens || 0).toLocaleString()}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
        {/* Messages Area */}
  <div className="max-h-[70vh] md:max-h-[65vh] overflow-y-auto p-6 space-y-6 bg-gradient-to-br from-gray-50/50 to-white">
          {conversation.messages.map((message, index) => {
            // Check for artifacts that should appear after this message
            const messageArtifacts = artifacts.filter(artifact => {
              // Show artifacts after the last few messages for now
              return index >= conversation.messages.length - 2;
            });

            return (
              <div key={message.id}>
                {/* Message */}
                <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                  <div className={`max-w-3xl ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' 
                      : message.type === 'system'
                      ? 'bg-gray-100 text-gray-700 border-l-4 border-gray-400'
                      : message.type === 'artifact_generated'
                      ? 'bg-blue-50 text-blue-800 border-l-4 border-blue-400'
                      : 'bg-white text-gray-900 shadow-md border border-gray-100'
                  } rounded-2xl p-4`}>
                    {message.type === 'board_member' && (
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative w-20 h-20 rounded-full overflow-hidden">
                          {message.persona && (
                            <Image
                              src={BOARD_PERSONAS[message.persona].avatar}
                              alt={`${BOARD_PERSONAS[message.persona].name} avatar`}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{message.name}</p>
                          <p className="text-xs text-gray-500">{message.title}</p>
                          {message.persona && (
                            <p className="text-xs text-gray-400">
                              {BOARD_PERSONAS[message.persona].animalSpirit} • "{BOARD_PERSONAS[message.persona].mantra}"
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {message.type === 'artifact_generated' && (
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-sm">Generated Visualization</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                </div>

                {/* Show artifacts after this message */}
                {index === conversation.messages.length - 1 && artifacts.length > 0 && (
                  <div className="mb-6">
                    {artifacts.map((artifact) => (
                      <ArtifactDisplay key={artifact.id} artifact={artifact} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Streaming Message */}
          {isResponding && currentRespondingMember && (
            <div className="flex justify-start">
              <div className="max-w-3xl bg-white text-gray-900 shadow-md border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden">
                    <Image
                      src={BOARD_PERSONAS[currentRespondingMember].avatar}
                      alt={`${BOARD_PERSONAS[currentRespondingMember].name} avatar`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{BOARD_PERSONAS[currentRespondingMember].name}</p>
                    <p className="text-xs text-gray-500">{BOARD_PERSONAS[currentRespondingMember].title}</p>
                    <p className="text-xs text-gray-400">
                      {BOARD_PERSONAS[currentRespondingMember].animalSpirit}
                    </p>
                  </div>
                  {!streamingMessage && (
                    <>
                      <img src="/images/processing.gif" alt="Processing" className="w-5 h-5 ml-2" onError={(e: any) => { e.currentTarget.style.display='none'; }} />
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500 ml-2" />
                    </>
                  )}
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{streamingMessage}</p>
                {!streamingMessage && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-gray-50/50 p-6">
          <div className="flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response or ask a question... (try 'CMO, what do you think?' to address specific advisors)"
              className="flex-1 min-h-[80px] resize-none border-0 shadow-sm bg-white rounded-xl"
              disabled={isResponding}
            />
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center text-xs px-3 py-2 border rounded cursor-pointer">
                <input type="file" accept=".pdf,.md,.txt" className="hidden" onChange={onAttachFile} disabled={uploading || isResponding} />
                {uploading ? 'Attaching…' : 'Attach file'}
              </label>
              <Button
              onClick={sendMessage}
              disabled={!userMessage.trim() || isResponding}
              className="self-end bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl"
            >
              <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <p className="text-xs text-gray-500">
              Press Enter to send, Shift+Enter for new line
            </p>
            <Button
              onClick={proceedToSummary}
              variant="outline"
              className="text-sm rounded-xl border-gray-200 hover:bg-gray-50"
            >
              End Session & View Summary
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Board Members Info */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        {Object.entries(BOARD_PERSONAS).map(([key, persona]) => (
          <div key={key} className="bg-white rounded-2xl border shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300">
            <div className="relative w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden">
              <Image
                src={persona.avatar}
                alt={`${persona.name} avatar`}
                fill
                className="object-cover"
              />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-1">{persona.name}</h3>
            <p className="text-sm text-emerald-600 font-medium mb-2">{persona.title}</p>
            <p className="text-xs text-gray-500 mb-3">{persona.animalSpirit}</p>
            <p className="text-xs text-gray-600 italic mb-3">"{persona.mantra}"</p>
            <p className="text-xs text-gray-600">{persona.focus}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
