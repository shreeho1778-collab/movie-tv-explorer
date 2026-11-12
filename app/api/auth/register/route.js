import bcrypt from 'bcryptjs';
import { getDb, logActivity } from '@/lib/mongo';
import { signToken, json, setAuthCookie } from '@/lib/auth';

export async function POST(req) {
  const { name, email, password } = await req.json().catch(() => ({}));
  if (!name?.trim() || !email?.trim() || !password) return json({ error: 'Name, email and password are required' }, 400);
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: 'Enter a valid email' }, 400);
  if (password.length < 6) return json({ error: 'Password must be at least 6 characters' }, 400);

  const db = await getDb();
  const cleanEmail = email.trim().toLowerCase();
  if (await db.collection('users').findOne({ email: cleanEmail })) return json({ error: 'Email already registered' }, 409);

  const passwordHash = await bcrypt.hash(password, 10);
  // Self-registration always creates the normal 'user' role
  const r = await db.collection('users').insertOne({
    name: name.trim(), email: cleanEmail, passwordHash, role: 'user', watchlist: [], createdAt: new Date(),
  });
  const user = { id: r.insertedId.toString(), name: name.trim(), email: cleanEmail, role: 'user' };
  await logActivity(user, 'REGISTER');
  return setAuthCookie(json({ user }), await signToken(user));
}
