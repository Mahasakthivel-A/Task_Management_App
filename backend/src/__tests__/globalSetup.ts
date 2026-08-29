import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

export default async function globalSetup() {
  mongoServer = await MongoMemoryServer.create({
    instance: { dbName: 'testdb' },
  });
  process.env.MONGODB_URI = mongoServer.getUri();
  (global as Record<string, unknown>).__MONGO_SERVER__ = mongoServer;
}
