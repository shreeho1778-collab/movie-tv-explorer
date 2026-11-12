import bcrypt from 'bcryptjs';
import { getDb, logActivity } from '@/lib/mongo';
import { signToken, json, setAuthCookie } from '@/lib/auth';

export async function POST(req) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return json({ error: 'Email and password are required' }, 400);
  const db = await getDb();
  const u = await db.collection('users').findOne({ email: email.trim().toLowerCase() });
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) return json({ error: 'Invalid email or password' }, 401);
  const user = { id: u._id.toString(), name: u.name, email: u.email, role: u.role };
  await logActivity(user, 'LOGIN');
  return setAuthCookie(json({ user }), await signToken(user));
}
