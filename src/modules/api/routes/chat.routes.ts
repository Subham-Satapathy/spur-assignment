import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ChatService } from '../../chat';
import { validateBody } from '../middleware/validation';

// Request schemas
const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  sessionId: z.string().uuid().optional(),
});

/**
 * Create chat routes
 */
export function createChatRoutes(chatService: ChatService): Router {
  const router = Router();

  /**
   * POST /chat/message
   * Send a message and get AI reply
   */
  router.post(
    '/message',
    validateBody(sendMessageSchema),
    async (req: Request, res: Response, next) => {
      try {
        const { message, sessionId } = req.body;
        const response = await chatService.sendMessage({ message, sessionId });
        
        res.json(response);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /chat/conversation/:id
   * Get conversation history
   */
  router.get('/conversation/:id', async (req: Request, res: Response, next) => {
    try {
      const { id } = req.params;

      // Validate UUID
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
