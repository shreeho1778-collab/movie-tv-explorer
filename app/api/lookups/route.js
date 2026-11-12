import { query } from '@/lib/db';
import { json, requireRole, dbError } from '@/lib/auth';
import { logActivity } from '@/lib/mongo';
import { emptyToNull } from '@/lib/validate';

export const dynamic = 'force-dynamic';

// GET /api/lookups – data for dropdowns and filters
export async function GET() {
  try {
    const [genres, franchises, companies, roles, characters, people] = await Promise.all([
      query('SELECT * FROM GENRE ORDER BY Genre_Name'),
      query('SELECT * FROM FRANCHISE ORDER BY Franchise_Name'),
      query('SELECT * FROM PRODUCTION_COMPANY ORDER BY Company_Name'),
      query('SELECT * FROM ROLE_TYPE ORDER BY Role_Name'),
      query('SELECT Character_ID, Character_Name FROM `CHARACTER` ORDER BY Character_Name'),
      query('SELECT Person_ID, Name FROM PERSON ORDER BY Name'),
    ]);
    return json({ genres, franchises, companies, roles, characters, people });
  } catch (e) {
    return dbError(e);
  }
}

// POST /api/lookups (admin) – add a genre, franchise, company, role type or character
// body: { kind: 'genre' | 'franchise' | 'company' | 'role' | 'character', ...fields }
const KINDS = {
  genre:     { sql: 'INSERT INTO GENRE (Genre_Name) VALUES (?)', fields: ['Genre_Name'] },
  franchise: { sql: 'INSERT INTO FRANCHISE (Franchise_Name, Description) VALUES (?, ?)', fields: ['Franchise_Name', 'Description'] },
  company:   { sql: 'INSERT INTO PRODUCTION_COMPANY (Company_Name, Country) VALUES (?, ?)', fields: ['Company_Name', 'Country'] },
  role:      { sql: 'INSERT INTO ROLE_TYPE (Role_Name) VALUES (?)', fields: ['Role_Name'] },
  character: { sql: 'INSERT INTO `CHARACTER` (Character_Name, Description) VALUES (?, ?)', fields: ['Character_Name', 'Description'] },
};

export async function POST(req) {
  const [user, err] = await requireRole('admin');
  if (err) return err;
  const b = await req.json().catch(() => ({}));
  const kind = KINDS[b.kind];
  if (!kind) return json({ error: 'Unknown type' }, 400);
  const values = kind.fields.map((f) => (typeof b[f] === 'string' ? emptyToNull(b[f].trim()) : emptyToNull(b[f])));
  if (!values[0]) return json({ error: `${kind.fields[0].replace('_', ' ')} is required` }, 400);
  try {
    const r = await query(kind.sql, values);
    await logActivity(user, 'CREATE_' + b.kind.toUpperCase(), { id: r.insertId, name: values[0] });
    return json({ id: r.insertId }, 201);
  } catch (e) {
    return dbError(e);
  }
}
