import { getUser, json } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await getUser();
  return json({ user: u ? { id: u.id, name: u.name, email: u.email, role: u.role } : null });
}
