import { GoogleGenAI } from '@google/genai';
import { ConversationContext, LLMResponse, ToolDefinition } from '../../../shared/types';
import { LLMError } from '../../../shared/errors';
import { ILLMProvider, buildSystemPrompt, buildConversationMessages } from '../llm.types';
import logger from '../../../shared/logger';

export class GeminiProvider implements ILLMProvider {
  private client: GoogleGenAI;

  constructor(
    apiKey: string,
    private model: string,
    private maxTokens: number,
    private temperature: number
  ) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateReply(context: ConversationContext, tools?: ToolDefinition[]): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const systemPrompt = buildSystemPrompt(context.knowledgeBase);
      const messages = buildConversationMessages(context);

      logger.debug('Calling Gemini API', {
        model: this.model,
        messageCount: messages.length,
        toolsCount: tools?.length || 0,
      });

      // Build the full prompt with system instructions and conversation
      const conversationHistory = messages.map(msg => 
        `${msg.role === 'assistant' ? 'Assistant' : 'User'}: ${msg.content}`
      ).join('\n\n');

      const fullPrompt = `${systemPrompt}\n\n${conversationHistory}\n\nAssistant:`;

      // Generate content using the new API
      const result = await this.client.models.generateContent({
        model: this.model,
        contents: fullPrompt,
        config: {
          maxOutputTokens: this.maxTokens,
          temperature: this.temperature,
        },
      });

      const reply = result.text ?? '';

      const processingTime = Date.now() - startTime;

      logger.info('Gemini response received', {
        model: this.model,
        processingTime,
      });

      return {
        reply: reply.trim(),
        metadata: {
          model: this.model,
          processingTime,
        },
      };
    } catch (error: any) {
      logger.error('Gemini API error', {
        error: error.message,
        code: error.code,
        status: error.status,
      });

      if (error.message?.includes('quota')) {
        throw new LLMError('AI service quota exceeded. Please contact support or try again later.');
      }

      if (error.message?.includes('API key')) {
        throw new LLMError('AI service configuration error. Please contact support.');
      }

      if (error.status === 429 || error.message?.includes('rate limit')) {
        throw new LLMError('AI service is temporarily busy. Please try again in a moment.');
      }

      if (error.status === 503 || error.message?.includes('unavailable')) {
        throw new LLMError('AI service is temporarily unavailable. Please try again later.');
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
      return !!this.client;
    } catch (error) {
      logger.error('Gemini health check failed', { error });
      return false;
    }
  }
}
