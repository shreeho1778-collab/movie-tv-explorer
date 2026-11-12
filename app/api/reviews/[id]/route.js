import { ObjectId } from 'mongodb';
import { json, requireRole } from '@/lib/auth';
import { getDb, logActivity } from '@/lib/mongo';

// DELETE /api/reviews/:id – the author or an admin
export async function DELETE(_req, { params }) {
  const [user, err] = await requireRole();
  if (err) return err;
  if (!ObjectId.isValid(params.id)) return json({ error: 'Invalid id' }, 400);
  const db = await getDb();
  const review = await db.collection('reviews').findOne({ _id: new ObjectId(params.id) });
  if (!review) return json({ error: 'Review not found' }, 404);
  if (user.role !== 'admin' && review.userId !== user.id) return json({ error: 'Not allowed' }, 403);
  await db.collection('reviews').deleteOne({ _id: review._id });
  await logActivity(user, 'DELETE_REVIEW', { reviewId: params.id, movieId: review.movieId });
  return json({ ok: true });
}
