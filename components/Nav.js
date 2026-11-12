'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function Nav() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    api('/api/auth/me').then((d) => setUser(d.user)).catch(() => setUser(null));
  }, [pathname]);

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  }

  return (
    <nav className="top">
      <div className="inner">
        <Link href="/" className="brand">MovieTV Explorer</Link>
        <Link href="/movies">Titles</Link>
        <Link href="/people">People</Link>
        <Link href="/explore">Explore connections</Link>
        <Link href="/stats">Dashboard</Link>
        {user && <Link href="/watchlist">My watchlist</Link>}
        {user?.role === 'admin' && <Link href="/admin">Admin</Link>}
        <span className="spacer" />
        {user ? (
          <>
            <span className="muted small">{user.name} ({user.role})</span>
            <button className="secondary" onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/register"><button>Sign up</button></Link>
          </>
        )}
      </div>
    </nav>
  );
}
