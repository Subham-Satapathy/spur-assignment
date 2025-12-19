import { EventHandler, AllDomainEvents } from './events.types';
import logger from '../../shared/logger';

/**
 * Simple in-memory event bus for cross-module communication
 */
export class EventBus {
  private handlers: Map<string, Set<EventHandler>>;

  constructor() {
    this.handlers = new Map();
  }

  /**
   * Subscribe to an event type
   */
  subscribe<T extends AllDomainEvents>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    const handlers = this.handlers.get(eventType)!;
    handlers.add(handler as EventHandler);

    logger.debug('Event handler subscribed', { eventType });

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as EventHandler);
      logger.debug('Event handler unsubscribed', { eventType });
    };
  }

  /**
   * Publish an event to all subscribers
   */
  async publish<T extends AllDomainEvents>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.type);

    if (!handlers || handlers.size === 0) {
      logger.debug('No handlers for event', { eventType: event.type });
      return;
    }

    logger.debug('Publishing event', {
      eventType: event.type,
      handlerCount: handlers.size,
    });

    // Execute all handlers (in parallel for async handlers)
    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        logger.error('Event handler error', {
          eventType: event.type,
          error,
        });
      }
    });

    await Promise.all(promises);
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
    logger.debug('Event bus cleared');
  }

  /**
   * Get handler count for an event type
   */
  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.size || 0;
  }
}
