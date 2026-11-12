import { json, requireRole } from '@/lib/auth';
import { getDb } from '@/lib/mongo';

export const dynamic = 'force-dynamic';

// GET /api/activity (admin) – latest actions from the MongoDB activity log
export async function GET() {
  const [, err] = await requireRole('admin');
  if (err) return err;
  const db = await getDb();
  const logs = await db.collection('activity_logs').find().sort({ createdAt: -1 }).limit(50).toArray();
  const byAction = await db.collection('activity_logs').aggregate([
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray();
  return json({
    logs: logs.map((l) => ({ id: l._id.toString(), userName: l.userName, role: l.role, action: l.action, details: l.details, createdAt: l.createdAt })),
    byAction: byAction.map((a) => ({ action: a._id, count: a.count })),
  });
}
