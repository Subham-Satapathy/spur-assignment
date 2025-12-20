# AI-Powered Customer Support Chat

An intelligent, production-ready customer support chatbot built with a **modular monolith architecture**. Features multi-channel support readiness, tool/function calling infrastructure, and extensible LLM provider integration.

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** database (NeonDB, Railway, or local)
- **OpenAI API Key** (for GPT-4/GPT-3.5)
- Optional: **Redis** (for caching)

---

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Clone repository
cd "Spur Assignment"

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Database Setup

#### Option A: Using NeonDB (Recommended for Production)

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project and database
3. Copy the connection string (it looks like `postgresql://user:pass@host.neon.tech/dbname`)

#### Option B: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb ai_chat_support
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```bash
# Copy example env file
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (use your NeonDB or local PostgreSQL URL)
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# OpenAI API (REQUIRED)
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4

# Optional: Advanced LLM Configuration
LLM_MAX_TOKENS=500
LLM_TEMPERATURE=0.7

# Optional: Redis (for production caching)
REDIS_ENABLED=false
REDIS_URL=redis://localhost:6379

# Application Settings
MAX_MESSAGE_LENGTH=2000
MAX_CONVERSATION_HISTORY=10

# Feature Flags (disabled by default - architecture in place)
ENABLE_TOOLS=false
TELEGRAM_ENABLED=false
WHATSAPP_ENABLED=false
```

### 4. Database Migration & Seeding

```bash
# Push schema to database (creates tables)
npm run db:push

# Seed with sample knowledge base data
npm run db:seed

# Or do both in one command
npm run db:setup
```

This will create:
- `conversations` table
- `messages` table
- `knowledge_entries` table
- `users` table (for future multi-channel support)
- `tool_executions` table (for future AI agent tools)

Sample knowledge base includes:
- Shipping policies
- Return & refund process
- Payment methods
- Support hours & contact info

### 5. Run the Application

#### Development Mode (with hot reload)

```bash
# Run both backend and frontend
npm run dev:all

# Or run separately
npm run dev              # Backend only (port 3000)
npm run dev:frontend     # Frontend only (port 5173)
```

#### Production Mode

```bash
# Build everything
npm run build:all

# Start server
npm start
```

**Open your browser**: http://localhost:5173 (dev) or http://localhost:3000 (production)

---

## Architecture Overview

### **Modular Monolith Structure**

The backend follows a **feature-based modular monolith** architecture with clear separation of concerns:

```
src/
├── modules/              # Feature modules (independently testable)
│   ├── api/             # HTTP layer (Express routes, middleware)
│   ├── chat/            # Chat orchestration service
│   ├── conversation/    # Conversation & message persistence
│   ├── knowledge/       # Knowledge base management
│   ├── llm/             # LLM provider abstraction
│   ├── messaging/       # Event bus (pub/sub)
│   ├── channels/        # Multi-channel support (WEB, Telegram, WhatsApp)
│   └── tools/           # AI function calling tools
├── shared/              # Cross-cutting concerns
│   ├── config/         # Configuration management
│   ├── database/       # Database client (Drizzle ORM)
│   ├── errors/         # Custom error classes
│   ├── logger/         # Winston logging
│   ├── redis/          # Redis client (caching)
│   └── types/          # Shared TypeScript types
└── scripts/            # Utility scripts (migration, seed)
```

### **Layered Architecture**

1. **API Layer** (`modules/api`)
   - Express routes, middleware
   - Request validation (Zod)
   - Rate limiting, error handling

2. **Service Layer** (`modules/*/service.ts`)
   - Business logic
   - Orchestration between modules
   - Transaction management

3. **Repository Layer** (`modules/*/repository.ts`)
   - Database access (Drizzle ORM)
   - Query optimization
   - Data mapping

4. **Domain Layer** (`shared/types`)
   - Type definitions
   - Business entities
   - Validation rules

### **Key Design Decisions**

#### **Interface-Based LLM Provider**
```typescript
interface ILLMProvider {
  generateReply(context: ConversationContext, tools?: ToolDefinition[]): Promise<LLMResponse>;
  healthCheck(): Promise<boolean>;
}
```
- **Why**: Easy to swap OpenAI → Anthropic → Local models
- **Factory Pattern**: `LLMProviderFactory` creates providers from config
- **Benefit**: Zero code changes to switch AI providers

#### **Channel Abstraction for Multi-Platform**
```typescript
interface IChannel {
  type: ChannelType;
  sendMessage(message: OutgoingMessage): Promise<void>;
  parseIncomingMessage(payload: any): IncomingMessage | null;
  verifyWebhook(payload: any, signature?: string): boolean;
}
```
- **Why**: Designed for Telegram, WhatsApp, Instagram integration
- **Current**: Web channel fully functional
- **Future**: Enable other channels via env vars + API keys
- **Benefit**: Each platform isolated, no cross-contamination

#### **Tool Registry for AI Agent Capabilities**
```typescript
class ToolRegistry {
  register(tool: ITool): void;
  execute(name: string, params: any): Promise<any>;
  getAllDefinitions(): ToolDefinition[];
}
```
- **Why**: Enables AI to call functions (check inventory, track orders, etc.)
- **Architecture**: Ready but disabled by default (`ENABLE_TOOLS=false`)
- **Benefit**: Add Shopify/Stripe integrations without touching core logic

#### **Event-Driven Communication**
```typescript
eventBus.publish({ type: 'MESSAGE_RECEIVED', payload: { ... } });
eventBus.subscribe('MESSAGE_RECEIVED', handler);
```
- **Why**: Decouples modules (analytics, webhooks, notifications)
- **Benefit**: Add features without modifying existing code

#### **Two-Tier Caching Strategy**
- **In-Memory**: Fast, per-instance (knowledge base)
- **Redis**: Shared across instances, persistent
- **Graceful Degradation**: Falls back to in-memory if Redis unavailable

---

## LLM Integration

### **Provider: OpenAI**

Using **GPT-4** (or GPT-3.5-turbo for cost optimization).

**Why OpenAI?**
- Best-in-class function calling support
- Reliable API with good rate limits
- Excellent instruction following
- Strong reasoning for customer support scenarios

### **Prompting Strategy**

#### System Prompt Structure
```
You are a helpful and friendly customer support agent for an e-commerce store.

Guidelines:
- Be polite, empathetic, and helpful
- Provide accurate information based on the knowledge base
- If you don't know something, admit it
- Keep responses concise but complete
- Use a warm, conversational tone

[Knowledge Base Content]
## Shipping
...
## Returns & Refunds
...
```

#### Context Management
- **Conversation History**: Last 10 messages (configurable)
- **Knowledge Base**: Cached and injected into system prompt
- **Token Optimization**: 
  - Max tokens: 500 (prevents overly verbose responses)
  - Temperature: 0.7 (balanced creativity/consistency)

#### Function Calling (Architecture Ready)
```typescript
// Tools available to LLM (when enabled)
{
  "name": "check_inventory",
  "description": "Check product stock levels",
  "parameters": { "productId": "string" }
}
```

### **LLM Configuration**

Easily customizable via environment variables:

```env
OPENAI_MODEL=gpt-4           # or gpt-3.5-turbo
LLM_MAX_TOKENS=500          # Response length limit
LLM_TEMPERATURE=0.7         # Creativity (0-1)
```

### **Error Handling**

Comprehensive error mapping for better UX:
- Rate limits → "AI service temporarily busy"
- Context length → "Conversation too long, start new one"
- Network errors → "Cannot connect, try again"
- Invalid API key → "Configuration error, contact support"

---

## API Endpoints

### Chat API

```bash
# Send a message
POST /chat/message
Content-Type: application/json

{
  "message": "What are your shipping policies?",
  "sessionId": "optional-conversation-id"
}

Response:
{
  "reply": "We offer free shipping on orders over $50...",
  "sessionId": "uuid-of-conversation",
  "processingTime": 1234
}
```

```bash
# Get conversation history
GET /chat/conversation/:sessionId

Response:
{
  "sessionId": "uuid",
  "messages": [
    {
      "id": "msg-uuid",
      "sender": "user",
      "text": "Hello",
      "timestamp": "2024-01-20T10:00:00Z"
    }
  ]
}
```

### Health Check

```bash
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:00:00Z",
  "database": "connected",
  "llm": "healthy"
}
```

---

## Trade-offs & "If I Had More Time..."

### **Current Trade-offs**

#### **Chose: Modular Monolith**
- **Instead of**: Microservices
- **Why**: Faster development, easier deployment, suitable for MVP
- **Trade-off**: Single deployment unit (vs independent scaling)

#### **Chose: PostgreSQL with Drizzle ORM**
- **Instead of**: MongoDB, Prisma
- **Why**: Type-safe SQL, excellent performance, migrations
- **Trade-off**: More verbose than document stores

#### **Chose: OpenAI Only**
- **Instead of**: Multi-provider from day 1
- **Why**: Focus on UX and architecture first
- **Trade-off**: Vendor lock-in (mitigated by abstraction layer)

#### **Chose: Single Web Channel**
- **Instead of**: All channels at once
- **Why**: Prove architecture extensibility without overbuilding
- **Trade-off**: Telegram/WhatsApp placeholder implementations

### **If I Had More Time... (Priority Order)**

#### **Priority 1: Production Hardening**
- [ ] **Comprehensive testing**
  - Unit tests for services (Jest)
  - Integration tests for API endpoints (Supertest)
  - E2E tests for frontend (Playwright)
  - Target: 80%+ coverage

- [ ] **Observability**
  - OpenTelemetry tracing
  - Prometheus metrics
  - Grafana dashboards
  - Error tracking (Sentry)

- [ ] **Security enhancements**
  - JWT authentication
  - API key management
  - Input sanitization
  - Rate limiting per user (not just IP)

#### **Priority 2: Advanced Features**
- [ ] **Real AI Agent Tools**
  - Shopify API integration (inventory, orders)
  - Stripe payment links
  - Email/SMS notifications
  - Calendar booking

- [ ] **Multi-Channel Support**
  - Telegram Bot API (webhook ready, implementation pending)
  - WhatsApp Business API (webhook ready, implementation pending)
  - Instagram Messaging
  - Facebook Messenger

- [ ] **Conversation Intelligence**
  - Sentiment analysis
  - Intent classification
  - Auto-escalation to human agents
  - CSAT surveys

#### **Priority 3: Scale & Optimization**
- [ ] **Performance**
  - WebSocket for real-time updates
  - GraphQL for flexible queries
  - CDN for static assets
  - Database query optimization

- [ ] **Analytics Dashboard**
  - Conversation metrics
  - Response time tracking
  - User satisfaction scores
  - Knowledge base gap analysis

- [ ] **Multi-tenancy**
  - Support multiple stores
  - Per-tenant knowledge bases
  - Isolated data and configs

#### **Nice-to-Have Enhancements**
- [ ] Voice input/output
- [ ] File upload support (images, receipts)
- [ ] Multilingual support
- [ ] Admin panel for knowledge base management
- [ ] A/B testing for prompts
- [ ] Local LLM support (Ollama, LLaMA)

---

## Technology Stack

### **Backend**
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (NeonDB recommended)
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Logging**: Winston
- **Caching**: Redis (optional, with in-memory fallback)

### **Frontend**
- **Framework**: Svelte + Vite
- **Styling**: Custom CSS (no frameworks)
- **State**: Svelte stores
- **Build**: Vite (fast HMR)

### **AI/LLM**
- **Provider**: OpenAI (GPT-4 / GPT-3.5-turbo)
- **Abstraction**: Custom `ILLMProvider` interface
- **Tool Calling**: OpenAI function calling API

### **DevOps**
- **Deployment**: Render, Railway, or Vercel
- **CI/CD**: GitHub Actions (ready to add)
- **Monitoring**: Winston logs (ready for aggregation)

---

## Development Commands

```bash
# Development
npm run dev              # Backend with hot reload
npm run dev:frontend     # Frontend with hot reload
npm run dev:all          # Both concurrently

# Building
npm run build            # Compile TypeScript
npm run build:frontend   # Build frontend assets
npm run build:all        # Build everything

# Database
npm run db:generate      # Generate migrations from schema
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed knowledge base
npm run db:setup         # Push + Seed (first-time setup)

# Code Quality
npm run lint             # ESLint check
npm run type-check       # TypeScript check (no emit)
```

---

## Project Structure

```
.
├── src/
│   ├── app.ts                    # Application bootstrap
│   ├── server.ts                 # HTTP server entry point
│   ├── modules/                  # Feature modules
│   │   ├── api/                 # HTTP layer
│   │   ├── chat/                # Chat orchestration
│   │   ├── conversation/        # Message persistence
│   │   ├── knowledge/           # Knowledge base
│   │   ├── llm/                 # LLM abstraction
│   │   ├── channels/            # Multi-channel (WEB, Telegram, WhatsApp)
│   │   ├── tools/               # AI function calling tools
│   │   └── messaging/           # Event bus
│   ├── shared/                   # Shared utilities
│   │   ├── config/              # Configuration
│   │   ├── database/            # Database client
│   │   ├── errors/              # Error classes
│   │   ├── logger/              # Logging
│   │   ├── redis/               # Redis client
│   │   └── types/               # TypeScript types
│   └── scripts/                  # Utility scripts
├── frontend/                     # Svelte frontend
│   ├── src/
│   │   ├── App.svelte           # Main app component
│   │   ├── components/          # UI components
│   │   └── config.js            # Frontend config
│   └── vite.config.js           # Vite configuration
├── migrations/                   # SQL migrations
├── drizzle.config.ts            # Drizzle ORM config
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
└── .env.example                 # Example environment vars
```

---

## Deployment

### Render (Recommended)

1. **Create PostgreSQL database** (or use NeonDB)
2. **Create Web Service**
   - Build command: `npm run build:all`
   - Start command: `npm start`
3. **Environment variables**: Copy from `.env.example`
4. **Deploy**: Push to GitHub and connect

### Railway

```bash
railway init
railway add --database postgresql
railway up
```

### Docker (Coming Soon)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build:all
CMD ["npm", "start"]
```

---

## Contributing

This is a technical assessment project, but feedback is welcome!

### Future Contributions Could Include:
- Real channel implementations (Telegram, WhatsApp)
- Additional AI tools (Shopify, Stripe, etc.)
- Testing suite
- Internationalization (i18n)

---

## License

MIT License - Feel free to use for learning and reference.

---

## Acknowledgments

Built as a technical assessment demonstrating:
- Clean architecture principles
- Extensible design patterns
- Production-ready code quality
- Modern TypeScript best practices
- Thoughtful AI/LLM integration

---

**Made with ❤️ by Subham**
