import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { config } from '../config';
import logger from '../logger';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;

/**
 * Create and configure Drizzle database instance
 */
export function createDatabase() {
  if (db) {
    return db;
  }

  if (!config.database.url) {
    throw new Error('DATABASE_URL is required');
  }

  const sql = neon(config.database.url);
  db = drizzle(sql, { schema });

  logger.info('Database connection established');
  return db;
}

/**
 * Get existing database instance
 */
export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call createDatabase() first.');
  }
  return db;
}

/**
 * Close database connection (NeonDB is serverless, no pool to close)
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    db = null;
    logger.info('Database connection closed');
  }
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const database = getDatabase();
    await database.execute('SELECT NOW()' as any);
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error });
    return false;
  }
}
