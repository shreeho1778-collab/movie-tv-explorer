import { query } from '@/lib/db';
import { json, dbError } from '@/lib/auth';
import { toInt } from '@/lib/validate';

export const dynamic = 'force-dynamic';

// GET /api/explore?a=&b= – how are two people connected?
//  1. titles they both worked on (direct link)
//  2. people who link them (each worked with both) – "two steps away"
export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const a = toInt(sp.get('a'));
  const b = toInt(sp.get('b'));
  if (!a || !b || a === b) return json({ error: 'Choose two different people' }, 400);
  try {
    const [names, shared, connectors] = await Promise.all([
      query('SELECT Person_ID, Name FROM PERSON WHERE Person_ID IN (?, ?)', [a, b]),
      query(
        `SELECT fa.Movie_ID, fa.Title, fa.Release_Date,
                fa.Credit AS Credit_A, fa.Character_Name AS Character_A,
                fb.Credit AS Credit_B, fb.Character_Name AS Character_B
           FROM vw_person_filmography fa
           JOIN vw_person_filmography fb ON fb.Movie_ID = fa.Movie_ID
          WHERE fa.Person_ID = ? AND fb.Person_ID = ?
          ORDER BY fa.Release_Date`, [a, b]),
      query(
        `SELECT p.Person_ID, p.Name,
                (SELECT GROUP_CONCAT(DISTINCT x.Title SEPARATOR ', ')
                   FROM vw_person_filmography x JOIN vw_person_filmography y ON y.Movie_ID = x.Movie_ID
                  WHERE x.Person_ID = p.Person_ID AND y.Person_ID = ?) AS With_A,
                (SELECT GROUP_CONCAT(DISTINCT x.Title SEPARATOR ', ')
                   FROM vw_person_filmography x JOIN vw_person_filmography y ON y.Movie_ID = x.Movie_ID
                  WHERE x.Person_ID = p.Person_ID AND y.Person_ID = ?) AS With_B
           FROM PERSON p
          WHERE p.Person_ID NOT IN (?, ?)
         HAVING With_A IS NOT NULL AND With_B IS NOT NULL
          ORDER BY p.Name
          LIMIT 15`, [a, b, a, b]),
    ]);
    const nameOf = Object.fromEntries(names.map((n) => [n.Person_ID, n.Name]));
    return json({ a: { id: a, name: nameOf[a] }, b: { id: b, name: nameOf[b] }, shared, connectors });
  } catch (e) {
    return dbError(e);
  }
}
