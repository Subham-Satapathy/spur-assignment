import { MessageSender } from '../../shared/types';

/**
 * Base domain event
 */
export interface DomainEvent {
  type: string;
  timestamp: Date;
  payload: any;
}

/**
 * Event fired when a user message is received
 */
export interface MessageReceivedEvent extends DomainEvent {
  type: 'MESSAGE_RECEIVED';
  payload: {
    conversationId: string;
    messageId: string;
    text: string;
    sender: MessageSender;
  };
}

/**
 * Event fired when an AI message is sent
 */
export interface MessageSentEvent extends DomainEvent {
  type: 'MESSAGE_SENT';
  payload: {
    conversationId: string;
    messageId: string;
    text: string;
    processingTime: number;
  };
}

/**
 * Event fired when a conversation is started
 */
export interface ConversationStartedEvent extends DomainEvent {
  type: 'CONVERSATION_STARTED';
  payload: {
    conversationId: string;
  };
}

/**
 * Event fired when an LLM request fails
 */
export interface LLMRequestFailedEvent extends DomainEvent {
  type: 'LLM_REQUEST_FAILED';
  payload: {
    conversationId: string;
    error: string;
  };
}

/**
 * Union type of all domain events
 */
export type AllDomainEvents =
  | MessageReceivedEvent
  | MessageSentEvent
  | ConversationStartedEvent
  | LLMRequestFailedEvent;

/**
 * Event handler function type
 */
export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;
