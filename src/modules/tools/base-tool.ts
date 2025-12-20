import { ITool, ToolDefinition } from './tool.types';
import logger from '../../shared/logger';

/**
 * Base tool implementation with common functionality
 */
export abstract class BaseTool implements ITool {
  abstract readonly name: string;
  abstract readonly description: string;

  abstract execute(params: any): Promise<any>;

  getDefinition(): ToolDefinition {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: this.getParameters(),
      },
    };
  }

  /**
   * Define tool parameters
   */
  protected abstract getParameters(): {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };

  /**
   * Validate required parameters
   */
  protected validateParams(params: any, required: string[]): void {
    const missing = required.filter((key) => !(key in params));
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
  }

  /**
   * Log tool execution
   */
  protected logExecution(params: any, _result: any, duration: number): void {
    logger.info('Tool executed', {
      tool: this.name,
      params,
      duration,
      success: true,
    });
  }

  /**
   * Log tool error
   */
  protected logError(params: any, error: any): void {
    logger.error('Tool execution failed', {
      tool: this.name,
      params,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
