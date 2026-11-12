// MongoDB connection (NoSQL part: users, reviews, watchlists, activity logs)
import { MongoClient } from 'mongodb';

let clientPromise = globalThis._mongoClientPromise;
let indexesReady = globalThis._mongoIndexesReady || false;

export async function getDb() {
  if (!clientPromise) {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set in .env.local');
    clientPromise = new MongoClient(process.env.MONGODB_URI).connect();
    globalThis._mongoClientPromise = clientPromise;
  }
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'movie_tv_nosql');
  if (!indexesReady) {
    await ensureIndexes(db);
    indexesReady = true;
    globalThis._mongoIndexesReady = true;
  }
  return db;
}

export async function ensureIndexes(db) {
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('reviews').createIndex({ movieId: 1, userId: 1 }, { unique: true });
  await db.collection('reviews').createIndex({ movieId: 1, createdAt: -1 });
  await db.collection('reviews').createIndex({ text: 'text', tags: 'text' });
  await db.collection('activity_logs').createIndex({ createdAt: -1 });
}

export async function logActivity(user, action, details = {}) {
  try {
    const db = await getDb();
    await db.collection('activity_logs').insertOne({
      userId: user?.id || null,
      userName: user?.name || 'system',
      role: user?.role || null,
      action,
      details,
      createdAt: new Date(),
    });
  } catch (e) {
    console.error('activity log failed', e);
  }
}
