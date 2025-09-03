
import { PrismaClient } from '@prisma/client';
import { BusinessStrategy } from './types';

const prisma = new PrismaClient();

export interface CreateConversationParams {
  sessionId: string;
  strategy: BusinessStrategy;
  projectName?: string;
}

export interface AddMessageParams {
  conversationId: string;
  messageType: 'system' | 'user' | 'board_member' | 'artifact_generated';
  persona?: 'cfo' | 'cmo' | 'coo';
  content: string;
  metadata?: any;
  isComplete?: boolean;
}

export interface AddTokenUsageParams {
  conversationId: string;
  requestType: string;
  persona?: string;
  inputTokens: number;
  outputTokens: number;
  cost?: number;
}

export interface CreateArtifactParams {
  conversationId: string;
  artifactType: string;
  chartType?: string;
  title: string;
  description?: string;
  data: any;
  config?: any;
}

export class ConversationDB {
  // Create a new conversation
  static async createConversation(params: CreateConversationParams) {
    try {
      const conversation = await prisma.conversation.create({
        data: {
          sessionId: params.sessionId,
          projectName: params.projectName,
          strategy: params.strategy as any,
          status: 'active',
          phase: 'cfo_only',
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc'
            }
          },
          artifacts: true,
          tokenUsage: true,
        }
      });
      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Get conversation by session ID
  static async getConversationBySessionId(sessionId: string) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { sessionId },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc'
            }
          },
          artifacts: {
            orderBy: {
              createdAt: 'asc'
            }
          },
          tokenUsage: {
            orderBy: {
              createdAt: 'asc'
            }
          },
        }
      });
      return conversation;
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  // Add a message to conversation
  static async addMessage(params: AddMessageParams) {
    try {
      const message = await prisma.message.create({
        data: {
          conversationId: params.conversationId,
          messageType: params.messageType,
          persona: params.persona,
          content: params.content,
          metadata: params.metadata as any,
          isComplete: params.isComplete ?? true,
        }
      });
      
      // Update conversation's last activity
      await prisma.conversation.update({
        where: { id: params.conversationId },
        data: { updatedAt: new Date() }
      });

      return message;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  // Update conversation phase
  static async updateConversationPhase(conversationId: string, phase: string) {
    try {
      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: { 
          phase,
          updatedAt: new Date()
        }
      });
      return conversation;
    } catch (error) {
      console.error('Error updating conversation phase:', error);
      throw error;
    }
  }

  // Add advisor to conversation
  static async addAdvisorToConversation(conversationId: string, persona: 'cmo' | 'coo') {
    try {
      const participant = await prisma.conversationParticipant.upsert({
        where: {
          conversationId_persona: {
            conversationId,
            persona
          }
        },
        update: {
          isActive: true,
          lastActivity: new Date()
        },
        create: {
          conversationId,
          persona,
          isActive: true,
        }
      });
      return participant;
    } catch (error) {
      console.error('Error adding advisor to conversation:', error);
      throw error;
    }
  }

  // Get active advisors for conversation
  static async getActiveAdvisors(conversationId: string) {
    try {
      const participants = await prisma.conversationParticipant.findMany({
        where: {
          conversationId,
          isActive: true
        }
      });
      return participants;
    } catch (error) {
      console.error('Error getting active advisors:', error);
      return [];
    }
  }

  // Track token usage
  static async addTokenUsage(params: AddTokenUsageParams) {
    try {
      const tokenUsage = await prisma.tokenUsage.create({
        data: {
          conversationId: params.conversationId,
          requestType: params.requestType,
          persona: params.persona,
          inputTokens: params.inputTokens,
          outputTokens: params.outputTokens,
          totalTokens: params.inputTokens + params.outputTokens,
          cost: params.cost,
        }
      });
      return tokenUsage;
    } catch (error) {
      console.error('Error tracking token usage:', error);
      throw error;
    }
  }

  // Create an artifact
  static async createArtifact(params: CreateArtifactParams) {
    try {
      const artifact = await prisma.artifact.create({
        data: {
          conversationId: params.conversationId,
          artifactType: params.artifactType,
          chartType: params.chartType,
          title: params.title,
          description: params.description,
          data: params.data as any,
          config: params.config as any,
        }
      });
      return artifact;
    } catch (error) {
      console.error('Error creating artifact:', error);
      throw error;
    }
  }

  // Get conversation statistics
  static async getConversationStats(conversationId: string) {
    try {
      const stats = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          _count: {
            select: {
              messages: true,
              artifacts: true,
              tokenUsage: true,
            }
          },
          tokenUsage: {
            select: {
              totalTokens: true,
              cost: true,
            }
          }
        }
      });

      if (!stats) return null;

      const totalTokens = stats.tokenUsage.reduce((sum, usage) => sum + usage.totalTokens, 0);
      const totalCost = stats.tokenUsage.reduce((sum, usage) => sum + (usage.cost || 0), 0);

      return {
        messageCount: stats._count.messages,
        artifactCount: stats._count.artifacts,
        totalTokens,
        totalCost,
        phase: stats.phase,
        status: stats.status,
      };
    } catch (error) {
      console.error('Error getting conversation stats:', error);
      return null;
    }
  }

  // Complete conversation
  static async completeConversation(conversationId: string) {
    try {
      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: { 
          status: 'completed',
          phase: 'completed',
          updatedAt: new Date()
        }
      });
      return conversation;
    } catch (error) {
      console.error('Error completing conversation:', error);
      throw error;
    }
  }

  // Get user response count in conversation
  static async getUserResponseCount(conversationId: string): Promise<number> {
    try {
      const count = await prisma.message.count({
        where: {
          conversationId,
          messageType: 'user'
        }
      });
      return count;
    } catch (error) {
      console.error('Error getting user response count:', error);
      return 0;
    }
  }

  // Clean up: close database connection
  static async disconnect() {
    await prisma.$disconnect();
  }
}

export default ConversationDB;
