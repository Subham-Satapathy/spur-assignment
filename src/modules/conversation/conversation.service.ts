import { ConversationRepository } from './conversation.repository';
import { Conversation, Message, MessageSender } from '../../shared/types';
import { NotFoundError } from '../../shared/errors';
import logger from '../../shared/logger';

export class ConversationService {
  constructor(private repository: ConversationRepository) {}

  /**
   * Create a new conversation
   */
  async createConversation(metadata?: Record<string, any>): Promise<Conversation> {
    logger.debug('Creating new conversation', { metadata });
    const conversation = await this.repository.createConversation(metadata);
    logger.info('Conversation created', { conversationId: conversation.id });
    return conversation;
  }

  /**
   * Get conversation by ID
   */
  async getConversation(id: string): Promise<Conversation> {
    const conversation = await this.repository.findById(id);
    if (!conversation) {
      throw new NotFoundError('Conversation', id);
    }
    return conversation;
  }

  /**
   * Check if conversation exists
   */
  async conversationExists(id: string): Promise<boolean> {
    const conversation = await this.repository.findById(id);
    return conversation !== null;
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    sender: MessageSender,
    text: string,
    metadata?: Record<string, any>
  ): Promise<Message> {
    // Verify conversation exists
    await this.getConversation(conversationId);

    logger.debug('Adding message to conversation', {
      conversationId,
      sender,
      textLength: text.length,
    });

    const message = await this.repository.addMessage(
      conversationId,
      sender,
      text,
      metadata
    );

    logger.info('Message added', {
      conversationId,
      messageId: message.id,
      sender,
    });

    return message;
  }

  /**
   * Get conversation history
   */
  async getHistory(conversationId: string, limit?: number): Promise<Message[]> {
    // Verify conversation exists
    await this.getConversation(conversationId);

    const messages = limit
      ? await this.repository.getRecentMessages(conversationId, limit)
      : await this.repository.getMessages(conversationId);

    logger.debug('Retrieved conversation history', {
      conversationId,
      messageCount: messages.length,
    });

    return messages;
  }

  /**
   * Get recent messages for LLM context
   */
  async getRecentMessagesForContext(
    conversationId: string,
    limit: number
  ): Promise<Array<{ sender: MessageSender; text: string; timestamp: Date }>> {
    const messages = await this.repository.getRecentMessages(conversationId, limit);
    return messages.map((msg) => ({
      sender: msg.sender,
      text: msg.text,
      timestamp: msg.createdAt,
    }));
  }

  /**
   * Close a conversation
   */
  async closeConversation(id: string): Promise<void> {
    await this.repository.closeConversation(id);
    logger.info('Conversation closed', { conversationId: id });
  }

  /**
   * Update conversation metadata
   */
  async updateMetadata(id: string, metadata: Record<string, any>): Promise<void> {
    await this.repository.updateMetadata(id, metadata);
    logger.debug('Conversation metadata updated', { conversationId: id });
  }
}
