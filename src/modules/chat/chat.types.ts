/**
 * Chat module types
 */

export interface SendMessageRequest {
  message: string;
  sessionId?: string;
}

export interface SendMessageResponse {
  reply: string;
  sessionId: string;
  processingTime: number;
}

export interface ConversationHistoryResponse {
  sessionId: string;
  messages: Array<{
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
  }>;
}
