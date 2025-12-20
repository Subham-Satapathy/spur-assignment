import { BaseChannel } from './base-channel';
import { IncomingMessage, OutgoingMessage } from './channel.types';
import logger from '../../shared/logger';

/**
 * WhatsApp channel adapter - PLACEHOLDER IMPLEMENTATION
 * 
 * This demonstrates the channel architecture without actual WhatsApp API integration.
 * To implement: Add Meta WhatsApp Business API calls using the whatsapp-business-sdk or direct API.
 */
export class WhatsAppChannel extends BaseChannel {
  readonly type = 'WHATSAPP' as const;
  readonly name = 'WhatsApp';

  protected async onInitialize(): Promise<void> {
    if (!this.config.enabled) return;
    logger.info('WhatsApp channel initialized (placeholder)');
    // TODO: Verify Meta API access token
  }

  async sendMessage(message: OutgoingMessage): Promise<void> {
    logger.info('WhatsApp sendMessage called (placeholder)', {
      phone: message.channelUserId,
    });
    // TODO: Implement WhatsApp Business API sendMessage
  }

  verifyWebhook(_payload: any, _signature?: string): boolean {
    // TODO: Implement Meta webhook signature verification
    return true;
  }

  parseIncomingMessage(payload: any): IncomingMessage | null {
    logger.debug('WhatsApp parseIncomingMessage called (placeholder)');
    // TODO: Parse WhatsApp webhook payload
    return null;
  }
}
