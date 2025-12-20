import { ChannelType } from '../../shared/types';

/**
 * Incoming message from any channel
 */
export interface IncomingMessage {
  text: string;
  channelUserId: string;
  channelType: ChannelType;
  metadata?: Record<string, any>;
}

/**
 * Outgoing message to any channel
 */
export interface OutgoingMessage {
  text: string;
  channelUserId: string;
  metadata?: Record<string, any>;
}

/**
 * Channel interface - implement this for each messaging platform
 */
export interface IChannel {
  readonly type: ChannelType;
  readonly name: string;

  /**
   * Send a message through this channel
   */
  sendMessage(message: OutgoingMessage): Promise<void>;

  /**
   * Initialize the channel (setup webhooks, connect to APIs, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Shutdown the channel gracefully
   */
  shutdown(): Promise<void>;

  /**
   * Verify webhook signature/authenticity
   */
  verifyWebhook(payload: any, signature?: string): boolean;

  /**
   * Parse incoming webhook payload into standardized format
   */
  parseIncomingMessage(payload: any): IncomingMessage | null;
}

/**
 * Channel configuration
 */
export interface ChannelConfig {
  type: ChannelType;
  enabled: boolean;
  apiKey?: string;
  apiSecret?: string;
  webhookSecret?: string;
  webhookUrl?: string;
  [key: string]: any;
}
