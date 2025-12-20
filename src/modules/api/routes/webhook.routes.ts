import { Router, Request, Response } from 'express';
import { ChannelFactory } from '../../channels';
import { ChatService } from '../../chat';
import logger from '../../../shared/logger';

/**
 * Create webhook routes for messaging channels
 */
export function createChannelWebhookRoutes(chatService: ChatService): Router {
  const router = Router();

  /**
   * Telegram webhook endpoint
   */
  router.post('/telegram', async (req: Request, res: Response, next) => {
    try {
      const telegramChannel = ChannelFactory.getChannel('TELEGRAM');

      // Verify webhook
      const signature = req.headers['x-telegram-bot-api-secret-token'] as string;
      if (!telegramChannel.verifyWebhook(req.body, signature)) {
        logger.warn('Telegram webhook verification failed');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Parse incoming message
      const incomingMessage = telegramChannel.parseIncomingMessage(req.body);

      if (!incomingMessage) {
        logger.debug('No message to process from Telegram webhook');
        return res.status(200).json({ ok: true });
      }

      logger.info('Received Telegram message', {
        channelUserId: incomingMessage.channelUserId,
      });

      // Process through chat service
      const response = await chatService.sendMessage(
        {
          message: incomingMessage.text,
          sessionId: undefined, // Let service create/find conversation
        },
        'TELEGRAM',
        incomingMessage.channelUserId
      );

      // Send reply back via Telegram
      await telegramChannel.sendMessage({
        text: response.reply,
        channelUserId: incomingMessage.channelUserId,
      });

      res.status(200).json({ ok: true });
      return;
    } catch (error) {
      logger.error('Telegram webhook error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return next(error);
    }
  });

  /**
   * WhatsApp webhook endpoint
   */
  router.post('/whatsapp', async (req: Request, res: Response, next) => {
    try {
      const whatsappChannel = ChannelFactory.getChannel('WHATSAPP');

      // Verify webhook
      const signature = req.headers['x-hub-signature-256'] as string;
      if (!whatsappChannel.verifyWebhook(req.body, signature)) {
        logger.warn('WhatsApp webhook verification failed');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Parse incoming message
      const incomingMessage = whatsappChannel.parseIncomingMessage(req.body);

      if (!incomingMessage) {
        logger.debug('No message to process from WhatsApp webhook');
        return res.status(200).json({ status: 'ok' });
      }

      logger.info('Received WhatsApp message', {
        channelUserId: incomingMessage.channelUserId,
      });

      // Process through chat service
      const response = await chatService.sendMessage(
        {
          message: incomingMessage.text,
          sessionId: undefined,
        },
        'WHATSAPP',
        incomingMessage.channelUserId
      );

      // Send reply back via WhatsApp
      await whatsappChannel.sendMessage({
        text: response.reply,
        channelUserId: incomingMessage.channelUserId,
      });

      res.status(200).json({ status: 'ok' });
      return;
    } catch (error) {
      logger.error('WhatsApp webhook error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return next(error);
    }
  });

  /**
   * WhatsApp webhook verification (GET request from Meta)
   */
  router.get('/whatsapp', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Verify token (should match your configured webhook secret)
    const expectedToken = process.env.WHATSAPP_WEBHOOK_SECRET || 'your_verify_token';

    if (mode === 'subscribe' && token === expectedToken) {
      logger.info('WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      logger.warn('WhatsApp webhook verification failed');
      res.status(403).send('Forbidden');
    }
  });

  return router;
}
