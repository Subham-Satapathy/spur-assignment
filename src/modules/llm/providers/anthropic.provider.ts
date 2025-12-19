import Anthropic from '@anthropic-ai/sdk';
import { ConversationContext, LLMResponse } from '../../../shared/types';
import { LLMError } from '../../../shared/errors';
import { ILLMProvider, buildSystemPrompt, buildConversationMessages } from '../llm.types';
import logger from '../../../shared/logger';

export class AnthropicProvider implements ILLMProvider {
  private client: Anthropic;

  constructor(
    apiKey: string,
    private model: string = 'claude-3-sonnet-20240229',
    private maxTokens: number = 500,
    private temperature: number = 0.7
  ) {
    this.client = new Anthropic({ apiKey });
  }

  async generateReply(context: ConversationContext): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const systemPrompt = buildSystemPrompt(context.knowledgeBase);
      const messages = buildConversationMessages(context);

      logger.debug('Calling Anthropic API', {
        model: this.model,
        messageCount: messages.length,
      });

      const response = await (this.client as any).messages.create({
        model: this.model,
        system: systemPrompt,
        messages: messages as any,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const reply = response.content[0]?.type === 'text' 
        ? response.content[0].text 
        : '';

      if (!reply) {
        throw new Error('No response from Anthropic');
      }

      const processingTime = Date.now() - startTime;

      logger.info('Anthropic response received', {
        model: this.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        processingTime,
      });

      return {
        reply: reply.trim(),
        metadata: {
          model: this.model,
          tokens: response.usage.input_tokens + response.usage.output_tokens,
          processingTime,
        },
      };
    } catch (error: any) {
      logger.error('Anthropic API error', {
        error: error.message,
        status: error.status,
      });

      if (error.status === 401) {
        throw new LLMError('Invalid Anthropic API key. Please check your configuration.');
      }

      if (error.status === 429) {
        throw new LLMError('Anthropic rate limit exceeded. Please try again later.');
      }

      if (error.error?.type === 'invalid_request_error') {
        throw new LLMError(`Invalid request: ${error.message}`);
      }

      throw new LLMError(
        `Failed to generate response: ${error.message}`,
        { originalError: error.status }
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await (this.client as any).messages.create({
        model: this.model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      });

      return response.content.length > 0;
    } catch (error) {
      logger.error('Anthropic health check failed', { error });
      return false;
    }
  }
}
