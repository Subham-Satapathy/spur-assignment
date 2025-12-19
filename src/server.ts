import { bootstrapApp } from './app';
import { validateConfig, config } from './shared/config';
import { closeDatabase } from './shared/database';
import logger from './shared/logger';

async function start() {
  try {
    logger.info('Validating configuration...');
    validateConfig();
    logger.info('Configuration validated successfully');

    const { app } = await bootstrapApp();

    const server = app.listen(config.server.port, () => {
      logger.info(`Server started successfully`, {
        port: config.server.port,
        env: config.server.env,
        llmProvider: config.llm.provider,
      });
      logger.info(`Health check: http://localhost:${config.server.port}/health`);
      logger.info(`Chat API: http://localhost:${config.server.port}/chat/message`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await closeDatabase();
        logger.info('Database connection closed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();
