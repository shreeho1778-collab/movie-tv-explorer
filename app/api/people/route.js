import { query, transaction } from '@/lib/db';
import { json, requireRole, dbError } from '@/lib/auth';
import { logActivity } from '@/lib/mongo';
import { toInt, toIntList, emptyToNull, validatePerson, fulltextTerm } from '@/lib/validate';

export const dynamic = 'force-dynamic';

// GET /api/people?q=&role=
export async function GET(req) {
  try {
    const sp = new URL(req.url).searchParams;
    const where = [];
    const params = [];
    const q = sp.get('q')?.trim();
    if (q) {
      where.push('(MATCH(p.Name, p.Biography) AGAINST (? IN BOOLEAN MODE) OR p.Name LIKE ?)');
      params.push(fulltextTerm(q) || q, `%${q}%`);
    }
    const role = toInt(sp.get('role'));
    if (role) { where.push('p.Person_ID IN (SELECT Person_ID FROM WORKS_AS WHERE RoleType_ID = ?)'); params.push(role); }

    const rows = await query(
      `SELECT p.Person_ID, p.Name, p.Birth_Date, p.Gender,
              (SELECT GROUP_CONCAT(rt.Role_Name ORDER BY rt.Role_Name SEPARATOR ', ')
                 FROM WORKS_AS wa JOIN ROLE_TYPE rt ON rt.RoleType_ID = wa.RoleType_ID
                WHERE wa.Person_ID = p.Person_ID) AS Roles,
              fn_person_credit_count(p.Person_ID) AS Credits
         FROM PERSON p
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        ORDER BY Credits DESC, p.Name`,
      params
    );
    return json({ people: rows });
  } catch (e) {
    return dbError(e);
  }
}

// POST /api/people (admin) – PERSON + WORKS_AS rows in one transaction
export async function POST(req) {
  const [user, err] = await requireRole('admin');
  if (err) return err;
  const b = await req.json().catch(() => ({}));
  const errors = validatePerson(b);
  if (errors.length) return json({ error: errors.join('; ') }, 400);
  try {
    const id = await transaction(async (conn) => {
      const [r] = await conn.query(
        'INSERT INTO PERSON (Name, Birth_Date, Gender, Biography) VALUES (?, ?, ?, ?)',
        [b.Name.trim(), emptyToNull(b.Birth_Date), emptyToNull(b.Gender), emptyToNull(b.Biography)]
      );
      for (const roleId of toIntList(b.roleIds)) {
        await conn.query('INSERT INTO WORKS_AS (Person_ID, RoleType_ID) VALUES (?, ?)', [r.insertId, roleId]);
      }
      return r.insertId;
    });
    await logActivity(user, 'CREATE_PERSON', { personId: id, name: b.Name });
    return json({ Person_ID: id }, 201);
  } catch (e) {
    return dbError(e);
  }
}
