import { query } from '@/lib/db';
import { json, requireRole, getUser } from '@/lib/auth';
import { getDb, logActivity } from '@/lib/mongo';
import { toInt } from '@/lib/validate';

export const dynamic = 'force-dynamic';

// GET /api/movies/:id/reviews – reviews from MongoDB + aggregated user score
export async function GET(_req, { params }) {
  const movieId = toInt(params.id);
  const db = await getDb();
  const me = await getUser();
  const reviews = await db.collection('reviews').find({ movieId }).sort({ createdAt: -1 }).toArray();
  const [summary] = await db.collection('reviews').aggregate([
    { $match: { movieId } },
    { $group: { _id: '$movieId', avgScore: { $avg: '$score' }, count: { $sum: 1 } } },
  ]).toArray();
  return json({
    reviews: reviews.map((r) => ({
      id: r._id.toString(), userName: r.userName, score: r.score, text: r.text,
      tags: r.tags || [], spoiler: !!r.spoiler, createdAt: r.createdAt,
      canDelete: !!me && (me.role === 'admin' || me.id === r.userId),
    })),
    avgScore: summary ? Math.round(summary.avgScore * 10) / 10 : null,
    count: summary?.count || 0,
  });
}

// POST /api/movies/:id/reviews – any logged-in user, one review per title
export async function POST(req, { params }) {
  const [user, err] = await requireRole();
  if (err) return err;
  const movieId = toInt(params.id);
  const b = await req.json().catch(() => ({}));
  const score = Number(b.score);
  if (!Number.isInteger(score) || score < 1 || score > 10) return json({ error: 'Score must be 1 to 10' }, 400);
  if (!b.text?.trim() || b.text.trim().length < 5) return json({ error: 'Write at least 5 characters' }, 400);

  // Cross-database integrity: the title must exist in MySQL
  const [m] = await query('SELECT Movie_ID FROM MOVIE_TV_SHOW WHERE Movie_ID = ?', [movieId]);
  if (!m) return json({ error: 'Title not found' }, 404);

  const tags = String(b.tags || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 5);
  const db = await getDb();
  try {
    await db.collection('reviews').insertOne({
      movieId, userId: user.id, userName: user.name, score, text: b.text.trim(),
      tags, spoiler: !!b.spoiler, createdAt: new Date(),
    });
  } catch (e) {
    if (e.code === 11000) return json({ error: 'You have already reviewed this title' }, 409);
    throw e;
  }
  await logActivity(user, 'ADD_REVIEW', { movieId, score });
  return json({ ok: true }, 201);
}
