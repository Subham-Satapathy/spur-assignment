import { KnowledgeRepository } from './knowledge.repository';
import { KnowledgeEntry } from '../../shared/types';
import logger from '../../shared/logger';
import { redisClient } from '../../shared/redis';
import { config } from '../../shared/config';

export class KnowledgeService {
  private cachedPrompt: string | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = config.cache.knowledgeTtlSeconds * 1000;
  private readonly REDIS_CACHE_KEY = 'knowledge:formatted_prompt';
  private readonly REDIS_TTL = config.cache.knowledgeRedisTtlSeconds;

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
   * Format knowledge for LLM prompt (cached in Redis, fallback to in-memory)
   */
  async formatForPrompt(): Promise<string> {
    // Try Redis first (persistent, shared across instances)
    try {
      const cached = await redisClient.get(this.REDIS_CACHE_KEY);
      if (cached) {
        logger.debug('Knowledge cache hit (Redis)');
        return cached;
      }
    } catch (error) {
      logger.warn('Redis cache read failed, using in-memory fallback', { error });
    }

    // Fallback: check in-memory cache
    const now = Date.now();
    if (this.cachedPrompt && now < this.cacheExpiry) {
      logger.debug('Knowledge cache hit (in-memory)');
      return this.cachedPrompt;
    }

    // Cache miss: generate from database
    logger.debug('Knowledge cache miss, fetching from DB');
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
    
    // Cache in both Redis and in-memory
    await redisClient.set(this.REDIS_CACHE_KEY, formatted, this.REDIS_TTL);
    this.cachedPrompt = formatted;
    this.cacheExpiry = Date.now() + this.CACHE_TTL;
    
    logger.info('Knowledge base cached', { 
      size: formatted.length, 
      entries: entries.length 
    });
    
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
    
    // Invalidate both caches
    await this.invalidateCache();
    
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
    
    // Invalidate both caches
    await this.invalidateCache();
  }

  /**
   * Delete knowledge entry
   */
  async deleteKnowledge(id: string): Promise<void> {
    await this.repository.delete(id);
    logger.info('Knowledge entry deleted', { id });
    
    // Invalidate both caches
    await this.invalidateCache();
  }

  /**
   * Invalidate all caches (Redis + in-memory)
   */
  private async invalidateCache(): Promise<void> {
    // Clear in-memory cache
    this.cachedPrompt = null;
    this.cacheExpiry = 0;
    
    // Clear Redis cache
    await redisClient.del(this.REDIS_CACHE_KEY);
    
    logger.debug('Knowledge cache invalidated');
  }
}
