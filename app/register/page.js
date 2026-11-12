'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function Register() {
  const router = useRouter();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      await api('/api/auth/register', { method: 'POST', body: f });
      router.push('/');
      router.refresh();
    } catch (x) { setError(x.message); }
  }

  return (
    <form className="card" style={{ maxWidth: 400, margin: '40px auto' }} onSubmit={submit}>
      <h1>Create account</h1>
      <div className="field"><label>Name</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></div>
      <div className="field"><label>Email</label><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></div>
      <div className="field"><label>Password (min 6 characters)</label><input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required minLength={6} /></div>
      {error && <p className="error">{error}</p>}
      <button>Sign up</button>
      <p className="muted small">Already registered? <Link href="/login">Log in</Link></p>
    </form>
  );
}
