import { query } from '@/lib/db';
import { json, requireRole, dbError } from '@/lib/auth';
import { getDb, logActivity } from '@/lib/mongo';
import { toInt, emptyToNull, validateMovie } from '@/lib/validate';

export const dynamic = 'force-dynamic';

// GET /api/movies/:id – title with cast, crew, genres, companies, franchise
export async function GET(_req, { params }) {
  const id = toInt(params.id);
  if (!id) return json({ error: 'Invalid id' }, 400);
  try {
    const [movie] = await query('SELECT * FROM vw_movie_details WHERE Movie_ID = ?', [id]);
    if (!movie) return json({ error: 'Title not found' }, 404);

    const [cast, directors, writers, genres, companies, franchises] = await Promise.all([
      query(`SELECT p.Person_ID, p.Name, c.Character_ID, c.Character_Name
               FROM ACTS_IN a JOIN PERSON p ON p.Person_ID = a.Person_ID
               LEFT JOIN \`CHARACTER\` c ON c.Character_ID = a.Character_ID
              WHERE a.Movie_ID = ? ORDER BY p.Name`, [id]),
      query(`SELECT p.Person_ID, p.Name FROM DIRECTED_BY d JOIN PERSON p ON p.Person_ID = d.Person_ID
              WHERE d.Movie_ID = ? ORDER BY p.Name`, [id]),
      query(`SELECT p.Person_ID, p.Name FROM WRITTEN_BY w JOIN PERSON p ON p.Person_ID = w.Person_ID
              WHERE w.Movie_ID = ? ORDER BY p.Name`, [id]),
      query(`SELECT g.Genre_ID, g.Genre_Name FROM BELONGS_TO b JOIN GENRE g ON g.Genre_ID = b.Genre_ID
              WHERE b.Movie_ID = ? ORDER BY g.Genre_Name`, [id]),
      query(`SELECT pc.Company_ID, pc.Company_Name, pc.Country FROM PRODUCED_BY pb
               JOIN PRODUCTION_COMPANY pc ON pc.Company_ID = pb.Company_ID
              WHERE pb.Movie_ID = ? ORDER BY pc.Company_Name`, [id]),
      query(`SELECT f.Franchise_ID, f.Franchise_Name FROM PART_OF po
               JOIN FRANCHISE f ON f.Franchise_ID = po.Franchise_ID WHERE po.Movie_ID = ?`, [id]),
    ]);

    // Other titles in the same franchise
    const related = franchises.length
      ? await query(`SELECT DISTINCT m.Movie_ID, m.Title, m.Release_Date, m.Rating
                       FROM PART_OF po JOIN MOVIE_TV_SHOW m ON m.Movie_ID = po.Movie_ID
                      WHERE po.Franchise_ID IN (?) AND m.Movie_ID <> ?
                      ORDER BY m.Release_Date`, [franchises.map((f) => f.Franchise_ID), id])
      : [];

    return json({ movie, cast, directors, writers, genres, companies, franchises, related });
  } catch (e) {
    return dbError(e);
  }
}

// PUT /api/movies/:id (admin) – update the title's own attributes
export async function PUT(req, { params }) {
  const [user, err] = await requireRole('admin');
  if (err) return err;
  const id = toInt(params.id);
  const b = await req.json().catch(() => ({}));
  const errors = validateMovie(b);
  if (errors.length) return json({ error: errors.join('; ') }, 400);
  try {
    const r = await query(
      `UPDATE MOVIE_TV_SHOW SET Title = ?, Release_Date = ?, Runtime = ?, Type = ?, Overview = ?, Rating = ?
        WHERE Movie_ID = ?`,
      [b.Title.trim(), emptyToNull(b.Release_Date), emptyToNull(b.Runtime), b.Type,
       emptyToNull(b.Overview), emptyToNull(b.Rating), id]
    );
    if (!r.affectedRows) return json({ error: 'Title not found' }, 404);
    await logActivity(user, 'UPDATE_TITLE', { movieId: id, title: b.Title });
    return json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}

// DELETE /api/movies/:id (admin) – ON DELETE CASCADE removes its relationship rows
export async function DELETE(_req, { params }) {
  const [user, err] = await requireRole('admin');
  if (err) return err;
  const id = toInt(params.id);
  try {
    const r = await query('DELETE FROM MOVIE_TV_SHOW WHERE Movie_ID = ?', [id]);
    if (!r.affectedRows) return json({ error: 'Title not found' }, 404);
    // keep MongoDB consistent with MySQL
    const db = await getDb();
    await db.collection('reviews').deleteMany({ movieId: id });
    await db.collection('users').updateMany({}, { $pull: { watchlist: id } });
    await logActivity(user, 'DELETE_TITLE', { movieId: id });
    return json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}
