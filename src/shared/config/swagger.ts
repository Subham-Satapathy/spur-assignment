import { Options } from 'swagger-jsdoc';

export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Chat Support API',
      version: '1.0.0',
      description: 'AI-powered customer support chat agent with multi-channel support',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://your-production-url.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Chat',
        description: 'Chat conversation endpoints',
      },
      {
        name: 'Webhooks',
        description: 'Multi-channel webhook endpoints',
      },
    ],
    components: {
      schemas: {
        Message: {
          type: 'object',
          required: ['message'],
          properties: {
            message: {
              type: 'string',
              description: 'The message content',
              example: 'Hello, I need help with my order',
            },
            sessionId: {
              type: 'string',
              format: 'uuid',
              description: 'Optional session ID for continuing a conversation',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
          },
        },
        MessageResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Message ID',
            },
            conversationId: {
              type: 'string',
              format: 'uuid',
              description: 'Conversation ID',
            },
            role: {
              type: 'string',
              enum: ['user', 'assistant'],
              description: 'Message role',
            },
            content: {
              type: 'string',
              description: 'Message content',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Message timestamp',
            },
          },
        },
        ConversationHistory: {
          type: 'object',
          properties: {
            conversationId: {
              type: 'string',
              format: 'uuid',
              description: 'Conversation ID',
            },
            messages: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/MessageResponse',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Conversation creation timestamp',
            },
          },
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy'],
              description: 'Overall health status',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Health check timestamp',
            },
            services: {
              type: 'object',
              properties: {
                database: {
                  type: 'string',
                  enum: ['up', 'down'],
                },
                llm: {
                  type: 'string',
                  enum: ['up', 'down'],
                },
                redis: {
                  type: 'string',
                  description: 'Redis status (optional service)',
                },
              },
            },
            redis_stats: {
              type: 'object',
              description: 'Redis statistics (if available)',
              properties: {
                used_memory: {
                  type: 'string',
                },
                connected_clients: {
                  type: 'string',
                },
                uptime_in_seconds: {
                  type: 'string',
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            status: {
              type: 'integer',
              description: 'HTTP status code',
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad request - validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Validation failed',
                status: 400,
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Conversation not found',
                status: 404,
              },
            },
          },
        },
        InternalError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Internal server error',
                status: 500,
              },
            },
          },
        },
        RateLimitExceeded: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Too many requests, please try again later',
                status: 429,
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/modules/api/routes/*.ts'], // Path to the API routes
};
