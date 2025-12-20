import { IChannel } from './channel.types';
import { ChannelType } from '../../shared/types';
import { TelegramChannel } from './telegram.channel';
import { WhatsAppChannel } from './whatsapp.channel';
import { WebChannel } from './web.channel';
import { config } from '../../shared/config';
import logger from '../../shared/logger';

/**
 * Factory for creating channel instances
 */
export class ChannelFactory {
  private static channels: Map<ChannelType, IChannel> = new Map();

  /**
   * Create or get a channel instance
   */
  static getChannel(type: ChannelType): IChannel {
    if (this.channels.has(type)) {
      return this.channels.get(type)!;
    }

    const channel = this.createChannel(type);
    this.channels.set(type, channel);
    return channel;
  }

  /**
   * Initialize all enabled channels
   */
  static async initializeAll(): Promise<void> {
    logger.info('Initializing all enabled channels...');

    const channelTypes: ChannelType[] = ['WEB']; //Add Other channels when implemented

    for (const type of channelTypes) {
      try {
        const channel = this.getChannel(type);
        await channel.initialize();
      } catch (error) {
        logger.error(`Failed to initialize channel ${type}`, { error });
      }
    }

    logger.info('All channels initialized');
  }

  /**
   * Shutdown all channels
   */
  static async shutdownAll(): Promise<void> {
    logger.info('Shutting down all channels...');

    for (const [type, channel] of this.channels) {
      try {
        await channel.shutdown();
      } catch (error) {
        logger.error(`Failed to shutdown channel ${type}`, { error });
      }
    }

    this.channels.clear();
    logger.info('All channels shut down');
  }

  /**
   * Create a new channel instance
   */
  private static createChannel(type: ChannelType): IChannel {
    switch (type) {
      case 'WEB':
        return new WebChannel({
          type: 'WEB',
          enabled: true,
        });

      case 'TELEGRAM':
        return new TelegramChannel({
          type: 'TELEGRAM',
          enabled: config.channels?.telegram?.enabled || false,
          apiKey: config.channels?.telegram?.apiKey,
          webhookSecret: config.channels?.telegram?.webhookSecret,
          webhookUrl: config.channels?.telegram?.webhookUrl,
        });

      case 'WHATSAPP':
        return new WhatsAppChannel({
          type: 'WHATSAPP',
          enabled: config.channels?.whatsapp?.enabled || false,
          apiKey: config.channels?.whatsapp?.apiKey,
          apiSecret: config.channels?.whatsapp?.apiSecret,
          webhookSecret: config.channels?.whatsapp?.webhookSecret,
        });

      case 'INSTAGRAM':
      case 'FACEBOOK':
        throw new Error(`Channel type ${type} not yet implemented`);

      default:
        throw new Error(`Unknown channel type: ${type}`);
    }
  }
}
