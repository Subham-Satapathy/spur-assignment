import { Express } from 'express';
import { createDatabase } from './shared/database';
import { ConversationRepository, ConversationService } from './modules/conversation';
import { KnowledgeRepository, KnowledgeService } from './modules/knowledge';
import { LLMService } from './modules/llm';
import { EventBus } from './modules/messaging';
import { ChatService } from './modules/chat';
import { createApp } from './modules/api';
import { config } from './shared/config';
import logger from './shared/logger';

/**
 * Application context holding all services
 */
export interface AppContext {
  app: Express;
  chatService: ChatService;
  conversationService: ConversationService;
  knowledgeService: KnowledgeService;
  llmService: LLMService;
  eventBus: EventBus;
}

/**
 * Bootstrap the application
 * - Initialize database
 * - Create all services with dependency injection
 * - Wire up Express app
 */
export async function bootstrapApp(): Promise<AppContext> {
  logger.info('Bootstrapping application...');

  // Step 1: Initialize database
  const db = createDatabase();
  logger.info('Database connection created');

  // Step 2: Create repositories
  const conversationRepository = new ConversationRepository(db);
  const knowledgeRepository = new KnowledgeRepository(db);

  // Step 3: Create event bus
  const eventBus = new EventBus();

  // Step 4: Create services
  const conversationService = new ConversationService(conversationRepository);
  const knowledgeService = new KnowledgeService(knowledgeRepository);
  const llmService = new LLMService(
    config.llm.provider,
    config.llm.apiKey,
    config.llm.model,
    config.llm.maxTokens,
    config.llm.temperature
  );

  // Step 5: Create chat orchestrator
  const chatService = new ChatService(
    conversationService,
    llmService,
    knowledgeService,
    eventBus
  );

  // Step 6: Create Express app
  const app = createApp(chatService, llmService);

  // Step 7: Subscribe to events for logging (example)
  eventBus.subscribe('MESSAGE_RECEIVED', (event) => {
    logger.info('Event: User message received', {
      conversationId: event.payload.conversationId,
      messageLength: 'text' in event.payload ? event.payload.text.length : 0,
    });
  });

  eventBus.subscribe('MESSAGE_SENT', (event) => {
    logger.info('Event: AI message sent', {
      conversationId: event.payload.conversationId,
      processingTime: 'processingTime' in event.payload ? event.payload.processingTime : 0,
    });
  });

  eventBus.subscribe('LLM_REQUEST_FAILED', (event) => {
    logger.error('Event: LLM request failed', {
      conversationId: event.payload.conversationId,
      error: 'error' in event.payload ? event.payload.error : 'Unknown error',
    });
  });

  logger.info('Application bootstrap completed');

  return {
    app,
    chatService,
    conversationService,
    knowledgeService,
    llmService,
    eventBus,
  };
}
