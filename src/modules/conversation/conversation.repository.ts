import { eq, desc } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { conversations, messages } from '../../shared/database/schema';
import { Conversation, Message, MessageSender, QueryOptions } from '../../shared/types';
import { DatabaseError, NotFoundError } from '../../shared/errors';
import logger from '../../shared/logger';

export class ConversationRepository {
  constructor(private db: NeonHttpDatabase<any>) {}

  async createConversation(metadata?: Record<string, any>): Promise<Conversation> {
    try {
      const [conversation] = await this.db
        .insert(conversations)
        .values({
          metadata: metadata || null,
          status: 'active',
        })
        .returning();

      return this.mapConversationRow(conversation);
    } catch (error) {
      logger.error('Failed to create conversation', { error });
      throw new DatabaseError('Failed to create conversation', error);
    }
  }

  async findById(id: string): Promise<Conversation | null> {
    try {
      const [conversation] = await this.db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id))
        .limit(1);

      return conversation ? this.mapConversationRow(conversation) : null;
    } catch (error) {
      logger.error('Failed to find conversation', { error, conversationId: id });
      throw new DatabaseError('Failed to find conversation', error);
    }
  }

  async updateMetadata(id: string, metadata: Record<string, any>): Promise<void> {
    try {
      const result = await this.db
        .update(conversations)
        .set({
          metadata,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, id))
        .returning({ id: conversations.id });

      if (result.length === 0) {
        throw new NotFoundError('Conversation', id);
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Failed to update conversation metadata', { error, conversationId: id });
      throw new DatabaseError('Failed to update conversation metadata', error);
    }
  }

  async closeConversation(id: string): Promise<void> {
    try {
      const result = await this.db
        .update(conversations)
        .set({
          status: 'closed',
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, id))
        .returning({ id: conversations.id });

      if (result.length === 0) {
        throw new NotFoundError('Conversation', id);
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Failed to close conversation', { error, conversationId: id });
      throw new DatabaseError('Failed to close conversation', error);
    }
  }

  async addMessage(
    conversationId: string,
    sender: MessageSender,
    text: string,
    metadata?: Record<string, any>
  ): Promise<Message> {
    try {
      const [message] = await this.db
        .insert(messages)
        .values({
          conversationId,
          sender,
          text,
          metadata: metadata || null,
        })
        .returning();

      await this.db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));

      return this.mapMessageRow(message);
    } catch (error) {
      logger.error('Failed to add message', { error, conversationId });
      throw new DatabaseError('Failed to add message', error);
    }
  }

  async getMessages(conversationId: string, options?: QueryOptions): Promise<Message[]> {
    try {
      const limit = options?.limit || 100;
      const offset = options?.offset || 0;

      const result = await this.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt)
        .limit(limit)
        .offset(offset);

      return result.map(this.mapMessageRow);
    } catch (error) {
      logger.error('Failed to get messages', { error, conversationId });
      throw new DatabaseError('Failed to get messages', error);
    }
  }

  async getRecentMessages(conversationId: string, limit: number = 10): Promise<Message[]> {
    try {
      const result = await this.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(limit);

      return result.reverse().map(this.mapMessageRow);
    } catch (error) {
      logger.error('Failed to get recent messages', { error, conversationId });
      throw new DatabaseError('Failed to get recent messages', error);
    }
  }

  private mapConversationRow(row: any): Conversation {
    return {
      id: row.id,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      metadata: row.metadata,
      status: row.status,
    };
  }

  private mapMessageRow(row: any): Message {
    return {
      id: row.id,
      conversationId: row.conversationId,
      sender: row.sender,
      text: row.text,
      createdAt: new Date(row.createdAt),
      metadata: row.metadata,
    };
  }
}
