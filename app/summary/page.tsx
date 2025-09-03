
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConversationSession } from '@/lib/types';
import { CheckCircle, AlertTriangle, TrendingUp, ArrowRight, RotateCcw, Loader2, MessageSquare } from 'lucide-react';

interface ExecutiveSummary {
  overallAssessment: string;
  keyRisks: string[];
  keyOpportunities: string[];
  recommendations: string[];
  conversationHighlights: string[];
}

export default function SummaryPage() {
  const router = useRouter();
  const [conversation, setConversation] = useState<ConversationSession | null>(null);
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  useEffect(() => {
    // Get conversation session from sessionStorage
    const conversationData = sessionStorage.getItem('conversationSession');
    
    if (!conversationData) {
      // Redirect to strategy input if no data found
      router.push('/strategy-input');
      return;
    }

    try {
      const parsedConversation = JSON.parse(conversationData) as ConversationSession;
      setConversation(parsedConversation);
      generateExecutiveSummary(parsedConversation);
    } catch (error) {
      console.error('Error parsing conversation data:', error);
      router.push('/strategy-input');
      return;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const generateExecutiveSummary = async (conversationData: ConversationSession) => {
    try {
      setGeneratingSummary(true);
      
      const response = await fetch('/api/conversation/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversation: conversationData }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const result = await response.json();
      
      if (result.success) {
        setExecutiveSummary(result.executiveSummary);
      } else {
        console.error('Failed to generate summary:', result.error);
      }
    } catch (error) {
      console.error('Error generating executive summary:', error);
      // Set a fallback summary
      setExecutiveSummary({
        overallAssessment: "Your boardroom conversation provided valuable insights. The board members offered constructive feedback to help refine your strategy.",
        keyRisks: ["Market validation needs attention", "Financial planning requires more detail", "Operational scalability should be addressed"],
        keyOpportunities: ["Strong market potential", "Innovative solution approach", "Growth opportunities identified"],
        recommendations: ["Conduct market research", "Develop financial projections", "Plan operational scaling", "Strengthen value proposition"],
        conversationHighlights: ["Engaging boardroom discussion", "Multiple perspectives provided", "Actionable feedback received"]
      });
    } finally {
      setGeneratingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversation summary...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return null; // Router will redirect
  }

  const getConversationStats = () => {
    const userMessages = conversation.messages.filter(msg => msg.type === 'user').length;
    const boardMessages = conversation.messages.filter(msg => msg.type === 'board_member').length;
    const participatingMembers = new Set(
      conversation.messages
        .filter(msg => msg.type === 'board_member')
        .map(msg => msg.persona)
    ).size;
    
    return { userMessages, boardMessages, participatingMembers };
  };

  const conversationStats = getConversationStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Executive Summary</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive analysis and recommendations from your boardroom conversation
            {conversation.strategy.projectName && ` about "${conversation.strategy.projectName}"`}
          </p>
        </div>

        {/* Conversation Overview */}
        <div className="bg-white rounded-xl shadow-lg border p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Conversation Overview</h2>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold mx-auto mb-2">
                  {conversationStats.userMessages}
                </div>
                <p className="text-sm text-gray-600">Your Messages</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 text-green-600 rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold mx-auto mb-2">
                  {conversationStats.boardMessages}
                </div>
                <p className="text-sm text-gray-600">Board Responses</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 text-purple-600 rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold mx-auto mb-2">
                  {conversationStats.participatingMembers}
                </div>
                <p className="text-sm text-gray-600">Board Members</p>
              </div>
            </div>
          </div>

          {generatingSummary ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Generating executive summary from your conversation...</p>
            </div>
          ) : executiveSummary?.overallAssessment ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-700 leading-relaxed">
                {executiveSummary.overallAssessment}
              </p>
            </div>
          ) : null}
        </div>

        {/* Conversation Highlights */}
        {executiveSummary?.conversationHighlights && executiveSummary.conversationHighlights.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border p-8 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Conversation Highlights</h3>
            </div>
            <ul className="space-y-3">
              {executiveSummary.conversationHighlights.map((highlight, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">{highlight}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Insights Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Key Risks */}
          {executiveSummary?.keyRisks && executiveSummary.keyRisks.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border p-8">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-bold text-gray-900">Key Risks</h3>
              </div>
              <ul className="space-y-3">
                {executiveSummary.keyRisks.map((risk, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700">{risk}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Opportunities */}
          {executiveSummary?.keyOpportunities && executiveSummary.keyOpportunities.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border p-8">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold text-gray-900">Key Opportunities</h3>
              </div>
              <ul className="space-y-3">
                {executiveSummary.keyOpportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700">{opportunity}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {executiveSummary?.recommendations && executiveSummary.recommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border p-8 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Action Recommendations</h3>
            </div>
            <ul className="space-y-4">
              {executiveSummary.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-gray-700">{recommendation}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strategy Details */}
        <div className="bg-white rounded-xl shadow-lg border p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Strategy Overview</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              {conversation.strategy.oneSentenceSummary && (
                <>
                  <h4 className="font-semibold text-gray-900 mb-2">Project Summary</h4>
                  <p className="text-gray-700 mb-4">"{conversation.strategy.oneSentenceSummary}"</p>
                </>
              )}
              
              {conversation.strategy.targetCustomer && (
                <>
                  <h4 className="font-semibold text-gray-900 mb-2">Target Customer</h4>
                  <p className="text-gray-700 mb-4">{conversation.strategy.targetCustomer}</p>
                </>
              )}

              {conversation.strategy.detailedDescription && (
                <>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                    {conversation.strategy.detailedDescription.length > 200 
                      ? `${conversation.strategy.detailedDescription.substring(0, 200)}...`
                      : conversation.strategy.detailedDescription
                    }
                  </p>
                </>
              )}
            </div>
            <div>
              {conversation.strategy.keyProblem && (
                <>
                  <h4 className="font-semibold text-gray-900 mb-2">Key Problem</h4>
                  <p className="text-gray-700 mb-4">{conversation.strategy.keyProblem}</p>
                </>
              )}
              
              {conversation.strategy.estimatedCost && (
                <>
                  <h4 className="font-semibold text-gray-900 mb-2">Estimated Cost</h4>
                  <p className="text-gray-700 mb-4">{conversation.strategy.estimatedCost}</p>
                </>
              )}

              {Object.values(conversation.strategy).filter(value => value && typeof value === 'string' && value.trim().length > 0).length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p>Strategy details were discussed during the conversation.</p>
                  <p className="text-sm mt-1">View the full conversation for more information.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/strategy-input"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start New Conversation
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <Link 
            href="/simulation"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Continue Conversation
          </Link>
        </div>
      </div>
    </div>
  );
}
