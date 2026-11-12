import { query, transaction } from '@/lib/db';
import { json, requireRole, dbError } from '@/lib/auth';
import { logActivity } from '@/lib/mongo';
import { toInt, toIntList, emptyToNull, validateMovie, fulltextTerm } from '@/lib/validate';

export const dynamic = 'force-dynamic';

const SORTS = {
  rating: 'v.Rating DESC',
  newest: 'v.Release_Date DESC',
  oldest: 'v.Release_Date ASC',
  title: 'v.Title ASC',
};

// GET /api/movies?q=&genre=&type=&franchise=&sort=
export async function GET(req) {
  try {
    const sp = new URL(req.url).searchParams;
    const where = [];
    const params = [];

    const q = sp.get('q')?.trim();
    if (q) {
      // Full-text search on Title + Overview, with LIKE as a fallback for short words
      where.push(`(v.Movie_ID IN (SELECT Movie_ID FROM MOVIE_TV_SHOW
                    WHERE MATCH(Title, Overview) AGAINST (? IN BOOLEAN MODE))
                   OR v.Title LIKE ?)`);
      params.push(fulltextTerm(q) || q, `%${q}%`);
    }
    const genre = toInt(sp.get('genre'));
    if (genre) { where.push('v.Movie_ID IN (SELECT Movie_ID FROM BELONGS_TO WHERE Genre_ID = ?)'); params.push(genre); }
    const franchise = toInt(sp.get('franchise'));
    if (franchise) { where.push('v.Movie_ID IN (SELECT Movie_ID FROM PART_OF WHERE Franchise_ID = ?)'); params.push(franchise); }
    const type = sp.get('type');
    if (type === 'Movie' || type === 'TV Show') { where.push('v.Type = ?'); params.push(type); }

    const order = SORTS[sp.get('sort')] || SORTS.rating;
    const rows = await query(
      `SELECT v.* FROM vw_movie_details v
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY ${order}`,
      params
    );
    return json({ movies: rows });
  } catch (e) {
    return dbError(e);
  }
}

// POST /api/movies  (admin) – inserts the title and all its relationships in ONE transaction
export async function POST(req) {
  const [user, err] = await requireRole('admin');
  if (err) return err;
  const b = await req.json().catch(() => ({}));
  const errors = validateMovie(b);
  if (errors.length) return json({ error: errors.join('; ') }, 400);

  try {
    const movieId = await transaction(async (conn) => {
      const [r] = await conn.query(
        `INSERT INTO MOVIE_TV_SHOW (Title, Release_Date, Runtime, Type, Overview, Rating)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [b.Title.trim(), emptyToNull(b.Release_Date), emptyToNull(b.Runtime), b.Type,
         emptyToNull(b.Overview), emptyToNull(b.Rating)]
      );
      const id = r.insertId;
      const link = async (table, col, ids) => {
        for (const x of toIntList(ids)) await conn.query(`INSERT INTO ${table} (Movie_ID, ${col}) VALUES (?, ?)`, [id, x]);
      };
      await link('BELONGS_TO', 'Genre_ID', b.genreIds);
      await link('DIRECTED_BY', 'Person_ID', b.directorIds);
      await link('WRITTEN_BY', 'Person_ID', b.writerIds);
      await link('PRODUCED_BY', 'Company_ID', b.companyIds);
      await link('PART_OF', 'Franchise_ID', b.franchiseIds);
      return id;
    });
    await logActivity(user, 'CREATE_TITLE', { movieId, title: b.Title });
    return json({ Movie_ID: movieId }, 201);
  } catch (e) {
    return dbError(e);
  }
}
