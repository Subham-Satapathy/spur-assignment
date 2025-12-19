#!/usr/bin/env node

/**
 * Database migration script
 * 
 * With Drizzle ORM, schema changes are managed through:
 * - npm run db:generate - Generate migration files from schema
 * - npm run db:push - Push schema directly to database (development)
 * - npm run db:migrate - Apply migrations (production)
 * 
 * This script validates the database connection and schema.
 * Use `npm run db:push` for development or `npm run db:migrate` for production.
 */

import { createDatabase, closeDatabase, testDatabaseConnection } from '../shared/database';
import { validateConfig } from '../shared/config';
import logger from '../shared/logger';

async function main() {
  try {
    logger.info('Validating database setup...');

    // Validate configuration
    validateConfig();

    // Initialize database connection
    createDatabase();

    // Test connection
    await testDatabaseConnection();

    logger.info('Database connection validated successfully');
    logger.info('To apply schema changes, run: npm run db:push');
    
    process.exit(0);
  } catch (error) {
    logger.error('Database validation failed', { error });
    logger.info('Please ensure your DATABASE_URL is correct in .env');
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

main();
