
export interface BusinessStrategy {
  projectName?: string;
  oneSentenceSummary?: string;
  targetCustomer?: string;
  keyProblem?: string;
  estimatedCost?: string;
  detailedDescription?: string;
  supplementaryFile?: {
    name: string;
    content: string;
    type: string;
  };
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'board_member' | 'system' | 'artifact_generated';
  persona?: 'cfo' | 'cmo' | 'coo';
  name?: string;
  title?: string;
  animalSpirit?: string;
  mantra?: string;
  providerUsed?: 'openai' | 'local';
  content: string;
  timestamp: string;
  isComplete?: boolean;
  isNewIntroduction?: boolean;
}

export interface ConversationSession {
  sessionId: string;
  id?: string;
  projectName?: string;
  phase?: string;
  status?: string;
  strategy: BusinessStrategy;
  messages: ChatMessage[];
  isActive: boolean;
  createdAt: string;
  lastActivity: string;
}

export interface BoardMemberResponse {
  persona: 'cfo' | 'cmo' | 'coo';
  name: string;
  title: string;
  response: string;
  assessment?: 'Promising' | 'Needs Work' | 'High Risk';
  keyQuestions?: string[];
}

export interface SimulationResult {
  sessionId: string;
  strategy: BusinessStrategy;
  conversation: ConversationSession;
  executiveSummary?: {
    overallAssessment: string;
    keyRisks: string[];
    keyOpportunities: string[];
    recommendations: string[];
  };
  createdAt: string;
}

export interface FileUploadResult {
  success: boolean;
  content?: string;
  error?: string;
  fileName?: string;
  fileType?: string;
}
