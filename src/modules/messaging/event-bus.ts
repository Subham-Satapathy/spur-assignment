import { EventHandler, AllDomainEvents } from './events.types';
import logger from '../../shared/logger';

export class EventBus {
  private handlers: Map<string, Set<EventHandler>>;

  constructor() {
    this.handlers = new Map();
  }

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

    return () => {
      handlers.delete(handler as EventHandler);
      logger.debug('Event handler unsubscribed', { eventType });
    };
  }

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
