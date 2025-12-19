#!/usr/bin/env node

import { createDatabase, closeDatabase, testDatabaseConnection } from '../shared/database';
import { validateConfig } from '../shared/config';
import logger from '../shared/logger';

async function main() {
  try {
    logger.info('Validating database setup...');

    validateConfig();

    createDatabase();

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
