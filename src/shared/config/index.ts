import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  server: {
    port: number;
    env: string;
  };
  database: {
    url: string;
  };
  llm: {
    provider: 'openai';
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  redis: {
    enabled: boolean;
    url?: string;
  };
  app: {
    maxMessageLength: number;
    maxConversationHistory: number;
  };
}

export const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  llm: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '500', 10),
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
  },
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    url: process.env.REDIS_URL,
  },
  app: {
    maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH || '2000', 10),
    maxConversationHistory: parseInt(process.env.MAX_CONVERSATION_HISTORY || '10', 10),
  },
};

export function validateConfig(options: { skipLLM?: boolean } = {}): void {
  const errors: string[] = [];

  if (!options.skipLLM && !config.llm.apiKey) {
    errors.push('OpenAI API key is required (set OPENAI_API_KEY)');
  }

  if (config.llm.provider !== 'openai') {
    errors.push('LLM_PROVIDER must be "openai"');
  }

  if (!config.database.url) {
    errors.push('DATABASE_URL is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}
