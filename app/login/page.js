'use client';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function LoginInner() {
  const router = useRouter();
  const next = useSearchParams().get('next') || '/';
  const [f, setF] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/auth/login', { method: 'POST', body: f });
      router.push(next);
      router.refresh();
    } catch (x) { setError(x.message); } finally { setBusy(false); }
  }

  return (
    <form className="card" style={{ maxWidth: 400, margin: '40px auto' }} onSubmit={submit}>
      <h1>Log in</h1>
      <div className="field"><label>Email</label><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></div>
      <div className="field"><label>Password</label><input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></div>
      {error && <p className="error">{error}</p>}
      <button disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      <p className="muted small">No account? <Link href="/register">Sign up</Link></p>
    </form>
  );
}

export default function Login() {
  return <Suspense><LoginInner /></Suspense>;
}
