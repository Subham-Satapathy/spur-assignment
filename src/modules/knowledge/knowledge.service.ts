import { KnowledgeRepository } from './knowledge.repository';
import { KnowledgeEntry } from '../../shared/types';
import logger from '../../shared/logger';

export class KnowledgeService {
  private cachedPrompt: string | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 60000; // 60 seconds

  constructor(private repository: KnowledgeRepository) {}

  /**
   * Get all active knowledge entries
   */
  async getKnowledge(category?: string): Promise<KnowledgeEntry[]> {
    if (category) {
      return this.repository.getByCategory(category);
    }
    return this.repository.getActive();
  }

  /**
   * Format knowledge for LLM prompt (cached)
   */
  async formatForPrompt(): Promise<string> {
    // Return cached version if still valid
    const now = Date.now();
    if (this.cachedPrompt && now < this.cacheExpiry) {
      return this.cachedPrompt;
    }

    const entries = await this.repository.getActive();

    if (entries.length === 0) {
      return 'No specific knowledge base available.';
    }

    // Group by category
    const grouped = entries.reduce((acc, entry) => {
      if (!acc[entry.category]) {
        acc[entry.category] = [];
      }
      acc[entry.category].push(entry);
      return acc;
    }, {} as Record<string, KnowledgeEntry[]>);

    // Format as readable text
    const sections = Object.entries(grouped).map(([category, items]) => {
      const categoryTitle = category
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const itemsText = items
        .map((item) => `**${item.title}**\n${item.content}`)
        .join('\n\n');

      return `## ${categoryTitle}\n\n${itemsText}`;
    });

    const formatted = sections.join('\n\n');
    
    // Cache the result
    this.cachedPrompt = formatted;
    this.cacheExpiry = Date.now() + this.CACHE_TTL;
    
    return formatted;
  }

  /**
   * Add new knowledge entry
   */
  async addKnowledge(
    category: string,
    title: string,
    content: string,
    priority: number = 0
  ): Promise<KnowledgeEntry> {
    logger.debug('Adding knowledge entry', { category, title });
    const entry = await this.repository.create(category, title, content, priority);
    logger.info('Knowledge entry added', { id: entry.id, category, title });
    
    // Invalidate cache
    this.cachedPrompt = null;
    
    return entry;
  }

  /**
   * Update knowledge entry
   */
  async updateKnowledge(
    id: string,
    updates: Partial<Pick<KnowledgeEntry, 'title' | 'content' | 'priority' | 'isActive'>>
  ): Promise<void> {
    await this.repository.update(id, updates);
    logger.info('Knowledge entry updated', { id });
    
    // Invalidate cache
    this.cachedPrompt = null;
  }

  /**
   * Delete knowledge entry
   */
  async deleteKnowledge(id: string): Promise<void> {
    await this.repository.delete(id);
    logger.info('Knowledge entry deleted', { id });
  }
}
