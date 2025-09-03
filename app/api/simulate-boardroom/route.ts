
import { NextRequest, NextResponse } from 'next/server';
import { BusinessStrategy, BoardMemberResponse } from '@/lib/types';
import { generateBoardMemberPrompt, generateExecutiveSummaryPrompt } from '@/lib/board-prompts';
import { generateLocalJSON } from '@/lib/text-generation';

export async function POST(request: NextRequest) {
  try {
    const { strategy } = await request.json() as { strategy: BusinessStrategy };
    
    // Validate input
    if (!strategy || !strategy.projectName || !strategy.oneSentenceSummary) {
      return NextResponse.json(
        { success: false, error: 'Invalid strategy data provided' },
        { status: 400 }
      );
    }

    const boardMembers: ('cfo' | 'cmo' | 'coo')[] = ['cfo', 'cmo', 'coo'];
    const responses: BoardMemberResponse[] = [];

    // Generate responses from each board member, passing previous responses for context
    for (let i = 0; i < boardMembers.length; i++) {
      const memberType = boardMembers[i];
      try {
        // Gather previous advisor responses for context
        const previousAdvisorResponses = responses.map(r => `${r.name} (${r.title}): ${r.response}`);
  const prompt = generateBoardMemberPrompt(memberType, strategy, previousAdvisorResponses);
  const parsedResponse = await generateLocalJSON({ messages: [{ role: 'user', content: prompt }], mode: 'json' });

        // Map member type to persona details
        const personaNames = {
          cfo: "Margaret 'Maggie' Sterling",
          cmo: "David 'Dave' Chen",
          coo: "Sarah Rodriguez"
        };

        const personaTitles = {
          cfo: "Chief Financial Officer",
          cmo: "Chief Marketing Officer",
          coo: "Chief Operating Officer"
        };

        const boardMemberResponse: BoardMemberResponse = {
          persona: memberType,
          name: personaNames[memberType],
          title: personaTitles[memberType],
          response: parsedResponse.response || 'No response provided',
          assessment: parsedResponse.assessment || 'Needs Work',
          keyQuestions: parsedResponse.keyQuestions || []
        };

        responses.push(boardMemberResponse);
      } catch (memberError) {
        console.error(`Error generating response for ${memberType}:`, memberError);

        // Add a fallback response to prevent complete failure
        const personaNames = {
          cfo: "Margaret 'Maggie' Sterling",
          cmo: "David 'Dave' Chen",
          coo: "Sarah Rodriguez"
        };

        const personaTitles = {
          cfo: "Chief Financial Officer",
          cmo: "Chief Marketing Officer",
          coo: "Chief Operating Officer"
        };

        responses.push({
          persona: memberType,
          name: personaNames[memberType],
          title: personaTitles[memberType],
          response: `I apologize, but I'm unable to provide detailed feedback at this moment due to a technical issue. However, based on your ${memberType === 'cfo' ? 'financial projections' : memberType === 'cmo' ? 'market strategy' : 'operational plan'}, I recommend reviewing the key elements to ensure they align with industry best practices.`,
          assessment: 'Needs Work',
          keyQuestions: [
            `What specific metrics will you use to measure ${memberType === 'cfo' ? 'financial' : memberType === 'cmo' ? 'marketing' : 'operational'} success?`,
            `How will you address potential challenges in your ${memberType === 'cfo' ? 'financial model' : memberType === 'cmo' ? 'customer acquisition strategy' : 'operational processes'}?`
          ]
        });
      }
    }

    // Generate executive summary
    let executiveSummary;
    try {
      const summaryPrompt = generateExecutiveSummaryPrompt(strategy, responses);
      executiveSummary = await generateLocalJSON({ messages: [{ role: 'user', content: summaryPrompt }], mode: 'json' });
    } catch (summaryError) {
      console.error('Error generating executive summary:', summaryError);
    }

    // Fallback executive summary if generation failed
    if (!executiveSummary) {
      const promisingCount = responses.filter(r => r.assessment === 'Promising').length;
      const highRiskCount = responses.filter(r => r.assessment === 'High Risk').length;
      
      executiveSummary = {
        overallAssessment: promisingCount >= 2 
          ? "Your strategy shows strong potential with solid fundamentals that our board members find encouraging."
          : highRiskCount >= 2 
          ? "Your strategy faces significant challenges that require careful attention before moving forward."
          : "Your strategy has merit but needs refinement in several key areas to maximize its potential.",
        keyRisks: [
          "Market validation may require more comprehensive research",
          "Financial projections need stronger supporting data",
          "Operational scalability requires detailed planning",
          "Competitive positioning could be strengthened"
        ],
        keyOpportunities: [
          "Strong market demand for innovative solutions",
          "Potential for significant customer impact",
          "Opportunity to establish market leadership",
          "Scalable business model with growth potential"
        ],
        recommendations: [
          "Conduct thorough market research and validation",
          "Develop detailed financial models with multiple scenarios",
          "Create comprehensive operational plans for scaling",
          "Strengthen competitive differentiation strategy",
          "Build strategic partnerships to accelerate growth"
        ]
      };
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      responses,
      executiveSummary,
      sessionId,
    });

  } catch (error) {
    console.error('Boardroom simulation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate boardroom simulation. Please try again.' 
      },
      { status: 500 }
    );
  }
}
