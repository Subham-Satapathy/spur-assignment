# Architecture Documentation

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Browser)                    │
│                      public/index.html                       │
│         (Vanilla JS - Chat UI with real-time updates)       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Express)                      │
│                    modules/api/                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Validation   │  │ Error Handler│  │ Logger       │      │
│  │ Middleware   │  │ Middleware   │  │ Middleware   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Chat Routes  │  │ Health Routes│                        │
│  └──────────────┘  └──────────────┘                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Chat Service (Orchestrator)                 │
│                    modules/chat/                             │
│  • Coordinates all business operations                      │
│  • Validates input                                          │
│  • Manages conversation flow                               │
│  • Publishes domain events                                 │
└───┬──────────────────┬──────────────────┬──────────────────┘
    │                  │                  │
    ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Conversation │  │  LLM Service │  │  Knowledge   │
│   Module     │  │              │  │   Module     │
└──────────────┘  └──────────────┘  └──────────────┘
    │                  │                  │
    │                  │                  │
    ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Conversation │  │  OpenAI/     │  │  Knowledge   │
│ Repository   │  │  Claude      │  │ Repository   │
└──────────────┘  │  Provider    │  └──────────────┘
    │             └──────────────┘       │
    │                  │                 │
    ▼                  │                 ▼
┌──────────────────────┴─────────────────────────────┐
│              PostgreSQL Database                    │
│  • conversations table                             │
│  • messages table                                  │
│  • knowledge_entries table                         │
└────────────────────────────────────────────────────┘

         ┌────────────────────────────────┐
         │     Event Bus (Messaging)      │
         │  • MessageReceived             │
         │  • MessageSent                 │
         │  • ConversationStarted         │
         │  • LLMRequestFailed            │
         └────────────────────────────────┘
```

## Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                      Dependency Flow                         │
│                   (Top → Down = Depends On)                  │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │  API Module  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Chat Module  │ (Orchestrator)
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐    ┌──────────────┐   ┌──────────────┐
│Conversation  │    │  LLM Module  │   │  Knowledge   │
│   Module     │    │              │   │   Module     │
└──────┬───────┘    └──────┬───────┘   └──────┬───────┘
       │                   │                  │
       │                   │                  │
       └───────────────────┼──────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ Shared Module  │
                  │ • Database     │
                  │ • Config       │
                  │ • Logger       │
                  │ • Errors       │
                  │ • Types        │
                  └────────────────┘

         ┌──────────────────────────┐
         │  Messaging Module        │
         │  (Event Bus)             │
         │  ← All modules publish   │
         │  → Subscribers consume   │
         └──────────────────────────┘
```

## Request Flow: User Message → AI Response

```
1. USER SENDS MESSAGE
   │
   ├─→ Frontend (index.html)
   │   • User types message
   │   • Form submission
   │   • Add user message to UI
   │   • Show typing indicator
   │
2. HTTP REQUEST
   │
   ├─→ POST /chat/message
   │   • Express receives request
   │   • Middleware: requestLogger
   │   • Middleware: validateBody (Zod schema)
   │
3. CHAT ORCHESTRATION
   │
   ├─→ ChatService.sendMessage()
   │   ├─→ Validate input (length, not empty)
   │   ├─→ Get or create conversation
   │   │   └─→ ConversationService.createConversation()
   │   │       └─→ ConversationRepository.createConversation()
   │   │           └─→ PostgreSQL INSERT
   │   │
   │   ├─→ Save user message
   │   │   └─→ ConversationService.addMessage('user', text)
   │   │       └─→ ConversationRepository.addMessage()
   │   │           └─→ PostgreSQL INSERT + UPDATE
   │   │
   │   ├─→ Publish event: MESSAGE_RECEIVED
   │   │   └─→ EventBus.publish()
   │   │
   │   ├─→ Get conversation context
   │   │   └─→ ConversationService.getRecentMessagesForContext()
   │   │       └─→ ConversationRepository.getRecentMessages()
   │   │           └─→ PostgreSQL SELECT (last 10 messages)
   │   │
   │   ├─→ Get knowledge base
   │   │   └─→ KnowledgeService.formatForPrompt()
   │   │       └─→ KnowledgeRepository.getActive()
   │   │           └─→ PostgreSQL SELECT (all active knowledge)
   │   │
   │   ├─→ Generate AI reply
   │   │   └─→ LLMService.generateReply(context)
   │   │       └─→ OpenAIProvider.generateReply()
   │   │           ├─→ Build system prompt + knowledge
   │   │           ├─→ Build conversation messages
   │   │           ├─→ Call OpenAI API
   │   │           └─→ Return reply + metadata
   │   │
   │   ├─→ Save AI message
   │   │   └─→ ConversationService.addMessage('ai', reply)
   │   │       └─→ ConversationRepository.addMessage()
   │   │           └─→ PostgreSQL INSERT + UPDATE
   │   │
   │   └─→ Publish event: MESSAGE_SENT
   │       └─→ EventBus.publish()
   │
4. HTTP RESPONSE
   │
   ├─→ Return JSON { reply, sessionId, processingTime }
   │
5. FRONTEND UPDATE
   │
   └─→ Frontend receives response
       • Remove typing indicator
       • Add AI message to UI
       • Auto-scroll to bottom
       • Re-enable input
```

## Data Flow

### Write Operations (Creating Conversation & Messages)

```
ChatService
    │
    ├─→ ConversationService.createConversation()
    │       │
    │       └─→ ConversationRepository.createConversation()
    │               │
    │               └─→ PostgreSQL: INSERT INTO conversations
    │
    └─→ ConversationService.addMessage()
            │
            └─→ ConversationRepository.addMessage()
                    │
                    ├─→ BEGIN TRANSACTION
                    ├─→ PostgreSQL: INSERT INTO messages
                    ├─→ PostgreSQL: UPDATE conversations SET updated_at
                    └─→ COMMIT TRANSACTION
```

### Read Operations (Getting Conversation Context)

```
ChatService
    │
    └─→ ConversationService.getRecentMessagesForContext()
            │
            └─→ ConversationRepository.getRecentMessages()
                    │
                    └─→ PostgreSQL: 
                        SELECT * FROM messages
                        WHERE conversation_id = $1
                        ORDER BY created_at DESC
                        LIMIT 10
```

### LLM Context Building

```
ChatService
    │
    ├─→ Get conversation history (last 10 messages)
    │
    ├─→ Get knowledge base (formatted)
    │
    └─→ Build context object:
        {
          conversationId: "uuid",
          messages: [
            { sender: "user", text: "...", timestamp: "..." },
            { sender: "ai", text: "...", timestamp: "..." }
          ],
          knowledgeBase: "## Shipping\n**Regions**\n..."
        }
        │
        └─→ LLMService.generateReply(context)
                │
                └─→ Provider builds prompt:
                    [
                      { role: "system", content: systemPrompt + knowledgeBase },
                      { role: "user", content: messages[0].text },
                      { role: "assistant", content: messages[1].text },
                      ...
                      { role: "user", content: currentUserMessage }
                    ]
```

## Event-Driven Architecture

### Event Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Event Bus (In-Memory)                   │
│                                                              │
│  Publishers                Subscribers                      │
│  ┌──────────────┐         ┌──────────────┐                │
│  │ Chat Module  │────────→│ Logger       │                │
│  └──────────────┘         └──────────────┘                │
│  ┌──────────────┐         ┌──────────────┐                │
│  │ Conversation │────────→│ Analytics    │                │
│  │ Module       │         │ (future)     │                │
│  └──────────────┘         └──────────────┘                │
│  ┌──────────────┐         ┌──────────────┐                │
│  │ LLM Module   │────────→│ Monitoring   │                │
│  └──────────────┘         │ (future)     │                │
│                            └──────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Domain Events

1. **MESSAGE_RECEIVED**
   - When: User message saved to database
   - Payload: conversationId, messageId, text, sender
   - Subscribers: Logger, (future: analytics, webhooks)

2. **MESSAGE_SENT**
   - When: AI response saved to database
   - Payload: conversationId, messageId, text, processingTime
   - Subscribers: Logger, (future: monitoring, billing)

3. **CONVERSATION_STARTED**
   - When: New conversation created
   - Payload: conversationId
   - Subscribers: Logger, (future: CRM integration)

4. **LLM_REQUEST_FAILED**
   - When: LLM API call fails
   - Payload: conversationId, error
   - Subscribers: Logger, (future: alerting, fallback handling)

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                       Error Hierarchy                        │
└─────────────────────────────────────────────────────────────┘

                      DomainError (Base)
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
  ValidationError    NotFoundError       LLMError
   (400)              (404)               (503)
        │                   │                   │
  DatabaseError      RateLimitError   ConfigurationError
   (500)              (429)               (500)

┌─────────────────────────────────────────────────────────────┐
│                       Error Flow                             │
└─────────────────────────────────────────────────────────────┘

Service Layer throws DomainError
        │
        ▼
Express catches error in route handler
        │
        ├─→ next(error)
        │
        ▼
Error Handler Middleware
        │
        ├─→ Is DomainError?
        │   ├─→ YES: Return { error, message, statusCode }
        │   └─→ NO:  Return { error: "INTERNAL_ERROR", 500 }
        │
        └─→ Log error with Winston
```

## Security Considerations

### Input Validation

```
Request → Zod Schema Validation → Business Logic

Example:
{
  message: z.string().min(1).max(2000),
  sessionId: z.string().uuid().optional()
}
```

### SQL Injection Prevention

All database queries use parameterized statements:
```typescript
await pool.query(
  'SELECT * FROM messages WHERE conversation_id = $1',
  [conversationId]  // ← Safe from SQL injection
);
```

### XSS Prevention

Frontend escapes all user input:
```javascript
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

### API Key Security

- API keys stored in environment variables
- Never committed to repository
- `.env` in `.gitignore`
- Validated on startup

## Scalability Considerations

### Current Architecture (Single Instance)

```
┌──────────────┐
│   Client 1   │─┐
└──────────────┘ │
┌──────────────┐ │    ┌──────────────┐    ┌──────────────┐
│   Client 2   │─┼───→│ Node Server  │───→│  PostgreSQL  │
└──────────────┘ │    └──────────────┘    └──────────────┘
┌──────────────┐ │          │
│   Client 3   │─┘          │
└──────────────┘            ▼
                     ┌──────────────┐
                     │  OpenAI API  │
                     └──────────────┘
```

### Horizontal Scaling (Future)

```
┌──────────────┐
│   Client 1   │─┐
└──────────────┘ │    ┌──────────────┐
┌──────────────┐ │    │ Load Balancer│
│   Client 2   │─┼───→│   (nginx)    │
└──────────────┘ │    └──────┬───────┘
┌──────────────┐ │           │
│   Client 3   │─┘    ┌──────┴───────┐
└──────────────┘      │              │
              ┌───────▼─────┐ ┌──────▼──────┐
              │ Node Server │ │ Node Server │
              │ Instance 1  │ │ Instance 2  │
              └──────┬──────┘ └──────┬──────┘
                     │                │
              ┌──────┴────────────────┴──────┐
              │    Shared PostgreSQL DB      │
              └──────────────────────────────┘
                     │
              ┌──────▼──────┐
              │ Redis Cache │ (optional)
              └─────────────┘
```

## Module Extraction Path (Future Microservices)

If the application grows beyond monolith scale:

1. **Extract LLM Module** → Separate AI Service
   - Independent scaling
   - Multiple model support
   - A/B testing different providers

2. **Extract Conversation Module** → Conversation Service
   - Handles all persistence
   - Shared by multiple channels

3. **Add Message Queue** → RabbitMQ/Kafka
   - Replace in-memory event bus
   - Durable event storage
   - Cross-service communication

4. **Add API Gateway** → Kong/Envoy
   - Route to appropriate service
   - Authentication/authorization
   - Rate limiting

## Performance Optimization Strategies

### Database

- ✅ Connection pooling (max 20 connections)
- ✅ Indexes on frequently queried columns
- 🔄 Add Redis caching for active conversations
- 🔄 Database query optimization (EXPLAIN ANALYZE)
- 🔄 Read replicas for analytics queries

### LLM

- ✅ Limit conversation history (last 10 messages)
- ✅ Cap max tokens (500)
- 🔄 Implement response caching for common questions
- 🔄 Use cheaper models for simple queries
- 🔄 Implement streaming responses

### API

- ✅ Validation at edge (Zod schemas)
- ✅ Request logging with performance metrics
- 🔄 Rate limiting per IP/session
- 🔄 Response compression (gzip)
- 🔄 CDN for static assets

Legend:
- ✅ Implemented
- 🔄 Future enhancement
