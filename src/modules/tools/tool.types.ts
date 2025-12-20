/**
 * Tool interface - implement this for each tool/function
 */
export interface ITool {
  /**
   * Unique tool name
   */
  readonly name: string;

  /**
   * Human-readable description for the LLM
   */
  readonly description: string;

  /**
   * Execute the tool with given parameters
   */
  execute(params: any): Promise<any>;

  /**
   * Get the tool definition for LLM function calling
   */
  getDefinition(): ToolDefinition;
}

/**
 * Tool definition in OpenAI function calling format
 */
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
}
