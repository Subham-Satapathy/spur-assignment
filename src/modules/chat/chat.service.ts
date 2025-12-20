import { ConversationService } from '../conversation';
import { LLMService } from '../llm';
import { KnowledgeService } from '../knowledge';
import { EventBus } from '../messaging';
import { toolRegistry } from '../tools';
import { SendMessageRequest, SendMessageResponse, ConversationHistoryResponse } from './chat.types';
import { ValidationError } from '../../shared/errors';
import { config } from '../../shared/config';
import logger from '../../shared/logger';
import { ChannelType, ToolCall } from '../../shared/types';

/**
 * Chat service - orchestrates conversation, LLM, knowledge, and tool modules
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
  async sendMessage(
    request: SendMessageRequest,
    channelType: ChannelType = 'WEB',
    channelUserId?: string
  ): Promise<SendMessageResponse> {
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
      channelType,
    });

    try {
      // Step 1: Save user message
      const userMessage = await this.conversationService.addMessage(
        conversationId,
        'user',
        request.message,
        channelType,
        channelUserId
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
          channelType,
        },
      });

      // Step 2: Get conversation history for context
      const history = await this.conversationService.getRecentMessagesForContext(
        conversationId,
        config.app.maxConversationHistory
      );

      // Step 3: Get knowledge base
      const knowledgeBase = await this.knowledgeService.formatForPrompt();

      // Step 4: Get available tools (if enabled)
      const toolDefinitions = config.app.enableTools ? toolRegistry.getAllDefinitions() : [];

      // Step 5: Generate AI reply with tool support
      let llmResponse = await this.llmService.generateReply(
        {
          conversationId,
          messages: history,
          knowledgeBase,
          availableTools: toolDefinitions,
        },
        toolDefinitions.length > 0 ? toolDefinitions : undefined
      );

      // Step 6: Execute tool calls if present
      if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
        llmResponse = await this.handleToolCalls(
          llmResponse.toolCalls,
          conversationId,
          userMessage.id
        );
      }

      // Step 7: Save AI message
      const aiMessage = await this.conversationService.addMessage(
        conversationId,
        'ai',
        llmResponse.reply,
        channelType,
        channelUserId,
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
          channelType,
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
   * Handle tool calls from LLM
   */
  private async handleToolCalls(
    toolCalls: ToolCall[],
    conversationId: string,
    _messageId: string
  ): Promise<any> {
    logger.info('Handling tool calls', {
      conversationId,
      count: toolCalls.length,
    });

    const toolResults = [];

    for (const toolCall of toolCalls) {
      try {
        const params = JSON.parse(toolCall.function.arguments);
        const result = await toolRegistry.execute(toolCall.function.name, params);

        toolResults.push({
          tool: toolCall.function.name,
          success: true,
          result,
        });

        logger.info('Tool executed successfully', {
          tool: toolCall.function.name,
          conversationId,
        });
      } catch (error) {
        logger.error('Tool execution failed', {
          tool: toolCall.function.name,
          error: error instanceof Error ? error.message : String(error),
        });

        toolResults.push({
          tool: toolCall.function.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Format tool results as a response
    const toolSummary = toolResults
      .map((r) => {
        if (r.success) {
          return `${r.tool}: ${JSON.stringify(r.result)}`;
        }
        return `${r.tool} failed: ${r.error}`;
      })
      .join('\n');

    return {
      reply: `Based on the tools, here's what I found:\n${toolSummary}`,
      metadata: {
        model: 'tool-execution',
        processingTime: 0,
        toolResults,
      },
    };
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
