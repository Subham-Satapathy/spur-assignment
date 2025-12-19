import OpenAI from 'openai';
import { ConversationContext, LLMResponse } from '../../../shared/types';
import { LLMError } from '../../../shared/errors';
import { ILLMProvider, buildSystemPrompt, buildConversationMessages } from '../llm.types';
import logger from '../../../shared/logger';

export class OpenAIProvider implements ILLMProvider {
  private client: OpenAI;

  constructor(
    apiKey: string,
    private model: string = 'gpt-4',
    private maxTokens: number = 500,
    private temperature: number = 0.7
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async generateReply(context: ConversationContext): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const systemPrompt = buildSystemPrompt(context.knowledgeBase);
      const messages = buildConversationMessages(context);

      logger.debug('Calling OpenAI API', {
        model: this.model,
        messageCount: messages.length,
      });

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const reply = completion.choices[0]?.message?.content;

      if (!reply) {
        throw new Error('No response from OpenAI');
      }

      const processingTime = Date.now() - startTime;

      logger.info('OpenAI response received', {
        model: this.model,
        tokens: completion.usage?.total_tokens,
        processingTime,
      });

      return {
        reply: reply.trim(),
        metadata: {
          model: this.model,
          tokens: completion.usage?.total_tokens,
          processingTime,
        },
      };
    } catch (error: any) {
      logger.error('OpenAI API error', {
        error: error.message,
        code: error.code,
        type: error.type,
      });

      if (error.code === 'insufficient_quota') {
        throw new LLMError('OpenAI API quota exceeded. Please check your billing.');
      }

      if (error.code === 'invalid_api_key') {
        throw new LLMError('Invalid OpenAI API key. Please check your configuration.');
      }

      if (error.status === 429) {
        throw new LLMError('OpenAI rate limit exceeded. Please try again later.');
      }

      if (error.code === 'context_length_exceeded') {
        throw new LLMError('Conversation is too long. Please start a new conversation.');
      }

      throw new LLMError(
        `Failed to generate response: ${error.message}`,
        { originalError: error.code || error.type }
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple test with minimal token usage
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      });

      return !!completion.choices[0]?.message?.content;
    } catch (error) {
      logger.error('OpenAI health check failed', { error });
      return false;
    }
  }
}
