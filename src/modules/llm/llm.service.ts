import { ConversationContext, LLMResponse, LLMProvider, ToolDefinition } from '../../shared/types';
import { ConfigurationError, LLMError } from '../../shared/errors';
import { ILLMProvider } from './llm.types';
import { OpenAIProvider } from './providers/openai.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import logger from '../../shared/logger';

export class LLMService {
  private provider: ILLMProvider;

  constructor(
    providerType: LLMProvider,
    apiKey: string,
    model: string,
    maxTokens: number,
    temperature: number
  ) {
    if (!apiKey) {
      throw new ConfigurationError('LLM API key is required');
    }

    // Create provider based on type
    switch (providerType) {
      case 'openai':
        this.provider = new OpenAIProvider(apiKey, model, maxTokens, temperature);
        break;
      case 'openrouter':
        this.provider = new OpenRouterProvider(apiKey, model, maxTokens, temperature);
        break;
      case 'anthropic':
        throw new Error('Anthropic provider not yet implemented');
      default:
        throw new Error(`Unsupported LLM provider: ${providerType}`);
    }

    logger.info('LLM service initialized', { provider: providerType, model });
  }

  /**
   * Generate a reply from the LLM
   */
  async generateReply(
    context: ConversationContext,
    tools?: ToolDefinition[]
  ): Promise<LLMResponse> {
    try {
      logger.debug('Generating LLM reply', {
        conversationId: context.conversationId,
        messageCount: context.messages.length,
        toolsCount: tools?.length || 0,
      });

      const response = await this.provider.generateReply(context, tools);

      logger.info('LLM reply generated successfully', {
        conversationId: context.conversationId,
        replyLength: response.reply.length,
        hasToolCalls: !!response.toolCalls,
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
