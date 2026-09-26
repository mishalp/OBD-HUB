import app from './app';
import { env } from './config/env';
import { getUploadsRoot } from './config/paths';
import { connectDatabase } from './database/connection';
import dns from "node:dns/promises";
dns.setServers(["1.1.1.1"]);

const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    console.log(`Uploads directory: ${getUploadsRoot()}`);
  });
};

startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  console.error('Failed to start server:', message);
  process.exit(1);
});
