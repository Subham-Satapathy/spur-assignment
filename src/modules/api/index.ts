import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import { ChatService } from '../chat';
import { LLMService } from '../llm';
import { createChatRoutes } from './routes/chat.routes';
import { createHealthRoutes } from './routes/health.routes';
import { requestLogger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

export function createApp(chatService: ChatService, llmService: LLMService): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Serve API routes first
  app.use('/health', createHealthRoutes(llmService));
  app.use('/chat', createChatRoutes(chatService));

  // Serve frontend static files from build output
  const frontendPath = path.join(__dirname, '..', '..', '..', 'frontend', 'dist');
  const publicPath = path.join(__dirname, '..', '..', '..', 'public');
  
  // Try to serve from built frontend first, fallback to public
  app.use(express.static(frontendPath));
  app.use(express.static(publicPath));

  // Serve index.html for root and any non-API routes (SPA fallback)
  app.get('*', (_req, res, next) => {
    // Skip API routes
    if (_req.path.startsWith('/health') || _req.path.startsWith('/chat')) {
      return next();
    }
    // Try frontend build first
    const frontendIndex = path.join(frontendPath, 'index.html');
    const publicIndex = path.join(publicPath, 'index.html');
    
    res.sendFile(frontendIndex, (err) => {
      if (err) {
        res.sendFile(publicIndex);
      }
    });
  });

  app.use('/api/*', notFoundHandler);
  app.use('/chat/*', notFoundHandler);
  app.use('/health/*', notFoundHandler);

  app.use(errorHandler);

  return app;
}
