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

  /**
   * @swagger
   * /chat/message:
   *   post:
   *     summary: Send a message to the AI chat assistant
   *     description: Send a message and receive an AI-generated response. Can continue an existing conversation by providing a sessionId.
   *     tags: [Chat]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Message'
   *           examples:
   *             newConversation:
   *               summary: Start new conversation
   *               value:
   *                 message: Hello, I need help with my order
   *             continueConversation:
   *               summary: Continue existing conversation
   *               value:
   *                 message: What's the status of order #12345?
   *                 sessionId: 550e8400-e29b-41d4-a716-446655440000
   *     responses:
   *       200:
   *         description: Successfully received AI response
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 response:
   *                   $ref: '#/components/schemas/MessageResponse'
   *                 conversationId:
   *                   type: string
   *                   format: uuid
   *             example:
   *               response:
   *                 id: 123e4567-e89b-12d3-a456-426614174000
   *                 conversationId: 550e8400-e29b-41d4-a716-446655440000
   *                 role: assistant
   *                 content: Hello! I'd be happy to help you with your order. Could you please provide your order number?
   *                 timestamp: '2025-12-20T10:30:00.000Z'
   *               conversationId: 550e8400-e29b-41d4-a716-446655440000
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       429:
   *         $ref: '#/components/responses/RateLimitExceeded'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
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

  /**
   * @swagger
   * /chat/conversation/{id}:
   *   get:
   *     summary: Get conversation history
   *     description: Retrieve the complete message history for a specific conversation
   *     tags: [Chat]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         description: UUID of the conversation
   *         schema:
   *           type: string
   *           format: uuid
   *         example: 550e8400-e29b-41d4-a716-446655440000
   *     responses:
   *       200:
   *         description: Conversation history retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ConversationHistory'
   *             example:
   *               conversationId: 550e8400-e29b-41d4-a716-446655440000
   *               messages:
   *                 - id: 123e4567-e89b-12d3-a456-426614174000
   *                   conversationId: 550e8400-e29b-41d4-a716-446655440000
   *                   role: user
   *                   content: Hello, I need help with my order
   *                   timestamp: '2025-12-20T10:30:00.000Z'
   *                 - id: 123e4567-e89b-12d3-a456-426614174001
   *                   conversationId: 550e8400-e29b-41d4-a716-446655440000
   *                   role: assistant
   *                   content: Hello! I'd be happy to help you with your order. Could you please provide your order number?
   *                   timestamp: '2025-12-20T10:30:05.000Z'
   *               createdAt: '2025-12-20T10:30:00.000Z'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
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
