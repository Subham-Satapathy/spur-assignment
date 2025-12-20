/**
 * Common type definitions shared across modules
 */

/**
 * Message sender type
 */
export type MessageSender = 'user' | 'ai';

/**
 * Channel type
 */
export type ChannelType = 'WEB' | 'TELEGRAM' | 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK';

/**
 * Conversation status
 */
export type ConversationStatus = 'active' | 'closed';

/**
 * User entity
 */
export interface User {
  id: string;
  email?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Conversation entity
 */
export interface Conversation {
  id: string;
  userId?: string;
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
  channelType: ChannelType;
  channelUserId?: string;
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
 * Tool execution entity
 */
export interface ToolExecution {
  id: string;
  messageId: string;
  toolName: string;
  input: any;
  output?: any;
  status: 'pending' | 'success' | 'error';
  errorMessage?: string;
  executedAt: Date;
}

/**
 * LLM provider types
 */
export type LLMProvider = 'openai' | 'anthropic';

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
  availableTools?: ToolDefinition[];
}

/**
 * Tool definition for LLM
 */
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
}

/**
 * Tool call from LLM
 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * LLM response
 */
export interface LLMResponse {
  reply: string;
  toolCalls?: ToolCall[];
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
