import { ConversationContext, LLMResponse, ToolDefinition } from '../../shared/types';

/**
 * Interface for LLM providers
 */
export interface ILLMProvider {
  /**
   * Generate a reply based on conversation context
   */
  generateReply(context: ConversationContext, tools?: ToolDefinition[]): Promise<LLMResponse>;

  /**
   * Health check to verify provider is configured correctly
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Build system prompt for the AI agent
 */
export function buildSystemPrompt(knowledgeBase: string): string {
  return `You are a helpful and friendly customer support agent for an e-commerce store. Your goal is to assist customers with their questions clearly, concisely, and professionally.

Guidelines:
- Be polite, empathetic, and helpful
- Provide accurate information based on the knowledge base below
- If you don't know something, admit it and offer to help in other ways
- Keep responses concise but complete
- Use a warm, conversational tone

${knowledgeBase}

Answer the customer's questions based on this information. If asked about something not covered in the knowledge base, politely explain that you don't have that specific information but offer to help with related questions.`;
}

/**
 * Build conversation messages for LLM context
 */
export function buildConversationMessages(
  context: ConversationContext
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return context.messages.map((msg) => ({
    role: (msg.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: msg.text,
  }));
}
