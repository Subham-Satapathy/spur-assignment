import { ITool, ToolDefinition } from './tool.types';
import logger from '../../shared/logger';

/**
 * Tool registry - manages all available tools
 */
export class ToolRegistry {
  private tools: Map<string, ITool> = new Map();

  /**
   * Register a tool
   */
  register(tool: ITool): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`Tool ${tool.name} is already registered. Overwriting.`);
    }

    this.tools.set(tool.name, tool);
    logger.info(`Tool registered: ${tool.name}`);
  }

  /**
   * Register multiple tools
   */
  registerMany(tools: ITool[]): void {
    tools.forEach((tool) => this.register(tool));
  }

  /**
   * Get a tool by name
   */
  get(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get all registered tools
   */
  getAll(): ITool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get all tool definitions for LLM
   */
  getAllDefinitions(): ToolDefinition[] {
    return this.getAll().map((tool) => tool.getDefinition());
  }

  /**
   * Execute a tool by name
   */
  async execute(name: string, params: any): Promise<any> {
    const tool = this.get(name);

    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    logger.debug(`Executing tool: ${name}`, { params });

    try {
      const result = await tool.execute(params);
      logger.info(`Tool execution successful: ${name}`);
      return result;
    } catch (error) {
      logger.error(`Tool execution failed: ${name}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Clear all registered tools
   */
  clear(): void {
    this.tools.clear();
    logger.info('All tools cleared from registry');
  }

  /**
   * Get tool count
   */
  get count(): number {
    return this.tools.size;
  }
}

// Global tool registry instance
export const toolRegistry = new ToolRegistry();
