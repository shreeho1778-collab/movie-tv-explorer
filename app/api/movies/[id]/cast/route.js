import { query, transaction } from '@/lib/db';
import { json, requireRole, dbError } from '@/lib/auth';
import { logActivity } from '@/lib/mongo';
import { toInt, emptyToNull } from '@/lib/validate';

// POST /api/movies/:id/cast  (admin)
// body: { personId, characterId }  or  { personId, newCharacterName, characterDescription }
export async function POST(req, { params }) {
  const [user, err] = await requireRole('admin');
  if (err) return err;
  const movieId = toInt(params.id);
  const b = await req.json().catch(() => ({}));
  const personId = toInt(b.personId);
  if (!movieId || !personId) return json({ error: 'Choose an actor' }, 400);

  try {
    await transaction(async (conn) => {
      let characterId = toInt(b.characterId);
      if (!characterId && emptyToNull(b.newCharacterName)) {
        const [r] = await conn.query('INSERT INTO `CHARACTER` (Character_Name, Description) VALUES (?, ?)',
          [b.newCharacterName.trim(), emptyToNull(b.characterDescription)]);
        characterId = r.insertId;
      }
      // trigger trg_acts_in_after_insert adds the Actor role to WORKS_AS
      await conn.query('INSERT INTO ACTS_IN (Person_ID, Movie_ID, Character_ID) VALUES (?, ?, ?)',
        [personId, movieId, characterId || null]);
    });
    await logActivity(user, 'ADD_CAST', { movieId, personId });
    return json({ ok: true }, 201);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return json({ error: 'This person is already in the cast' }, 409);
    return dbError(e);
  }
}

// DELETE /api/movies/:id/cast?personId=
export async function DELETE(req, { params }) {
  const [user, err] = await requireRole('admin');
  if (err) return err;
  const movieId = toInt(params.id);
  const personId = toInt(new URL(req.url).searchParams.get('personId'));
  try {
    await query('DELETE FROM ACTS_IN WHERE Movie_ID = ? AND Person_ID = ?', [movieId, personId]);
    await logActivity(user, 'REMOVE_CAST', { movieId, personId });
    return json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}
