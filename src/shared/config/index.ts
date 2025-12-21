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
    provider: 'openai' | 'openrouter';
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
    enableTools: boolean;
  };
  channels?: {
    telegram?: {
      enabled: boolean;
      apiKey?: string;
      webhookSecret?: string;
      webhookUrl?: string;
    };
    whatsapp?: {
      enabled: boolean;
      apiKey?: string;
      apiSecret?: string;
      webhookSecret?: string;
    };
  };
  rateLimit: {
    chat: {
      max: number;
      windowHours: number;
    };
    conversation: {
      max: number;
      windowHours: number;
    };
    global: {
      max: number;
      windowMinutes: number;
    };
  };
  cache: {
    cleanupIntervalMinutes: number;
    knowledgeTtlSeconds: number;
    knowledgeRedisTtlSeconds: number;
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
    provider: (process.env.LLM_PROVIDER || 'openai') as 'openai' | 'openrouter',
    apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '',
    model: process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'gpt-4',
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
    enableTools: process.env.ENABLE_TOOLS === 'true', // Default disabled; can be enabled via feature flags later
  },
  channels: {
    telegram: {
      enabled: process.env.TELEGRAM_ENABLED === 'true',
      apiKey: process.env.TELEGRAM_BOT_TOKEN,
      webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
    },
    whatsapp: {
      enabled: process.env.WHATSAPP_ENABLED === 'true',
      apiKey: process.env.WHATSAPP_ACCESS_TOKEN,
      apiSecret: process.env.WHATSAPP_PHONE_NUMBER_ID,
      webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET,
    },
  },
  rateLimit: {
    chat: {
      max: parseInt(process.env.RATE_LIMIT_CHAT_MAX || '20', 10),
      windowHours: parseInt(process.env.RATE_LIMIT_CHAT_WINDOW_HOURS || '1', 10),
    },
    conversation: {
      max: parseInt(process.env.RATE_LIMIT_CONVERSATION_MAX || '5', 10),
      windowHours: parseInt(process.env.RATE_LIMIT_CONVERSATION_WINDOW_HOURS || '1', 10),
    },
    global: {
      max: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX || '100', 10),
      windowMinutes: parseInt(process.env.RATE_LIMIT_GLOBAL_WINDOW_MINUTES || '15', 10),
    },
  },
  cache: {
    cleanupIntervalMinutes: parseInt(process.env.CACHE_CLEANUP_INTERVAL_MINUTES || '5', 10),
    knowledgeTtlSeconds: parseInt(process.env.KNOWLEDGE_CACHE_TTL_SECONDS || '60', 10),
    knowledgeRedisTtlSeconds: parseInt(process.env.KNOWLEDGE_REDIS_TTL_SECONDS || '600', 10),
  },
};

export function validateConfig(options: { skipLLM?: boolean } = {}): void {
  const errors: string[] = [];

  if (!options.skipLLM && !config.llm.apiKey) {
    errors.push('LLM API key is required (set LLM_API_KEY or OPENAI_API_KEY)');
  }

  if (config.llm.provider !== 'openai' && config.llm.provider !== 'openrouter') {
    errors.push('LLM_PROVIDER must be "openai" or "openrouter"');
  }

  if (!config.database.url) {
    errors.push('DATABASE_URL is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}
