import { BaseChannel } from './base-channel';
import { IncomingMessage, OutgoingMessage } from './channel.types';
import logger from '../../shared/logger';

/**
 * Telegram channel adapter - PLACEHOLDER IMPLEMENTATION
 * 
 * This demonstrates the channel architecture without actual Telegram API integration.
 * To implement: Add Telegram Bot API calls using the telegram-bot-api or node-telegram-bot-api package.
 */
export class TelegramChannel extends BaseChannel {
  readonly type = 'TELEGRAM' as const;
  readonly name = 'Telegram';

  protected async onInitialize(): Promise<void> {
    if (!this.config.enabled) return;
    logger.info('Telegram channel initialized (placeholder)');
    // TODO: Set up Telegram webhook
  }

  async sendMessage(message: OutgoingMessage): Promise<void> {
    logger.info('Telegram sendMessage called (placeholder)', {
      channelUserId: message.channelUserId,
    });
    // TODO: Implement Telegram Bot API sendMessage
  }

  verifyWebhook(_payload: any, _signature?: string): boolean {
    // TODO: Implement webhook verification
    return true;
  }

  parseIncomingMessage(_payload: any): IncomingMessage | null {
    logger.debug('Telegram parseIncomingMessage called (placeholder)');
    // TODO: Parse Telegram webhook payload
    return null;
  }
}
