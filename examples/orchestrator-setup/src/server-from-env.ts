import { createOrchestratorFromEnv } from '@pipeweave/orchestrator';
import { createServer } from 'http';

// ============================================================================
// Create Orchestrator from Environment Variables
// ============================================================================

// This example shows how to configure the orchestrator using environment variables
// See .env.example for the required environment variables

const orchestrator = createOrchestratorFromEnv();

// ============================================================================
// Start Orchestrator
// ============================================================================

async function main() {
  try {
    await orchestrator.start();

    const port = parseInt(process.env.PORT ?? '3000', 10);
    const server = createServer();

    server.listen(port, () => {
      console.log(`[Example] Orchestrator HTTP server listening on port ${port}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n[Example] Shutting down gracefully...');
      server.close();
      await orchestrator.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Example] Failed to start orchestrator:', error);
    process.exit(1);
  }
}

main();
