import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ChatService } from '../../chat';
import { validateBody } from '../middleware/validation';
import { chatRateLimit, conversationRateLimit } from '../middleware/rate-limiter';
import { config } from '../../../shared/config';

const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(config.app.maxMessageLength, 'Message too long'),
  sessionId: z.string().uuid().optional(),
});

export function createChatRoutes(chatService: ChatService): Router {
  const router = Router();

  router.post(
    '/message',
    chatRateLimit,
    validateBody(sendMessageSchema),
    async (req: Request, res: Response, next) => {
      try {
        const { message, sessionId } = req.body;
        
        // Apply stricter rate limit for new conversations
        if (!sessionId) {
          conversationRateLimit(req, res, () => {});
        }
        
        const response = await chatService.sendMessage({ message, sessionId });
        
        res.json(response);
      } catch (error) {
        next(error);
      }
    }
  );

  router.get('/conversation/:id', async (req: Request, res: Response, next) => {
    try {
      const { id } = req.params;

      const uuidSchema = z.string().uuid();
      const validatedId = uuidSchema.parse(id);

      const history = await chatService.getConversationHistory(validatedId);
      res.json(history);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
