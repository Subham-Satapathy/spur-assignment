import { BaseChannel } from './base-channel';
import { IncomingMessage, OutgoingMessage } from './channel.types';
import logger from '../../shared/logger';

/**
 * Web channel - handles browser-based chat (existing functionality)
 */
export class WebChannel extends BaseChannel {
  readonly type = 'WEB' as const;
  readonly name = 'Web Chat';

  async sendMessage(message: OutgoingMessage): Promise<void> {
    // For web channel, messages are returned via HTTP response
    // This is a no-op since the ChatService handles the response
    logger.debug('Web channel message prepared for response', {
      channelUserId: message.channelUserId,
    });
  }

  verifyWebhook(_payload: any, _signature?: string): boolean {
    // Web channel doesn't use webhooks
    return true;
  }

  parseIncomingMessage(_payload: any): IncomingMessage | null {
    // Web messages come through the REST API, already parsed
    if (!_payload.message || !_payload.sessionId) {
      return null;
    }

    return {
      text: _payload.message,
      channelUserId: _payload.sessionId,
      channelType: 'WEB',
      metadata: _payload.metadata,
    };
  }
}
