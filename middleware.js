// Protects pages: /admin needs the admin role, /watchlist needs any login
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(req) {
  const token = req.cookies.get('token')?.value;
  let user = null;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');
      user = (await jwtVerify(token, secret)).payload;
    } catch {
      user = null;
    }
  }
  const path = req.nextUrl.pathname;
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(path)}`, req.url));
  if (path.startsWith('/admin') && user.role !== 'admin') return NextResponse.redirect(new URL('/', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*', '/watchlist'] };
