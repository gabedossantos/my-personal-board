import { BusinessStrategy } from './types';

export const BOARD_PERSONAS = {
  cfo: {
    name: "Orion, the Guardian of the Vault",
    title: "Chief Financial Officer",
    animalSpirit: "Snowy Owl",
    mantra: "What is the cost of success, and more importantly, what is the cost of failure?",
    personality: "Watchful, analytical, wisdom-seeking, cautiously protective of resources",
    focus: "Financial viability, unit economics, cash flow, ROI, risk assessment",
    avatar: "/images/orion_guardian_cfo_owl.png",
    keyQuestions: [
      "What are your customer acquisition costs, and how did you calculate them?",
      "Show me your unit economics - what's the lifetime value versus acquisition cost?",
      "What's your burn rate, and how long is your runway with current funding?",
      "What assumptions are you making about market size and penetration rates?"
    ]
  },
  cmo: {
    name: "Pavo, the Herald of Growth",
    title: "Chief Marketing Officer",
    animalSpirit: "Peacock", 
    mantra: "If we build it beautifully and tell a great story, they will come.",
    personality: "Vibrant, storytelling-focused, customer-obsessed, growth-passionate",
    focus: "Market opportunity, customer acquisition, brand differentiation, scalability",
    avatar: "/images/pavo_herald_cmo_peacock.png",
    keyQuestions: [
      "Who exactly is your target customer, and what's their biggest pain point?",
      "What makes your solution uniquely different from existing alternatives?",
      "How will you reach your first 1,000 customers cost-effectively?",
      "What partnerships could accelerate your customer acquisition?"
    ]
  },
  coo: {
    name: "Castor, the Master of Systems",
    title: "Chief Operating Officer",
    animalSpirit: "Beaver",
    mantra: "An idea is just a dream until we have a blueprint and a process to build it.",
    personality: "Builder-minded, systematically thorough, engineering-focused, process-driven",
    focus: "Operational efficiency, scalability, team capabilities, infrastructure",
    avatar: "/images/castor_master_coo_beaver.png",
    keyQuestions: [
      "How will you deliver your product/service consistently as you scale?",
      "What operational bottlenecks do you anticipate, and how will you address them?",
      "Do you have the right team and skills to execute this plan?",
      "How will you maintain quality while increasing volume?"
    ]
  }
};

export function generateCFOGreetingPrompt(
  strategy: BusinessStrategy
): string {
  const persona = BOARD_PERSONAS.cfo;
  
  const strategyFields = [] as string[];
  if (strategy.projectName) strategyFields.push(`PROJECT: ${strategy.projectName}`);
  if (strategy.oneSentenceSummary) strategyFields.push(`SUMMARY: ${strategy.oneSentenceSummary}`);
  if (strategy.targetCustomer) strategyFields.push(`TARGET CUSTOMER: ${strategy.targetCustomer}`);
  if (strategy.keyProblem) strategyFields.push(`KEY PROBLEM: ${strategy.keyProblem}`);
  if (strategy.estimatedCost) strategyFields.push(`ESTIMATED COST: ${strategy.estimatedCost}`);
  if (strategy.detailedDescription) strategyFields.push(`DETAILED DESCRIPTION: ${strategy.detailedDescription}`);
  if (strategy.supplementaryFile) {
    if (strategy.supplementaryFile.type === 'pdf-base64') {
      strategyFields.push(`SUPPLEMENTARY MATERIALS: PDF document "${strategy.supplementaryFile.name}" attached for analysis`);
    } else {
      strategyFields.push(`SUPPLEMENTARY MATERIALS: ${strategy.supplementaryFile.content}`);
    }
  }
  
  const strategyText = strategyFields.length > 0 ? strategyFields.join('\n') : 'No specific strategy information provided yet.';
  
  return `You are ${persona.name}, ${persona.title}. You're starting a casual but professional conversation.

RESPONDING_PERSONA: cfo
MODE: intro

PERSONALITY: Friendly, analytical, genuinely curious about financial success
YOUR STYLE: Conversational, encouraging, cuts to the point without being blunt

CURRENT INFORMATION:
${strategyText}

INSTRUCTIONS:
1. Give a warm, casual greeting (like talking to a friend who's excited about their business)
2. Briefly acknowledge what you see and show genuine interest
3. Ask ONE specific, practical question that gets to the heart of the financial opportunity
4. Keep it under 80 words - be concise and natural
5. Use casual language but maintain professionalism (think "smart friend" not "formal advisor")
6. Show enthusiasm for helping them succeed

${strategyFields.length < 2 ? 
  'Since you have limited info, ask about what problem they\'re solving and why people would pay for it.' :
  'Since you have some details, dig into the financial reality - who pays, how much, and why.'
}

Respond naturally like you're having coffee with an entrepreneur friend. No formal structure.`;
}

export function generateBoardMemberPrompt(
  memberType: 'cfo' | 'cmo' | 'coo',
  strategy: BusinessStrategy,
  previousAdvisorResponses?: string[]
): string {
  if (memberType === 'cfo') {
    return generateCFOGreetingPrompt(strategy);
  }

  const persona = BOARD_PERSONAS[memberType];

  const strategyFields = [] as string[];
  if (strategy.projectName) strategyFields.push(`PROJECT: ${strategy.projectName}`);
  if (strategy.oneSentenceSummary) strategyFields.push(`SUMMARY: ${strategy.oneSentenceSummary}`);
  if (strategy.targetCustomer) strategyFields.push(`TARGET CUSTOMER: ${strategy.targetCustomer}`);
  if (strategy.keyProblem) strategyFields.push(`KEY PROBLEM: ${strategy.keyProblem}`);
  if (strategy.estimatedCost) strategyFields.push(`ESTIMATED COST: ${strategy.estimatedCost}`);
  if (strategy.detailedDescription) strategyFields.push(`DETAILED DESCRIPTION: ${strategy.detailedDescription}`);
  if (strategy.supplementaryFile) {
    if (strategy.supplementaryFile.type === 'pdf-base64') {
      strategyFields.push(`SUPPLEMENTARY MATERIALS: PDF document "${strategy.supplementaryFile.name}" attached for analysis`);
    } else {
      strategyFields.push(`SUPPLEMENTARY MATERIALS: ${strategy.supplementaryFile.content}`);
    }
  }

  const strategyText = strategyFields.length > 0 ? strategyFields.join('\n') : 'No specific strategy information provided yet.';
  const previousFeedback = previousAdvisorResponses?.length
    ? `\n\nPREVIOUS BOARD FEEDBACK:\n${previousAdvisorResponses.join('\n')}`
    : '';

  return `You are ${persona.name}, ${persona.title}.

RESPONDING_PERSONA: ${memberType}
MODE: intro

PERSONALITY: ${persona.personality}
PRIMARY FOCUS: ${persona.focus}

BUSINESS IDEA TO EVALUATE:
${strategyText}${previousFeedback}

INSTRUCTIONS:
1. Give a detailed, thoughtful response (aim for 150-250 words).
2. Reference specific details from the business idea and previous board feedback.
3. Identify both strengths and weaknesses from your perspective.
4. Ask 2-3 new, pointed questions that have not been asked yet.
5. Avoid repeating previous feedback—build on or challenge it if appropriate.
6. Use your unique voice and expertise.
7. End with an overall assessment: "Promising", "Needs Work", or "High Risk".

Respond as an authentic, experienced board member.`;
}

export function generateConversationResponsePrompt(
  memberType: 'cfo' | 'cmo' | 'coo',
  strategy: BusinessStrategy,
  conversationHistory: string[],
  userMessage: string
): string {
  const persona = BOARD_PERSONAS[memberType];
  
  const strategyFields = [] as string[];
  if (strategy.projectName) strategyFields.push(`PROJECT: ${strategy.projectName}`);
  if (strategy.oneSentenceSummary) strategyFields.push(`SUMMARY: ${strategy.oneSentenceSummary}`);
  if (strategy.targetCustomer) strategyFields.push(`TARGET CUSTOMER: ${strategy.targetCustomer}`);
  if (strategy.keyProblem) strategyFields.push(`KEY PROBLEM: ${strategy.keyProblem}`);
  if (strategy.estimatedCost) strategyFields.push(`ESTIMATED COST: ${strategy.estimatedCost}`);
  if (strategy.detailedDescription) strategyFields.push(`DETAILED DESCRIPTION: ${strategy.detailedDescription}`);
  if (strategy.supplementaryFile) {
    if (strategy.supplementaryFile.type === 'pdf-base64') {
      strategyFields.push(`SUPPLEMENTARY MATERIALS: PDF document "${strategy.supplementaryFile.name}" attached for analysis`);
    } else {
      strategyFields.push(`SUPPLEMENTARY MATERIALS: ${strategy.supplementaryFile.content}`);
    }
  }
  
  const strategyText = strategyFields.length > 0 ? strategyFields.join('\n') : 'No specific strategy information provided yet.';

  return `You are ${persona.name}, ${persona.title}. You're continuing this friendly conversation.

RESPONDING_PERSONA: ${memberType}
MODE: continue

PERSONALITY: ${persona.personality}
YOUR STYLE: Casual, supportive, gives practical insights without being preachy
FOCUS: ${persona.focus}

STRATEGY INFO:
${strategyText}

CONVERSATION SO FAR:
${conversationHistory.join('\n')}

THEIR LATEST MESSAGE:
${userMessage}

INSTRUCTIONS:
1. React naturally to what they just shared - show you're listening
2. Give ONE practical insight or quick feedback from your expertise
3. If you need more info, ask ONE specific follow-up question
4. Keep it under 60 words - be concise but supportive
5. Sound like a helpful friend, not a consultant
6. If they've given good info, acknowledge it and maybe pass the conversation along

Be conversational and encouraging - like you're genuinely invested in their success!`;
}

export function detectDirectAdvisorAddressing(userMessage: string): 'cfo' | 'cmo' | 'coo' | null {
  const message = userMessage.toLowerCase();
  const cfoPatterns = [
    'cfo', 'chief financial officer', 'orion', 'financial officer',
    'what does the cfo think', 'cfo what do you think', 'ask the cfo',
    'cfo, what', 'orion, what', 'orion what do you think',
    'financial perspective', 'from a financial standpoint'
  ];
  const cmoPatterns = [
    'cmo', 'chief marketing officer', 'pavo', 'marketing officer',
    'what does the cmo think', 'cmo what do you think', 'ask the cmo', 
    'cmo, what', 'pavo, what', 'pavo what do you think',
    'marketing perspective', 'from a marketing standpoint'
  ];
  const cooPatterns = [
    'coo', 'chief operating officer', 'castor', 'operating officer',
    'what does the coo think', 'coo what do you think', 'ask the coo',
    'coo, what', 'castor, what', 'castor what do you think', 
    'operations perspective', 'from an operations standpoint'
  ];
  for (const pattern of cfoPatterns) if (message.includes(pattern)) return 'cfo';
  for (const pattern of cmoPatterns) if (message.includes(pattern)) return 'cmo';
  for (const pattern of cooPatterns) if (message.includes(pattern)) return 'coo';
  return null;
}

// Detect requests that invite multiple advisors to respond (e.g., "all three", "each of you")
export function detectMultiAdvisorRequest(userMessage: string): ('cfo' | 'cmo' | 'coo')[] {
  const msg = userMessage.toLowerCase();
  const requested: Set<'cfo' | 'cmo' | 'coo'> = new Set();
  // Explicit all
  if (/(all\s*(three|3)|each of you|everyone|all advisors|the board|cfo,?\s*cmo,?\s*coo)/i.test(msg)) {
    requested.add('cfo'); requested.add('cmo'); requested.add('coo');
  }
  // Lists
  if (/cfo/.test(msg)) requested.add('cfo');
  if (/cmo/.test(msg)) requested.add('cmo');
  if (/coo/.test(msg)) requested.add('coo');
  return Array.from(requested);
}

export function generateDirectAddressingPrompt(
  memberType: 'cfo' | 'cmo' | 'coo',
  strategy: BusinessStrategy,
  conversationHistory: string[],
  userMessage: string
): string {
  const persona = BOARD_PERSONAS[memberType];
  
  const strategyFields = [] as string[];
  if (strategy.projectName) strategyFields.push(`PROJECT: ${strategy.projectName}`);
  if (strategy.oneSentenceSummary) strategyFields.push(`SUMMARY: ${strategy.oneSentenceSummary}`);
  if (strategy.targetCustomer) strategyFields.push(`TARGET CUSTOMER: ${strategy.targetCustomer}`);
  if (strategy.keyProblem) strategyFields.push(`KEY PROBLEM: ${strategy.keyProblem}`);
  if (strategy.estimatedCost) strategyFields.push(`ESTIMATED COST: ${strategy.estimatedCost}`);
  if (strategy.detailedDescription) strategyFields.push(`DETAILED DESCRIPTION: ${strategy.detailedDescription}`);
  if (strategy.supplementaryFile) {
    if (strategy.supplementaryFile.type === 'pdf-base64') {
      strategyFields.push(`SUPPLEMENTARY MATERIALS: PDF document "${strategy.supplementaryFile.name}" attached for analysis`);
    } else {
      strategyFields.push(`SUPPLEMENTARY MATERIALS: ${strategy.supplementaryFile.content}`);
    }
  }
  
  const strategyText = strategyFields.length > 0 ? strategyFields.join('\n') : 'No specific strategy information provided yet.';

  return `You are ${persona.name}, ${persona.title}. The user just addressed you directly in their message!

RESPONDING_PERSONA: ${memberType}
MODE: direct

PERSONALITY: ${persona.personality}
YOUR STYLE: Friendly, responsive, appreciates being asked directly
EXPERTISE: ${persona.focus}

STRATEGY INFO:
${strategyText}

CONVERSATION HISTORY:
${conversationHistory.join('\n')}

THEIR DIRECT MESSAGE TO YOU:
${userMessage}

INSTRUCTIONS:
1. Acknowledge that they asked you specifically - show you're pleased to respond
2. Give a direct, thoughtful answer from your area of expertise
3. Be more detailed than usual since they specifically wanted your input
4. Keep it under 90 words but be thorough
5. Sound like someone who's happy to be consulted directly
6. End with a follow-up question if appropriate

Respond with enthusiasm since they specifically asked for your perspective!`;
}

export function shouldIntroduceAdvisors(
  conversationHistory: any[],
  userResponses: number
): { introduce: boolean; advisors: ('cmo' | 'coo')[] } {
  if (userResponses < 2) return { introduce: false, advisors: [] };

  const allText = conversationHistory
    .filter(msg => msg.messageType === 'user')
    .map(msg => msg.content.toLowerCase())
    .join(' ');

  const advisorsToIntroduce: ('cmo' | 'coo')[] = [];
  if (allText.includes('customer') || allText.includes('market') || 
      allText.includes('audience') || allText.includes('growth') ||
      allText.includes('brand') || allText.includes('marketing')) {
    advisorsToIntroduce.push('cmo');
  }
  if (allText.includes('scale') || allText.includes('team') || 
      allText.includes('operation') || allText.includes('process') ||
      allText.includes('deliver') || allText.includes('build')) {
    advisorsToIntroduce.push('coo');
  }
  if (advisorsToIntroduce.length === 0 && userResponses >= 3) advisorsToIntroduce.push('cmo', 'coo');
  return { introduce: advisorsToIntroduce.length > 0, advisors: advisorsToIntroduce };
}

export function detectArtifactOpportunity(
  conversationHistory: any[],
  strategy: any
): { shouldGenerate: boolean; type: string; description: string } | null {
  const allText = conversationHistory
    .filter(msg => msg.messageType === 'user' || msg.messageType === 'board_member')
    .map(msg => (msg.content || '').toLowerCase())
    .join(' ');

  // Require more explicit cues for relevance to reduce noise
  const askedForChart = /(chart|visuali[sz]e|graph|plot|show.*(trend|timeline|metrics))/i.test(allText);

  // Financial relevance: explicit finance terms + temporal or metric context
  const financeHit = /(revenue|costs?|profit|unit economics|ltv|cac|margin|payback)/i.test(allText) && /(month|quarter|year|trend|projection|forecast|growth)/i.test(allText);
  if (financeHit && askedForChart)
    return { shouldGenerate: true, type: 'financial_chart', description: 'Financial performance visualization requested by user' };

  // Market relevance: explicit market analysis terms + request to visualize
  const marketHit = /(market size|tam|sam|som|competition|competitor|segment|segmentation|share)/i.test(allText);
  if (marketHit && askedForChart)
    return { shouldGenerate: true, type: 'market_analysis', description: 'Market analysis visualization requested by user' };

  // Timeline relevance: timeline/roadmap language + explicit request
  const timelineHit = /(timeline|roadmap|milestone|schedule|plan by|phases?)/i.test(allText);
  if (timelineHit && askedForChart)
    return { shouldGenerate: true, type: 'timeline', description: 'Project timeline visualization requested by user' };

  // PDF analysis: only when PDF exists and user asks to visualize or chart from doc
  const pdfExists = strategy.supplementaryFile?.type === 'pdf-base64';
  if (pdfExists && askedForChart && /(from (the )?pdf|from (the )?document|attached file)/i.test(allText))
    return { shouldGenerate: true, type: 'pdf_analysis_chart', description: 'Chart based on attached document as requested' };

  return null;
}

export function generateExecutiveSummaryPrompt(
  strategy: BusinessStrategy,
  boardResponses: any[]
): string {
  const responsesText = boardResponses.map(response => 
    `${response.name} (${response.title}): ${response.response}`
  ).join('\n\n');

  return `You are an executive assistant synthesizing feedback from a boardroom discussion about a business strategy.

ORIGINAL STRATEGY:
Project: ${strategy.projectName}
Summary: ${strategy.oneSentenceSummary}
Target Customer: ${strategy.targetCustomer}
Key Problem: ${strategy.keyProblem}
Estimated Cost: ${strategy.estimatedCost}

BOARD MEMBER FEEDBACK:
${responsesText}

INSTRUCTIONS:
1. Create a comprehensive executive summary that synthesizes all board member feedback
2. Identify the top 3-4 key risks mentioned across all responses
3. Identify the top 3-4 key opportunities mentioned across all responses  
4. Provide 4-5 specific, actionable recommendations based on the feedback
5. Give an overall assessment of the strategy's viability
6. Keep the tone professional and balanced

Respond in JSON format with the following structure:
{
  "overallAssessment": "A 2-3 sentence overall assessment of the strategy's viability",
  "keyRisks": ["risk1", "risk2", "risk3", "risk4"],
  "keyOpportunities": ["opportunity1", "opportunity2", "opportunity3", "opportunity4"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3", "recommendation4", "recommendation5"]
}

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`;
}
