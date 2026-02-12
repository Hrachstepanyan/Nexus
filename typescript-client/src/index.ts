/**
 * Application entry point
 */
import { createApp } from './app.js';
import { env } from './config/environment.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`
🚀 TypeScript Client running on port ${env.PORT}
📝 Environment: ${env.NODE_ENV}
🔗 Quivr Service: ${env.QUIVR_SERVICE_URL}
  `);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => { shutdown('SIGTERM'); });
process.on('SIGINT', () => { shutdown('SIGINT'); });
