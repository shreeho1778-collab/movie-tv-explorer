import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { ensureCollectionValidation } from '../lib/mongo-validation.mjs';

dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI missing in .env.local');

const client = new MongoClient(uri);
try {
  const db = client.db(process.env.MONGODB_DB || 'movie_tv_nosql');
  await ensureCollectionValidation(db);
  console.log('MongoDB collection validation configured for users, reviews, and activity_logs.');
} finally {
  await client.close();
}
