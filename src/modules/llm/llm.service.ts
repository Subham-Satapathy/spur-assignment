import { ConversationContext, LLMResponse, LLMProvider } from '../../shared/types';
import { ConfigurationError, LLMError } from '../../shared/errors';
import { ILLMProvider } from './llm.types';
import { OpenAIProvider } from './providers/openai.provider';
import logger from '../../shared/logger';

export class LLMService {
  private provider: ILLMProvider;

  constructor(
    providerType: LLMProvider,
    apiKey: string,
    model: string,
    maxTokens: number = 500,
    temperature: number = 0.7
  ) {
    if (!apiKey) {
      throw new ConfigurationError('LLM API key is required');
    }

    if (providerType !== 'openai') {
      throw new Error(`Unsupported LLM provider: ${providerType}. Only OpenAI is supported.`);
    }
    this.provider = new OpenAIProvider(apiKey, model, maxTokens, temperature);

    logger.info('LLM service initialized', { provider: providerType, model });
  }

  /**
   * Generate a reply from the LLM
   */
  async generateReply(context: ConversationContext): Promise<LLMResponse> {
    try {
      logger.debug('Generating LLM reply', {
        conversationId: context.conversationId,
        messageCount: context.messages.length,
      });

      const response = await this.provider.generateReply(context);

      logger.info('LLM reply generated successfully', {
        conversationId: context.conversationId,
        replyLength: response.reply.length,
        processingTime: response.metadata.processingTime,
      });

      return response;
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }

      logger.error('Unexpected error generating LLM reply', { error });
      throw new LLMError('An unexpected error occurred while generating a response');
    }
  }

  /**
   * Health check for LLM provider
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.provider.healthCheck();
    } catch (error) {
      logger.error('LLM health check failed', { error });
      return false;
    }
  }
}
