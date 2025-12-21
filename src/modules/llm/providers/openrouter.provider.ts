import OpenAI from 'openai';
import { ConversationContext, LLMResponse, ToolDefinition, ToolCall } from '../../../shared/types';
import { LLMError } from '../../../shared/errors';
import { ILLMProvider, buildSystemPrompt, buildConversationMessages } from '../llm.types';
import logger from '../../../shared/logger';

export class OpenRouterProvider implements ILLMProvider {
  private client: OpenAI;

  constructor(
    apiKey: string,
    private model: string,
    private maxTokens: number,
    private temperature: number
  ) {
    // OpenRouter uses OpenAI-compatible API
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://localhost',
        'X-Title': process.env.OPENROUTER_TITLE || 'Customer Support Agent',
      },
    });
  }

  async generateReply(context: ConversationContext, tools?: ToolDefinition[]): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const systemPrompt = buildSystemPrompt(context.knowledgeBase);
      const messages = buildConversationMessages(context);

      logger.debug('Calling OpenRouter API', {
        model: this.model,
        messageCount: messages.length,
        toolsCount: tools?.length || 0,
      });

      const completionParams: OpenAI.Chat.ChatCompletionCreateParams = {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      };

      // Add tools if provided
      if (tools && tools.length > 0) {
        completionParams.tools = tools as any;
        completionParams.tool_choice = 'auto';
      }

      const completion = await this.client.chat.completions.create(completionParams);

      const message = completion.choices[0]?.message;

      if (!message) {
        throw new Error('No response from OpenRouter');
      }

      const processingTime = Date.now() - startTime;

      // Extract tool calls if present
      const toolCalls: ToolCall[] | undefined = message.tool_calls?.map((tc) => ({
        id: tc.id,
        type: tc.type,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      }));

      const reply = message.content || '';

      logger.info('OpenRouter response received', {
        model: this.model,
        tokens: completion.usage?.total_tokens,
        processingTime,
        hasToolCalls: !!toolCalls,
      });

      return {
        reply: reply.trim(),
        toolCalls,
        metadata: {
          model: this.model,
          tokens: completion.usage?.total_tokens,
          processingTime,
        },
      };
    } catch (error: any) {
      logger.error('OpenRouter API error', {
        error: error.message,
        code: error.code,
        type: error.type,
        status: error.status,
      });

      if (error.code === 'insufficient_quota') {
        throw new LLMError('AI service quota exceeded. Please contact support or try again later.');
      }

      if (error.code === 'invalid_api_key') {
        throw new LLMError('AI service configuration error. Please contact support.');
      }

      if (error.status === 429 || error.code === 'rate_limit_exceeded') {
        throw new LLMError('AI service is temporarily busy. Please try again in a moment.');
      }

      if (error.code === 'context_length_exceeded') {
        throw new LLMError('Conversation is too long. Please start a new conversation.');
      }

      if (error.code === 'model_not_found') {
        throw new LLMError('AI model unavailable. Please contact support.');
      }

      if (error.status === 503 || error.code === 'service_unavailable') {
        throw new LLMError('AI service is temporarily unavailable. Please try again later.');
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new LLMError('Cannot connect to AI service. Please try again later.');
      }

      if (error.message && error.message.toLowerCase().includes('timeout')) {
        throw new LLMError('AI service request timed out. Please try again.');
      }

      // Generic fallback for unknown errors
      throw new LLMError(
        'Unable to generate response at this time. Please try again.',
        { originalError: error.code || error.type || 'UNKNOWN' }
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Lightweight check - just verify the client is configured
      // Avoid actual API calls to prevent rate limiting in health checks
      return !!this.client;
    } catch (error) {
      logger.error('OpenRouter health check failed', { error });
      return false;
    }
  }
}
