'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function PeoplePage() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [roles, setRoles] = useState([]);
  const [people, setPeople] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api('/api/lookups').then((d) => setRoles(d.roles)).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams(Object.entries({ q, role }).filter(([, v]) => v)).toString();
      api(`/api/people?${qs}`).then((d) => { setPeople(d.people); setError(''); }).catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [q, role]);

  return (
    <>
      <h1>People</h1>
      <div className="row card" style={{ marginBottom: 16 }}>
        <input placeholder="Search name or biography…" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }} />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All professions</option>
          {roles.map((r) => <option key={r.RoleType_ID} value={r.RoleType_ID}>{r.Role_Name}</option>)}
        </select>
      </div>
      {error && <p className="error">{error}</p>}
      {!people ? <p className="muted">Loading…</p> : (
        <table>
          <thead><tr><th>Name</th><th>Works as</th><th>Born</th><th>Gender</th><th>Credits</th></tr></thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.Person_ID}>
                <td><Link href={`/people/${p.Person_ID}`}><b>{p.Name}</b></Link></td>
                <td className="small">{p.Roles || '—'}</td>
                <td>{p.Birth_Date || '—'}</td>
                <td>{p.Gender || '—'}</td>
                <td className="rating">{p.Credits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
