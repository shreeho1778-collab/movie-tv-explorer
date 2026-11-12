import { json } from '@/lib/auth';

export async function POST() {
  const res = json({ ok: true });
  res.cookies.set('token', '', { path: '/', maxAge: 0 });
  return res;
}
