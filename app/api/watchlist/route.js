import { ObjectId } from 'mongodb';
import { query } from '@/lib/db';
import { json, requireRole } from '@/lib/auth';
import { getDb } from '@/lib/mongo';
import { toInt } from '@/lib/validate';

export const dynamic = 'force-dynamic';

// The watchlist (array of Movie_IDs) lives in the user's MongoDB document;
// the title details come from MySQL.
export async function GET() {
  const [user, err] = await requireRole();
  if (err) return err;
  const db = await getDb();
  const doc = await db.collection('users').findOne({ _id: new ObjectId(user.id) }, { projection: { watchlist: 1 } });
  const ids = doc?.watchlist || [];
  const movies = ids.length ? await query('SELECT * FROM vw_movie_details WHERE Movie_ID IN (?)', [ids]) : [];
  return json({ ids, movies });
}

export async function POST(req) {
  const [user, err] = await requireRole();
  if (err) return err;
  const { movieId } = await req.json().catch(() => ({}));
  const id = toInt(movieId);
  const [m] = id ? await query('SELECT Movie_ID FROM MOVIE_TV_SHOW WHERE Movie_ID = ?', [id]) : [];
  if (!m) return json({ error: 'Title not found' }, 404);
  const db = await getDb();
  await db.collection('users').updateOne({ _id: new ObjectId(user.id) }, { $addToSet: { watchlist: id } });
  return json({ ok: true });
}

export async function DELETE(req) {
  const [user, err] = await requireRole();
  if (err) return err;
  const id = toInt(new URL(req.url).searchParams.get('movieId'));
  const db = await getDb();
  await db.collection('users').updateOne({ _id: new ObjectId(user.id) }, { $pull: { watchlist: id } });
  return json({ ok: true });
}
