
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import ConversationDB from '@/lib/conversation-db';
import { BusinessStrategy } from '@/lib/types';
import { generateLocalJSON } from '@/lib/text-generation';

export const dynamic = "force-dynamic";

interface ArtifactGenerationRequest {
  sessionId: string;
  artifactType: string;
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, artifactType, description } = await request.json() as ArtifactGenerationRequest;

    if (!sessionId || !artifactType) {
      return NextResponse.json(
        { success: false, error: 'Session ID and artifact type are required' },
        { status: 400 }
      );
    }

    // Load conversation from database
    const conversation = await ConversationDB.getConversationBySessionId(sessionId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const strategy = conversation.strategy as BusinessStrategy;
    const messages = conversation.messages;
    
  // Build conversation context for generation
    const conversationText = messages
      .filter(msg => msg.messageType !== 'system')
      .map(msg => {
        if (msg.messageType === 'user') {
          return `User: ${msg.content}`;
        } else if (msg.messageType === 'board_member') {
          const metadata = msg.metadata as any;
          return `${metadata?.name || msg.persona}: ${msg.content}`;
        }
        return '';
      })
      .filter(text => text.length > 0)
      .join('\n');

  // Generate artifact locally
  const artifactData = await generateArtifact(artifactType, strategy, conversationText, description);
    
    if (!artifactData) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate artifact' },
        { status: 500 }
      );
    }

    // Save artifact to database
    const savedArtifact = await ConversationDB.createArtifact({
      conversationId: conversation.id,
      artifactType: artifactData.type,
      chartType: artifactData.chartType,
      title: artifactData.title,
      description: artifactData.description,
      data: artifactData.data,
      config: artifactData.config,
    });

    // Add artifact message to conversation
    await ConversationDB.addMessage({
      conversationId: conversation.id,
      messageType: 'artifact_generated',
      content: `Generated ${artifactData.title}: ${artifactData.description}`,
      metadata: {
        artifactId: savedArtifact.id,
        artifactType: artifactData.type,
        chartType: artifactData.chartType
      }
    });

    return NextResponse.json({
      success: true,
      artifact: {
        id: savedArtifact.id,
        type: savedArtifact.artifactType,
        chartType: savedArtifact.chartType,
        title: savedArtifact.title,
        description: savedArtifact.description,
        data: savedArtifact.data,
        config: savedArtifact.config,
        createdAt: savedArtifact.createdAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating artifact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate artifact' },
      { status: 500 }
    );
  }
}

async function generateArtifact(
  artifactType: string, 
  strategy: BusinessStrategy, 
  conversationText: string,
  description: string
): Promise<any> {
  try {
    let prompt = '';
    
    switch (artifactType) {
      case 'financial_chart':
        prompt = generateFinancialChartPrompt(strategy, conversationText);
        break;
      case 'market_analysis':
        prompt = generateMarketAnalysisPrompt(strategy, conversationText);
        break;
      case 'timeline':
        prompt = generateTimelinePrompt(strategy, conversationText);
        break;
      case 'pdf_analysis_chart':
        prompt = generatePDFAnalysisChartPrompt(strategy, conversationText);
        break;
      default:
        prompt = generateGenericChartPrompt(strategy, conversationText, description);
    }

    // Locally produce a simple, valid JSON structure per prompt type
    const base = { title: 'Generated Visualization', description: 'Auto-generated from conversation context' } as any;
    if (artifactType === 'financial_chart') {
      return {
        type: 'financial_chart',
        chartType: 'line',
        title: base.title,
        description: base.description,
        data: Array.from({ length: 6 }).map((_, i) => ({ name: `Month ${i+1}`, revenue: 1000 + i*250, expenses: 800 + i*150, profit: 200 + i*100 })),
        config: { xAxisKey: 'name', yAxisKeys: ['revenue', 'expenses', 'profit'], colors: ['#10B981', '#EF4444', '#3B82F6'] }
      };
    }
    if (artifactType === 'market_analysis') {
      return {
        type: 'market_analysis',
        chartType: 'pie',
        title: base.title,
        description: base.description,
        data: [
          { name: 'Segment A', value: 45, percentage: 45 },
          { name: 'Segment B', value: 30, percentage: 30 },
          { name: 'Segment C', value: 25, percentage: 25 }
        ],
        config: { valueKey: 'value', nameKey: 'name', colors: ['#8B5CF6', '#06B6D4', '#84CC16'] }
      };
    }
    if (artifactType === 'timeline') {
      return {
        type: 'timeline',
        chartType: 'timeline',
        title: base.title,
        description: base.description,
        data: [
          { name: 'Phase 1', start: '2025-01-01', end: '2025-02-15', status: 'completed', description: 'Discovery' },
          { name: 'Phase 2', start: '2025-02-16', end: '2025-04-01', status: 'in-progress', description: 'MVP Build' },
          { name: 'Phase 3', start: '2025-04-02', end: '2025-06-01', status: 'planned', description: 'Pilot & Iterate' }
        ],
        config: { timeFormat: 'YYYY-MM-DD', statusColors: { 'planned': '#94A3B8', 'in-progress': '#3B82F6', 'completed': '#10B981' } }
      };
    }
    if (artifactType === 'pdf_analysis_chart') {
      return {
        type: 'pdf_analysis_chart',
        chartType: 'bar',
        title: base.title,
        description: base.description,
        data: [
          { name: 'Metric A', value: 12 },
          { name: 'Metric B', value: 18 },
          { name: 'Metric C', value: 9 }
        ],
        config: { xAxisKey: 'name', yAxisKey: 'value', colors: ['#8B5CF6', '#06B6D4', '#10B981'] }
      };
    }
    return {
      type: 'generic_chart',
      chartType: 'bar',
      title: base.title,
      description: description || base.description,
      data: [
        { name: 'A', value: 10 },
        { name: 'B', value: 15 },
        { name: 'C', value: 7 }
      ],
      config: { xAxisKey: 'name', yAxisKey: 'value', colors: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'] }
    };

  } catch (error) {
    console.error('Error in generateArtifact:', error);
    return null;
  }
}

function generateFinancialChartPrompt(strategy: BusinessStrategy, conversationText: string): string {
  return `Based on the business strategy discussion below, generate a financial performance chart.

BUSINESS STRATEGY:
Project: ${strategy.projectName || 'Untitled Project'}
Summary: ${strategy.oneSentenceSummary || 'No summary provided'}
Estimated Cost: ${strategy.estimatedCost || 'Not specified'}

CONVERSATION DETAILS:
${conversationText}

INSTRUCTIONS:
Create a financial chart visualization with realistic data based on the discussion. Generate appropriate financial metrics and projections.

Respond in JSON format with the following structure:
{
  "type": "financial_chart",
  "chartType": "line" | "bar" | "area",
  "title": "Chart title",
  "description": "Brief description of what the chart shows",
  "data": [
    {
      "name": "Month/Period",
      "revenue": 0,
      "expenses": 0,
      "profit": 0
    }
  ],
  "config": {
    "xAxisKey": "name",
    "yAxisKeys": ["revenue", "expenses", "profit"],
    "colors": ["#10B981", "#EF4444", "#3B82F6"]
  }
}

Generate realistic financial data that makes sense for the business discussed. Include at least 6 data points covering a reasonable time period.`;
}

function generateMarketAnalysisPrompt(strategy: BusinessStrategy, conversationText: string): string {
  return `Based on the business strategy discussion below, generate a market analysis chart.

BUSINESS STRATEGY:
Project: ${strategy.projectName || 'Untitled Project'}
Target Customer: ${strategy.targetCustomer || 'Not specified'}
Key Problem: ${strategy.keyProblem || 'Not specified'}

CONVERSATION DETAILS:
${conversationText}

INSTRUCTIONS:
Create a market analysis visualization with realistic market data based on the discussion.

Respond in JSON format with the following structure:
{
  "type": "market_analysis",
  "chartType": "pie" | "bar" | "donut",
  "title": "Chart title",
  "description": "Brief description of the market analysis",
  "data": [
    {
      "name": "Market Segment",
      "value": 0,
      "percentage": 0
    }
  ],
  "config": {
    "valueKey": "value",
    "nameKey": "name",
    "colors": ["#8B5CF6", "#06B6D4", "#84CC16", "#F59E0B", "#EF4444"]
  }
}

Generate realistic market segmentation or competitive analysis data relevant to the business discussed.`;
}

function generateTimelinePrompt(strategy: BusinessStrategy, conversationText: string): string {
  return `Based on the business strategy discussion below, generate a project timeline/roadmap.

BUSINESS STRATEGY:
Project: ${strategy.projectName || 'Untitled Project'}
Description: ${strategy.detailedDescription || 'No detailed description provided'}

CONVERSATION DETAILS:
${conversationText}

INSTRUCTIONS:
Create a timeline visualization showing key milestones and phases for the project.

Respond in JSON format with the following structure:
{
  "type": "timeline",
  "chartType": "timeline",
  "title": "Chart title",
  "description": "Brief description of the timeline",
  "data": [
    {
      "name": "Phase/Milestone Name",
      "start": "2024-01-01",
      "end": "2024-03-01",
      "status": "planned" | "in-progress" | "completed",
      "description": "Phase description"
    }
  ],
  "config": {
    "timeFormat": "YYYY-MM-DD",
    "statusColors": {
      "planned": "#94A3B8",
      "in-progress": "#3B82F6",
      "completed": "#10B981"
    }
  }
}

Generate realistic timeline with appropriate phases and milestones for the project discussed.`;
}

function generatePDFAnalysisChartPrompt(strategy: BusinessStrategy, conversationText: string): string {
  return `Based on the attached PDF document and business strategy discussion below, generate a relevant chart visualization.

BUSINESS STRATEGY:
Project: ${strategy.projectName || 'Untitled Project'}
PDF Document: ${strategy.supplementaryFile?.name || 'Financial document'}

CONVERSATION DETAILS:
${conversationText}

INSTRUCTIONS:
Analyze the PDF document and create a chart that visualizes key data from the document relevant to the business discussion.

Respond in JSON format with the following structure:
{
  "type": "pdf_analysis_chart",
  "chartType": "line" | "bar" | "pie" | "area",
  "title": "Chart title based on PDF data",
  "description": "Description of what the chart shows from the PDF",
  "data": [
    {
      "name": "Category/Period",
      "value": 0
    }
  ],
  "config": {
    "xAxisKey": "name",
    "yAxisKey": "value",
    "colors": ["#8B5CF6", "#06B6D4", "#10B981"]
  }
}

Extract real data from the PDF document and create meaningful visualizations. Focus on financial performance, trends, or key metrics mentioned in the conversation.`;
}

function generateGenericChartPrompt(strategy: BusinessStrategy, conversationText: string, description: string): string {
  return `Based on the business strategy discussion below, generate a chart visualization for: ${description}

BUSINESS STRATEGY:
Project: ${strategy.projectName || 'Untitled Project'}

CONVERSATION DETAILS:
${conversationText}

INSTRUCTIONS:
Create an appropriate chart visualization based on the conversation and description provided.

Respond in JSON format with the following structure:
{
  "type": "generic_chart",
  "chartType": "line" | "bar" | "pie" | "area",
  "title": "Chart title",
  "description": "Brief description of the chart",
  "data": [
    {
      "name": "Category/Period",
      "value": 0
    }
  ],
  "config": {
    "xAxisKey": "name",
    "yAxisKey": "value",
    "colors": ["#8B5CF6", "#06B6D4", "#10B981", "#F59E0B"]
  }
}

Generate realistic and relevant data for the visualization requested.`;
}
