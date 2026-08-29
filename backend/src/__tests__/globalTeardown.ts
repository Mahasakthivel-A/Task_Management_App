import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalTeardown() {
  const mongoServer = (global as Record<string, unknown>).__MONGO_SERVER__ as MongoMemoryServer | undefined;
  if (mongoServer) {
    await mongoServer.stop();
  }
}
