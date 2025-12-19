import { eq, desc, and } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { knowledgeEntries } from '../../shared/database/schema';
import { KnowledgeEntry } from '../../shared/types';
import { DatabaseError } from '../../shared/errors';
import logger from '../../shared/logger';

export class KnowledgeRepository {
  constructor(private db: NeonHttpDatabase<any>) {}

  /**
   * Create a new knowledge entry
   */
  async create(
    category: string,
    title: string,
    content: string,
    priority: number = 0
  ): Promise<KnowledgeEntry> {
    try {
      const [entry] = await this.db
        .insert(knowledgeEntries)
        .values({
          category,
          title,
          content,
          priority,
        })
        .returning();

      return this.mapRow(entry);
    } catch (error) {
      logger.error('Failed to create knowledge entry', { error });
      throw new DatabaseError('Failed to create knowledge entry', error);
    }
  }

  /**
   * Get all active knowledge entries
   */
  async getActive(): Promise<KnowledgeEntry[]> {
    try {
      const result = await this.db
        .select()
        .from(knowledgeEntries)
        .where(eq(knowledgeEntries.isActive, true))
        .orderBy(desc(knowledgeEntries.priority), knowledgeEntries.category, knowledgeEntries.title);

      return result.map(this.mapRow);
    } catch (error) {
      logger.error('Failed to get active knowledge entries', { error });
      throw new DatabaseError('Failed to get active knowledge entries', error);
    }
  }

  /**
   * Get knowledge entries by category
   */
  async getByCategory(category: string): Promise<KnowledgeEntry[]> {
    try {
      const result = await this.db
        .select()
        .from(knowledgeEntries)
        .where(
          and(
            eq(knowledgeEntries.category, category),
            eq(knowledgeEntries.isActive, true)
          )
        )
        .orderBy(desc(knowledgeEntries.priority), knowledgeEntries.title);

      return result.map(this.mapRow);
    } catch (error) {
      logger.error('Failed to get knowledge entries by category', { error, category });
      throw new DatabaseError('Failed to get knowledge entries by category', error);
    }
  }

  /**
   * Update knowledge entry
   */
  async update(
    id: string,
    updates: Partial<Pick<KnowledgeEntry, 'title' | 'content' | 'priority' | 'isActive'>>
  ): Promise<void> {
    try {
      const updateData: any = {};

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

      if (Object.keys(updateData).length === 0) return;

      updateData.updatedAt = new Date();

      await this.db
        .update(knowledgeEntries)
        .set(updateData)
        .where(eq(knowledgeEntries.id, id));
    } catch (error) {
      logger.error('Failed to update knowledge entry', { error, id });
      throw new DatabaseError('Failed to update knowledge entry', error);
    }
  }

  /**
   * Delete knowledge entry
   */
  async delete(id: string): Promise<void> {
    try {
      await this.db
        .delete(knowledgeEntries)
        .where(eq(knowledgeEntries.id, id));
    } catch (error) {
      logger.error('Failed to delete knowledge entry', { error, id });
      throw new DatabaseError('Failed to delete knowledge entry', error);
    }
  }

  /**
   * Map database row to KnowledgeEntry object
   */
  private mapRow(row: any): KnowledgeEntry {
    return {
      id: row.id,
      category: row.category,
      title: row.title,
      content: row.content,
      priority: row.priority,
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
