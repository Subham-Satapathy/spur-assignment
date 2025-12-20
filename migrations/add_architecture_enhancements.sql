-- Migration: Add channel support, user tracking, and tool executions
-- Run this after the architecture enhancements

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add user_id to conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add channel tracking to messages
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS channel_type VARCHAR(20) NOT NULL DEFAULT 'WEB',
ADD COLUMN IF NOT EXISTS channel_user_id VARCHAR(255);

-- Create tool_executions table
CREATE TABLE IF NOT EXISTS tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  tool_name VARCHAR(100) NOT NULL,
  input JSONB NOT NULL,
  output JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  executed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_type ON messages(channel_type);
CREATE INDEX IF NOT EXISTS idx_messages_channel_user_id ON messages(channel_user_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_message_id ON tool_executions(message_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_tool_name ON tool_executions(tool_name);

-- Add comments
COMMENT ON TABLE users IS 'User profiles for cross-channel identity management';
COMMENT ON TABLE tool_executions IS 'Tracks LLM tool/function calling executions';
COMMENT ON COLUMN messages.channel_type IS 'Message channel: WEB, TELEGRAM, WHATSAPP, INSTAGRAM, FACEBOOK';
COMMENT ON COLUMN messages.channel_user_id IS 'Channel-specific user identifier (telegram chat_id, whatsapp phone, etc)';
