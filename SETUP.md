# Setup Guide - AI Chat Support Agent

This guide will walk you through setting up and running the AI Chat Support Agent.

## Step 1: Get Your NeonDB Connection String

1. Go to [neon.tech](https://neon.tech) and create a free account

2. Click **"Create a Project"**

3. Choose a name for your project (e.g., "spur-chat-db")

4. Select a region closest to you

5. Once created, click **"Connection Details"** or **"Connection string"**

6. Copy the connection string - it looks like:
   ```
   postgresql://username:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
   ```

7. Keep this string handy for the next step

## Step 2: Get Your OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com/api-keys)

2. Sign in or create an account

3. Click **"Create new secret key"**

4. Give it a name (e.g., "Spur Chat Agent")

5. Copy the key - it starts with `sk-`
   ⚠️ **Important**: You can only see this key once, so save it now!

6. Add credits to your account if needed (check [platform.openai.com/account/billing](https://platform.openai.com/account/billing))

**Alternative: Use Claude (Anthropic)**

If you prefer Claude instead of OpenAI:

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account and get API key
3. Use `LLM_PROVIDER=claude` in your `.env` file

## Step 3: Update Your .env File

Open the `.env` file in the project root and update these values:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration (NeonDB)
# Paste your NeonDB connection string here:
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@ep-xxxxx.region.aws.neon.tech/YOUR_DB?sslmode=require

# LLM Provider Configuration
LLM_PROVIDER=openai

# OpenAI Configuration
# Paste your OpenAI API key here:
OPENAI_API_KEY=sk-YOUR_ACTUAL_KEY_HERE
OPENAI_MODEL=gpt-4

# Logging
LOG_LEVEL=info
```

### Example (with fake values):

```env
DATABASE_URL=postgresql://john_doe:abc123password@ep-cool-mountain-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
OPENAI_API_KEY=sk-proj-abcdef1234567890XYZ
```

## Step 4: Install Dependencies

Run in your terminal:

```bash
npm install
```

This will install all required packages (Express, Drizzle ORM, OpenAI SDK, etc.)

## Step 5: Initialize Database

Push your database schema to NeonDB:

```bash
npm run db:push
```

You should see output like:
```
✓ Pushing schema to NeonDB...
✓ Schema pushed successfully
```

This creates 3 tables:
- `conversations` - Stores chat sessions
- `messages` - Stores all messages
- `knowledge_entries` - Stores FAQ data

## Step 6: Seed Knowledge Base

Populate your database with sample FAQ data:

```bash
npm run db:seed
```

You should see:
```
info: Seeding 13 knowledge entries...
info: Knowledge base seeding completed
```

This adds FAQs about:
- Shipping policies (regions, costs, tracking)
- Return policies (window, process, refunds)
- Payment methods
- Customer support hours

## Step 7: Build the Project

Compile TypeScript to JavaScript:

```bash
npm run build
```

You should see:
```
> tsc
(No errors)
```

## Step 8: Start the Server

Start the development server:

```bash
npm run dev
```

You should see:
```
info: Starting AI Chat Support server...
info: Database connection validated successfully
info: Application bootstrap completed
info: Server listening on port 3000
info: 🚀 Server ready at http://localhost:3000
```

## Step 9: Test the Chat UI

1. Open your browser to: **http://localhost:3000**

2. You should see a clean chat interface

3. Try asking questions like:
   - "What is your shipping policy?"
   - "How do I return an item?"
   - "What payment methods do you accept?"
   - "When is customer support available?"

4. The AI will respond using your knowledge base!

## Troubleshooting

### Error: "Cannot connect to database"

- Check your `DATABASE_URL` is correct
- Make sure you copied the full connection string from NeonDB
- Verify your NeonDB project is active (not paused)

### Error: "OpenAI API key invalid"

- Check your `OPENAI_API_KEY` is correct
- Make sure you copied the full key (starts with `sk-`)
- Verify you have credits in your OpenAI account

### Error: "Port 3000 already in use"

- Change `PORT=3001` in your `.env` file
- Or kill the process using port 3000:
  ```bash
  lsof -ti:3000 | xargs kill
  ```

### Build Errors

- Delete `node_modules` and reinstall:
  ```bash
  rm -rf node_modules
  npm install
  ```

### Database Schema Issues

- Drop and recreate tables:
  ```bash
  # In NeonDB console SQL editor:
  DROP TABLE IF EXISTS messages CASCADE;
  DROP TABLE IF EXISTS conversations CASCADE;
  DROP TABLE IF EXISTS knowledge_entries CASCADE;
  
  # Then re-run:
  npm run db:push
  npm run db:seed
  ```

## Next Steps

### Test the API

Use curl or Postman:

```bash
# Health check
curl http://localhost:3000/health

# Create conversation
curl -X POST http://localhost:3000/api/conversations

# Send message
curl -X POST http://localhost:3000/api/conversations/YOUR_CONV_ID/messages \
  -H "Content-Type: application/json" \
  -d '{"message":"What is your return policy?"}'
```

### Customize Knowledge Base

Edit the FAQ data in:
```
src/scripts/seed.ts
```

Then re-run:
```bash
npm run db:seed
```

### Switch to Claude

Update `.env`:
```env
LLM_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-your-key
CLAUDE_MODEL=claude-3-sonnet-20240229
```

Restart the server.

### View Logs

Logs are written to:
- `logs/error.log` - Error messages
- `logs/combined.log` - All messages
- Console - Real-time output

### Production Deployment

See README.md for production deployment instructions.

## Support

If you encounter issues:

1. Check the logs in `logs/` directory
2. Verify all environment variables are set correctly
3. Ensure NeonDB project is active
4. Confirm OpenAI API key has credits

---

**You're all set! Start chatting with your AI support agent! 🎉**
