// Seeds MongoDB: indexes, an admin account, a demo user and sample reviews.
// Run with:  npm run seed:mongo   (reads .env.local)
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';
import { ensureCollectionValidation } from '../lib/mongo-validation.mjs';

dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI missing in .env.local');
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(process.env.MONGODB_DB || 'movie_tv_nosql');

await ensureCollectionValidation(db);

await db.collection('users').createIndex({ email: 1 }, { unique: true });
await db.collection('reviews').createIndex({ movieId: 1, userId: 1 }, { unique: true });
await db.collection('reviews').createIndex({ movieId: 1, createdAt: -1 });
await db.collection('reviews').createIndex({ text: 'text', tags: 'text' });
await db.collection('activity_logs').createIndex({ createdAt: -1 });

async function upsertUser(name, email, password, role) {
  const passwordHash = await bcrypt.hash(password, 10);
  await db.collection('users').updateOne(
    { email },
    { $set: { name, email, passwordHash, role }, $setOnInsert: { watchlist: [], createdAt: new Date() } },
    { upsert: true }
  );
  return db.collection('users').findOne({ email });
}

const admin = await upsertUser('Admin', (process.env.ADMIN_EMAIL || 'admin@movietv.local').toLowerCase(),
  process.env.ADMIN_PASSWORD || 'Admin@123', 'admin');
const demo = await upsertUser('Demo User', 'user@movietv.local', 'User@123', 'user');

await db.collection('users').updateOne({ _id: demo._id }, { $set: { watchlist: [2, 10, 12] } });

const reviews = [
  { movieId: 1, u: demo,  score: 9,  text: 'The dream layers are clever and the ending still sparks debate.', tags: ['mind-bending', 'nolan'] },
  { movieId: 1, u: admin, score: 8,  text: 'Great concept, a little exposition heavy in the middle.', tags: ['heist'] },
  { movieId: 3, u: demo,  score: 10, text: 'Best superhero film I have seen. The interrogation scene is unforgettable.', tags: ['batman', 'joker'] },
  { movieId: 3, u: admin, score: 9,  text: 'A crime thriller first and a comic-book movie second.', tags: ['crime'] },
  { movieId: 10, u: demo, score: 10, text: 'Perfect character arc from start to finish.', tags: ['crime', 'drama'] },
  { movieId: 9, u: demo,  score: 8,  text: 'Huge, emotional finale to a decade of films.', tags: ['marvel'] },
  { movieId: 2, u: admin, score: 9,  text: 'The docking scene and the soundtrack are incredible.', tags: ['space', 'nolan'] },
  { movieId: 12, u: admin, score: 7, text: 'Fun eighties nostalgia with a good young cast.', tags: ['nostalgia'], spoiler: false },
];
for (const r of reviews) {
  await db.collection('reviews').updateOne(
    { movieId: r.movieId, userId: r.u._id.toString() },
    { $set: { movieId: r.movieId, userId: r.u._id.toString(), userName: r.u.name, score: r.score,
              text: r.text, tags: r.tags, spoiler: !!r.spoiler },
      $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
}

console.log('MongoDB seeded.');
console.log(`Admin login : ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
console.log('User login  : user@movietv.local / User@123');
await client.close();
