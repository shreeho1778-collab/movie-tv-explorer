// Authentication helpers: JWT in an httpOnly cookie, roles = 'admin' | 'user'
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

export async function getUser() {
  const token = cookies().get('token')?.value;
  return token ? verifyToken(token) : null;
}

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

// Returns [user, errorResponse]. role = null means any logged-in user.
export async function requireRole(role = null) {
  const user = await getUser();
  if (!user) return [null, json({ error: 'Please log in first' }, 401)];
  if (role && user.role !== role) return [null, json({ error: 'Admin access required' }, 403)];
  return [user, null];
}

export function setAuthCookie(res, token) {
  res.cookies.set('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

// Convert MySQL errors (constraints, triggers, FKs) into readable API errors
export function dbError(e) {
  console.error(e);
  const msg = e.sqlMessage || e.message || 'Server error';
  if (e.code === 'ER_DUP_ENTRY') return json({ error: 'Already exists: ' + msg }, 409);
  const clientErrors = [
    'ER_CHECK_CONSTRAINT_VIOLATED', 'ER_NO_REFERENCED_ROW_2', 'ER_ROW_IS_REFERENCED_2',
    'ER_TRUNCATED_WRONG_VALUE', 'ER_BAD_NULL_ERROR', 'ER_DATA_TOO_LONG',
    'ER_WARN_DATA_OUT_OF_RANGE', 'ER_SIGNAL_EXCEPTION', 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD',
  ];
  if (clientErrors.includes(e.code) || e.sqlState === '45000') return json({ error: msg }, 400);
  return json({ error: msg }, 500);
}
