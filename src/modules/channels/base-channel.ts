import { IChannel, IncomingMessage, OutgoingMessage, ChannelConfig } from './channel.types';
import { ChannelType } from '../../shared/types';
import logger from '../../shared/logger';

/**
 * Base channel implementation with common functionality
 */
export abstract class BaseChannel implements IChannel {
  abstract readonly type: ChannelType;
  abstract readonly name: string;

  constructor(protected config: ChannelConfig) {
    if (!config.enabled) {
      logger.info(`Channel ${config.type} is disabled`);
    }
  }

  abstract sendMessage(message: OutgoingMessage): Promise<void>;
  abstract verifyWebhook(payload: any, signature?: string): boolean;
  abstract parseIncomingMessage(payload: any): IncomingMessage | null;

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      logger.info(`Skipping initialization for disabled channel: ${this.name}`);
      return;
    }

    logger.info(`Initializing channel: ${this.name}`);
    await this.onInitialize();
    logger.info(`Channel initialized successfully: ${this.name}`);
  }

  async shutdown(): Promise<void> {
    logger.info(`Shutting down channel: ${this.name}`);
    await this.onShutdown();
    logger.info(`Channel shut down successfully: ${this.name}`);
  }

  /**
   * Override this to add custom initialization logic
   */
  protected async onInitialize(): Promise<void> {
    // Default: no-op
  }

  /**
   * Override this to add custom shutdown logic
   */
  protected async onShutdown(): Promise<void> {
    // Default: no-op
  }

  /**
   * Helper to validate required config fields
   */
  protected validateConfig(requiredFields: string[]): void {
    const missing = requiredFields.filter((field) => !this.config[field]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required configuration for ${this.name}: ${missing.join(', ')}`
      );
    }
  }
}
