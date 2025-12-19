import { ConversationService } from '../conversation';
import { LLMService } from '../llm';
import { KnowledgeService } from '../knowledge';
import { EventBus } from '../messaging';
import { SendMessageRequest, SendMessageResponse, ConversationHistoryResponse } from './chat.types';
import { ValidationError } from '../../shared/errors';
import { config } from '../../shared/config';
import logger from '../../shared/logger';

/**
 * Chat service - orchestrates conversation, LLM, and knowledge modules
 */
export class ChatService {
  constructor(
    private conversationService: ConversationService,
    private llmService: LLMService,
    private knowledgeService: KnowledgeService,
    private eventBus: EventBus
  ) {}

  /**
   * Send a message and get AI reply
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const startTime = Date.now();

    // Validate input
    this.validateMessage(request.message);

    // Get or create conversation
    const conversationId = request.sessionId
      ? await this.getOrCreateConversation(request.sessionId)
      : (await this.conversationService.createConversation()).id;

    logger.info('Processing chat message', {
      conversationId,
      messageLength: request.message.length,
    });

    try {
      // Step 1: Save user message
      const userMessage = await this.conversationService.addMessage(
        conversationId,
        'user',
        request.message
      );

      // Publish event
      await this.eventBus.publish({
        type: 'MESSAGE_RECEIVED',
        timestamp: new Date(),
        payload: {
          conversationId,
          messageId: userMessage.id,
          text: request.message,
          sender: 'user',
        },
      });

      // Step 2: Get conversation history for context
      const history = await this.conversationService.getRecentMessagesForContext(
        conversationId,
        config.app.maxConversationHistory
      );

      // Step 3: Get knowledge base
      const knowledgeBase = await this.knowledgeService.formatForPrompt();

      // Step 4: Generate AI reply
      const llmResponse = await this.llmService.generateReply({
        conversationId,
        messages: history,
        knowledgeBase,
      });

      // Step 5: Save AI message
      const aiMessage = await this.conversationService.addMessage(
        conversationId,
        'ai',
        llmResponse.reply,
        {
          llmModel: llmResponse.metadata.model,
          tokens: llmResponse.metadata.tokens,
          processingTime: llmResponse.metadata.processingTime,
        }
      );

      const totalProcessingTime = Date.now() - startTime;

      // Publish event
      await this.eventBus.publish({
        type: 'MESSAGE_SENT',
        timestamp: new Date(),
        payload: {
          conversationId,
          messageId: aiMessage.id,
          text: llmResponse.reply,
          processingTime: totalProcessingTime,
        },
      });

      logger.info('Chat message processed successfully', {
        conversationId,
        processingTime: totalProcessingTime,
      });

      return {
        reply: llmResponse.reply,
        sessionId: conversationId,
        processingTime: totalProcessingTime,
      };
    } catch (error) {
      logger.error('Failed to process chat message', {
        conversationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      });

      // Publish failure event
      await this.eventBus.publish({
        type: 'LLM_REQUEST_FAILED',
        timestamp: new Date(),
        payload: {
          conversationId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId: string): Promise<ConversationHistoryResponse> {
    // Verify conversation exists
    const conversation = await this.conversationService.getConversation(sessionId);

    // Get all messages
    const messages = await this.conversationService.getHistory(sessionId);

    return {
      sessionId: conversation.id,
      messages: messages.map((msg) => ({
        id: msg.id,
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.createdAt,
      })),
    };
  }

  /**
   * Validate message input
   */
  private validateMessage(message: string): void {
    if (!message || message.trim().length === 0) {
      throw new ValidationError('Message cannot be empty');
    }

    if (message.length > config.app.maxMessageLength) {
      throw new ValidationError(
        `Message too long. Maximum length is ${config.app.maxMessageLength} characters`
      );
    }
  }

  /**
   * Get existing conversation or create new one if doesn't exist
   */
  private async getOrCreateConversation(sessionId: string): Promise<string> {
    const exists = await this.conversationService.conversationExists(sessionId);

    if (!exists) {
      logger.info('Creating new conversation for provided session ID', { sessionId });
      
      // Create conversation with the provided ID
      // Note: This would require modifying the repository to accept custom IDs
      // For now, we'll create a new one and log a warning
      logger.warn('Provided session ID not found, creating new conversation', { sessionId });
      const newConversation = await this.conversationService.createConversation({
        originalSessionId: sessionId,
      });
      
      await this.eventBus.publish({
        type: 'CONVERSATION_STARTED',
        timestamp: new Date(),
        payload: {
          conversationId: newConversation.id,
        },
      });

      return newConversation.id;
    }

    return sessionId;
  }
}
