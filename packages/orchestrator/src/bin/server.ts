#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { createOrchestratorFromEnv } from '../orchestrator.js';
import { registerRoutes } from '../routes/index.js';
import logger from '../logger.js';

// ============================================================================
// Express Server
// ============================================================================

async function main() {
  try {
    // Create orchestrator from environment variables
    logger.info('[server] Creating orchestrator...');
    const orchestrator = createOrchestratorFromEnv();

    // Create Express app
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging (development)
    if (!process.env.GCP_PROJECT_ID) {
      app.use((req, _res, next) => {
        logger.info(`[server] ${req.method} ${req.path}`);
        next();
      });
    }

    // Register all routes
    registerRoutes(app, orchestrator);

    // Start orchestrator
    await orchestrator.start();

    // Start HTTP server
    const port = (orchestrator as any).config.port;
    const server = app.listen(port, () => {
      logger.info(`[server] HTTP server listening on port ${port}`);
      logger.info('[server] Orchestrator ready');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`[server] Received ${signal}, shutting down gracefully...`);

      server.close(async () => {
        logger.info('[server] HTTP server closed');
        await orchestrator.stop();
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('[server] Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('[server] Failed to start orchestrator', { error });
    process.exit(1);
  }
}

main();
