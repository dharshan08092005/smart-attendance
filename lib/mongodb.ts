import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const mongoUri = process.env.MONGO_URI as string;
const databaseName = process.env.MONGO_DB as string;

if (!mongoUri) {
  throw new Error('Missing MONGO_URI environment variable');
}
if (!databaseName) {
  throw new Error('Missing MONGO_DB environment variable');
}

let cachedClient: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) return cachedClient;

  const client = new MongoClient(mongoUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
    cachedClient = client;
    return client;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

export async function connectToDatabase() {
  return await getMongoClient();
}

export async function getDatabase() {
  const client = await getMongoClient();
  return client.db(databaseName);
}

export async function getCollection(collectionName: string) {
  const db = await getDatabase();
  return db.collection(collectionName);
}
