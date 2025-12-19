import { MessageSender } from '../../shared/types';

export interface DomainEvent {
  type: string;
  timestamp: Date;
  payload: any;
}

export interface MessageReceivedEvent extends DomainEvent {
  type: 'MESSAGE_RECEIVED';
  payload: {
    conversationId: string;
    messageId: string;
    text: string;
    sender: MessageSender;
  };
}

export interface MessageSentEvent extends DomainEvent {
  type: 'MESSAGE_SENT';
  payload: {
    conversationId: string;
    messageId: string;
    text: string;
    processingTime: number;
  };
}

export interface ConversationStartedEvent extends DomainEvent {
  type: 'CONVERSATION_STARTED';
  payload: {
    conversationId: string;
  };
}

export interface LLMRequestFailedEvent extends DomainEvent {
  type: 'LLM_REQUEST_FAILED';
  payload: {
    conversationId: string;
    error: string;
  };
}

export type AllDomainEvents =
  | MessageReceivedEvent
  | MessageSentEvent
  | ConversationStartedEvent
  | LLMRequestFailedEvent;

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;
