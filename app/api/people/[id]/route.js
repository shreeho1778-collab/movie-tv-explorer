import pool, { query } from '@/lib/db';
import { json, requireRole, dbError } from '@/lib/auth';
import { logActivity } from '@/lib/mongo';
import { toInt, emptyToNull, validatePerson } from '@/lib/validate';

export const dynamic = 'force-dynamic';

// GET /api/people/:id – profile, professions, filmography, frequent collaborators
export async function GET(_req, { params }) {
  const id = toInt(params.id);
  if (!id) return json({ error: 'Invalid id' }, 400);
  try {
    const [person] = await query('SELECT * FROM PERSON WHERE Person_ID = ?', [id]);
    if (!person) return json({ error: 'Person not found' }, 404);
    const roles = await query(
      `SELECT rt.RoleType_ID, rt.Role_Name FROM WORKS_AS wa
         JOIN ROLE_TYPE rt ON rt.RoleType_ID = wa.RoleType_ID WHERE wa.Person_ID = ?`, [id]);
    const filmography = await query(
      'SELECT * FROM vw_person_filmography WHERE Person_ID = ? ORDER BY Release_Date DESC, Credit', [id]);
    // stored procedure call returns [resultSet, okPacket]
    const [callResult] = await pool.query('CALL sp_frequent_collaborators(?)', [id]);
    const collaborators = callResult[0] || [];
    const [credits] = await query('SELECT fn_person_credit_count(?) AS total', [id]);
    return json({ person, roles, filmography, collaborators, totalCredits: credits.total });
  } catch (e) {
    return dbError(e);
  }
}

// PUT /api/people/:id (admin)
export async function PUT(req, { params }) {
  const [user, err] = await requireRole('admin');
  if (err) return err;
  const id = toInt(params.id);
  const b = await req.json().catch(() => ({}));
  const errors = validatePerson(b);
  if (errors.length) return json({ error: errors.join('; ') }, 400);
  try {
    const r = await query(
      'UPDATE PERSON SET Name = ?, Birth_Date = ?, Gender = ?, Biography = ? WHERE Person_ID = ?',
      [b.Name.trim(), emptyToNull(b.Birth_Date), emptyToNull(b.Gender), emptyToNull(b.Biography), id]
    );
    if (!r.affectedRows) return json({ error: 'Person not found' }, 404);
    await logActivity(user, 'UPDATE_PERSON', { personId: id });
    return json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}

// DELETE /api/people/:id (admin)
export async function DELETE(_req, { params }) {
  const [user, err] = await requireRole('admin');
  if (err) return err;
  const id = toInt(params.id);
  try {
    const r = await query('DELETE FROM PERSON WHERE Person_ID = ?', [id]);
    if (!r.affectedRows) return json({ error: 'Person not found' }, 404);
    await logActivity(user, 'DELETE_PERSON', { personId: id });
    return json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}
