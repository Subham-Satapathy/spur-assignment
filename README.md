# AI Chat Support Agent - Modular Monolith

A production-ready AI-powered customer support chat system built with TypeScript, Express, NeonDB (serverless PostgreSQL), and Drizzle ORM using a **Modular Monolith architecture**.

## 🏗️ Architecture Overview

The application is structured into **6 independent modules**:

```
src/
├── modules/
│   ├── api/            # HTTP routes, validation, error handling
│   ├── chat/           # Orchestration layer - coordinates operations
│   ├── conversation/   # Conversation & message persistence  
│   ├── llm/            # LLM provider abstraction (OpenAI/Claude)
│   ├── knowledge/      # FAQ/domain knowledge management
│   └── messaging/      # Event bus for cross-module communication
├── shared/
│   ├── config/         # Environment configuration
│   ├── database/       # NeonDB connection & Drizzle schema
│   ├── errors/         # Custom error classes
│   ├── logger/         # Winston structured logging
│   └── types/          # Shared TypeScript interfaces
├── scripts/            # Database seed & validation scripts
├── app.ts              # Application bootstrap & dependency injection
└── server.ts           # HTTP server entry point
```

### Key Technologies

- **Backend**: Node.js 18+, TypeScript (strict mode), Express 4.18
- **Database**: NeonDB (serverless PostgreSQL) with Drizzle ORM 0.45
- **LLM Providers**: OpenAI (GPT-4), Anthropic Claude  
- **Frontend**: Vanilla JavaScript chat UI
- **Validation**: Zod schemas
- **Logging**: Winston

### Architectural Patterns

- **Dependency Injection**: Constructor injection for testability
- **Repository Pattern**: Data access layer abstraction
- **Event-Driven**: Internal event bus for module decoupling
- **Provider Pattern**: Swappable LLM implementations

## 🚀 Features

- ✅ Real LLM Integration (OpenAI GPT-4 & Anthropic Claude)
- ✅ Serverless PostgreSQL (NeonDB) with Drizzle ORM
- ✅ Conversation persistence with full history
- ✅ Knowledge base for context-aware responses
- ✅ Clean chat UI (no framework overhead)
- ✅ Robust error handling & validation
- ✅ Health checks for database & LLM
- ✅ Structured logging
- ✅ Full TypeScript type safety

## 📋 Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or yarn
- **NeonDB account** (free tier available at [neon.tech](https://neon.tech))
- **OpenAI API key** ([platform.openai.com](https://platform.openai.com)) OR
- **Anthropic API key** ([console.anthropic.com](https://console.anthropic.com))

## 🛠️ Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up NeonDB Database

1. Create account at [neon.tech](https://neon.tech)
2. Create new project in NeonDB console
3. Copy connection string (format: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Server
NODE_ENV=development
PORT=3000

# Database (NeonDB)
DATABASE_URL=postgresql://your-user:your-password@ep-xxx.region.aws.neon.tech/your-db?sslmode=require

# LLM Provider
LLM_PROVIDER=openai

# OpenAI (if using OpenAI)
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-4

# Claude (if using Anthropic)
# CLAUDE_API_KEY=sk-ant-your-key-here
# CLAUDE_MODEL=claude-3-sonnet-20240229
```

### 4. Initialize Database Schema

Push the Drizzle schema to NeonDB:

```bash
npm run db:push
```

This creates the following tables:
- `conversations` - Chat session tracking
- `messages` - Message history
- `knowledge_entries` - FAQ/knowledge base

### 5. Seed Knowledge Base

Populate the database with sample FAQ data:

```bash
npm run db:seed
```

This adds FAQs for:
- Shipping policies
- Returns & refunds
- Payment methods
- Support hours

### 6. Build & Start

Build TypeScript:

```bash
npm run build
```

Start the development server:

```bash
npm run dev
```

Or run in production mode:

```bash
npm start
```

The server will start on `http://localhost:3000`

### 7. Access Chat UI

Open your browser to:

```
http://localhost:3000
```

You'll see the chat interface where you can:
- Ask questions about shipping, returns, payments, etc.
- Get AI-powered responses using your knowledge base
- View conversation history

## 📚 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload (tsx watch) |
| `npm start` | Start production server |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run db:generate` | Generate Drizzle migration files from schema |
| `npm run db:push` | Push schema directly to NeonDB (development) |
| `npm run db:migrate` | Apply migrations (production) |
| `npm run db:seed` | Seed knowledge base with FAQ data |

## 🔌 API Endpoints

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.45,
  "services": {
    "database": "connected",
    "llm": "connected"
  }
}
```

### Create Conversation

```http
POST /api/conversations
```

Response:
```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Send Message

```http
POST /api/conversations/:conversationId/messages
Content-Type: application/json

{
  "message": "What is your return policy?"
}
```

Response:
```json
{
  "messageId": "660e8400-e29b-41d4-a716-446655440000",
  "reply": "We accept returns within 30 days of delivery...",
  "processingTime": 1234
}
```

### Get Conversation History

```http
GET /api/conversations/:conversationId/messages
```

Response:
```json
{
  "messages": [
    {
      "id": "msg-1",
      "text": "What is your return policy?",
      "sender": "user",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "msg-2",
      "text": "We accept returns within 30 days...",
      "sender": "assistant",
      "createdAt": "2024-01-15T10:30:02.000Z"
    }
  ]
}
```

## 🗂️ Database Schema (Drizzle)

### conversations

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| status | varchar | 'active' or 'closed' |
| metadata | jsonb | Custom metadata |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

### messages

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| conversation_id | uuid | Foreign key to conversations |
| text | text | Message content |
| sender | varchar | 'user' or 'assistant' |
| metadata | jsonb | Custom metadata |
| created_at | timestamp | Creation time |

### knowledge_entries

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| category | varchar | FAQ category |
| title | varchar | Entry title |
| content | text | Entry content |
| priority | integer | Display priority |
| is_active | boolean | Active status |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

## 🧪 Testing

Test the API with curl:

```bash
# Health check
curl http://localhost:3000/health

# Create conversation
CONV_ID=$(curl -X POST http://localhost:3000/api/conversations | jq -r '.conversationId')

# Send message
curl -X POST http://localhost:3000/api/conversations/$CONV_ID/messages \
  -H "Content-Type: application/json" \
  -d '{"message":"What is your shipping policy?"}'

# Get history
curl http://localhost:3000/api/conversations/$CONV_ID/messages
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |
| `DATABASE_URL` | Yes | - | NeonDB connection string |
| `LLM_PROVIDER` | Yes | `openai` | LLM provider ('openai' or 'claude') |
| `OPENAI_API_KEY` | If using OpenAI | - | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4` | OpenAI model |
| `CLAUDE_API_KEY` | If using Claude | - | Anthropic API key |
| `CLAUDE_MODEL` | No | `claude-3-sonnet-20240229` | Claude model |
| `LOG_LEVEL` | No | `info` | Winston log level |

### Switching LLM Providers

To switch from OpenAI to Claude:

1. Update `.env`:
   ```env
   LLM_PROVIDER=claude
   CLAUDE_API_KEY=sk-ant-your-key-here
   CLAUDE_MODEL=claude-3-sonnet-20240229
   ```

2. Restart the server

The provider abstraction allows seamless switching without code changes.

## 📖 Module Documentation

### Chat Module (`src/modules/chat`)

Orchestration layer that coordinates:
- Conversation creation & management
- Message routing between user and LLM
- Knowledge base retrieval for context
- Event publishing for analytics

### LLM Module (`src/modules/llm`)

Provider abstraction supporting:
- **OpenAIProvider**: GPT-4, GPT-3.5 Turbo
- **AnthropicProvider**: Claude 3 Sonnet

Implements:
- System prompt building
- Conversation context formatting
- Error handling & retries
- Health checks

### Conversation Module (`src/modules/conversation`)

Manages:
- Conversation lifecycle (create, update, close)
- Message persistence
- Conversation history retrieval
- Repository pattern for data access

### Knowledge Module (`src/modules/knowledge`)

Features:
- FAQ storage & retrieval
- Category-based organization
- Priority-based sorting
- Active/inactive entry management

### Messaging Module (`src/modules/messaging`)

Event bus for:
- `MESSAGE_RECEIVED` - User message logged
- `MESSAGE_SENT` - AI response sent
- `LLM_REQUEST_FAILED` - LLM error occurred
- `CONVERSATION_CREATED` - New conversation started
- `CONVERSATION_CLOSED` - Conversation ended

### API Module (`src/modules/api`)

HTTP layer with:
- Express routes & middleware
- Zod validation
- Error handling
- CORS configuration

## 🚀 Deployment

### NeonDB Production

1. Create production database in NeonDB
2. Update `DATABASE_URL` in production environment
3. Run migrations:
   ```bash
   npm run db:migrate
   ```
4. Seed knowledge base:
   ```bash
   npm run db:seed
   ```

### Environment Setup

Set production environment variables:

```bash
export NODE_ENV=production
export PORT=3000
export DATABASE_URL=postgresql://...
export OPENAI_API_KEY=sk-...
```

### Start Production Server

```bash
npm run build
npm start
```

## 📝 License

MIT

## 🤝 Contributing

Pull requests welcome! Please ensure:
- TypeScript compiles without errors
- Follow existing code style
- Add tests for new features

## 📧 Support

For issues or questions, open a GitHub issue.

---

**Built with ❤️ using Modular Monolith Architecture**
