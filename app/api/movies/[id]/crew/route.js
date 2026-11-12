import { query } from '@/lib/db';
import { json, requireRole, dbError } from '@/lib/auth';
import { logActivity } from '@/lib/mongo';
import { toInt } from '@/lib/validate';

// Link tables a title can be connected to, keyed by "kind"
const LINKS = {
  director:  { table: 'DIRECTED_BY', col: 'Person_ID' },
  writer:    { table: 'WRITTEN_BY',  col: 'Person_ID' },
  genre:     { table: 'BELONGS_TO',  col: 'Genre_ID' },
  company:   { table: 'PRODUCED_BY', col: 'Company_ID' },
  franchise: { table: 'PART_OF',     col: 'Franchise_ID' },
};

// POST /api/movies/:id/crew  body: { kind, refId }   (admin)
export async function POST(req, { params }) {
  const [user, err] = await requireRole('admin');
  if (err) return err;
  const movieId = toInt(params.id);
  const { kind, refId } = await req.json().catch(() => ({}));
  const link = LINKS[kind];
  const ref = toInt(refId);
  if (!movieId || !link || !ref) return json({ error: 'Invalid link' }, 400);
  try {
    await query(`INSERT INTO ${link.table} (Movie_ID, ${link.col}) VALUES (?, ?)`, [movieId, ref]);
    await logActivity(user, 'ADD_LINK', { movieId, kind, refId: ref });
    return json({ ok: true }, 201);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return json({ error: 'Already linked' }, 409);
    return dbError(e);
  }
}

// DELETE /api/movies/:id/crew?kind=&refId=
export async function DELETE(req, { params }) {
  const [user, err] = await requireRole('admin');
  if (err) return err;
  const sp = new URL(req.url).searchParams;
  const link = LINKS[sp.get('kind')];
  const movieId = toInt(params.id);
  const ref = toInt(sp.get('refId'));
  if (!link || !ref) return json({ error: 'Invalid link' }, 400);
  try {
    await query(`DELETE FROM ${link.table} WHERE Movie_ID = ? AND ${link.col} = ?`, [movieId, ref]);
    await logActivity(user, 'REMOVE_LINK', { movieId, kind: sp.get('kind'), refId: ref });
    return json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}
