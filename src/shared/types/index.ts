/**
 * Common type definitions shared across modules
 */

/**
 * Message sender type
 */
export type MessageSender = 'user' | 'ai';

/**
 * Conversation status
 */
export type ConversationStatus = 'active' | 'closed';

/**
 * Conversation entity
 */
export interface Conversation {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
  status: ConversationStatus;
}

/**
 * Message entity
 */
export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  text: string;
  createdAt: Date;
  metadata?: {
    llmModel?: string;
    tokens?: number;
    processingTime?: number;
    [key: string]: any;
  };
}

/**
 * Knowledge base entry
 */
export interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * LLM provider types
 */
export type LLMProvider = 'openai';

/**
 * Conversation context for LLM
 */
export interface ConversationContext {
  conversationId: string;
  messages: Array<{
    sender: MessageSender;
    text: string;
    timestamp: Date;
  }>;
  knowledgeBase: string;
}

/**
 * LLM response
 */
export interface LLMResponse {
  reply: string;
  metadata: {
    model: string;
    tokens?: number;
    processingTime: number;
  };
}

/**
 * Database query options
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: 'ASC' | 'DESC';
}
