import { ILLMProvider } from './llm.types';
import { OpenAIProvider } from './providers/openai.provider';
import { LLMProvider } from '../../shared/types';
import { ConfigurationError } from '../../shared/errors';
import logger from '../../shared/logger';

/**
 * Configuration for LLM providers
 */
export interface LLMProviderConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Factory for creating LLM provider instances
 */
export class LLMProviderFactory {
  /**
   * Create an LLM provider instance based on configuration
   */
  static create(config: LLMProviderConfig): ILLMProvider {
    if (!config.apiKey) {
      throw new ConfigurationError(`API key is required for ${config.provider} provider`);
    }

    const maxTokens = config.maxTokens || 500;
    const temperature = config.temperature ?? 0.7;

    logger.info('Creating LLM provider', {
      provider: config.provider,
      model: config.model,
    });

    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config.apiKey, config.model, maxTokens, temperature);

      case 'anthropic':
        // Future implementation:
        // return new AnthropicProvider(config.apiKey, config.model, maxTokens, temperature);
        throw new Error('Anthropic provider not yet implemented. Coming soon!');

      default:
        throw new Error(`Unknown LLM provider: ${config.provider}`);
    }
  }

  /**
   * Create provider from environment variables
   */
  static createFromEnv(): ILLMProvider {
    const provider = (process.env.LLM_PROVIDER || 'openai') as LLMProvider;
    const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '';
    const model = process.env.LLM_MODEL || 'gpt-3.5-turbo';
    const maxTokens = parseInt(process.env.LLM_MAX_TOKENS || '500', 10);
    const temperature = parseFloat(process.env.LLM_TEMPERATURE || '0.7');

    return this.create({
      provider,
      apiKey,
      model,
      maxTokens,
      temperature,
    });
  }
}
