'use client';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, year } from '@/lib/api';

function ExploreInner() {
  const sp = useSearchParams();
  const [people, setPeople] = useState([]);
  const [a, setA] = useState(sp.get('a') || '');
  const [b, setB] = useState(sp.get('b') || '');
  const [res, setRes] = useState(null);
  const [pairs, setPairs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/lookups').then((d) => setPeople(d.people));
    api('/api/stats').then((d) => setPairs(d.pairs)).catch(() => {});
  }, []);
  useEffect(() => {
    if (!a || !b) return;
    api(`/api/explore?a=${a}&b=${b}`).then((d) => { setRes(d); setError(''); }).catch((e) => { setError(e.message); setRes(null); });
  }, [a, b]);

  const pick = (val, set) => (
    <select value={val} onChange={(e) => set(e.target.value)} style={{ minWidth: 220 }}>
      <option value="">Choose a person…</option>
      {people.map((p) => <option key={p.Person_ID} value={p.Person_ID}>{p.Name}</option>)}
    </select>
  );

  return (
    <>
      <h1>Explore connections</h1>
      <p className="muted">Pick two people to see the titles they share and who links them together.</p>
      <div className="row card">{pick(a, setA)}<span className="muted">and</span>{pick(b, setB)}</div>
      {error && <p className="error">{error}</p>}

      {res && (
        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="card">
            <h3>Worked together on</h3>
            {res.shared.length ? (
              <table><thead><tr><th>Title</th><th>{res.a.name}</th><th>{res.b.name}</th></tr></thead><tbody>
                {res.shared.map((s, i) => (
                  <tr key={i}>
                    <td><Link href={`/movies/${s.Movie_ID}`}>{s.Title}</Link> <span className="muted small">{year(s.Release_Date)}</span></td>
                    <td className="small">{s.Credit_A}{s.Character_A ? ` (${s.Character_A})` : ''}</td>
                    <td className="small">{s.Credit_B}{s.Character_B ? ` (${s.Character_B})` : ''}</td>
                  </tr>
                ))}
              </tbody></table>
            ) : <p className="muted">They have no titles in common.</p>}
          </div>
          <div className="card">
            <h3>Connected through</h3>
            {res.connectors.length ? res.connectors.map((c) => (
              <div key={c.Person_ID} style={{ padding: '6px 0' }}>
                <Link href={`/people/${c.Person_ID}`}><b>{c.Name}</b></Link>
                <div className="muted small">with {res.a.name}: {c.With_A}</div>
                <div className="muted small">with {res.b.name}: {c.With_B}</div>
              </div>
            )) : <p className="muted">No one links them (yet).</p>}
          </div>
        </div>
      )}

      <h2>Actor–director partnerships (2+ films)</h2>
      <table>
        <thead><tr><th>Actor</th><th>Director</th><th>Films</th><th>Titles</th></tr></thead>
        <tbody>{pairs.map((p, i) => (
          <tr key={i}>
            <td><Link href={`/people/${p.Actor_ID}`}>{p.Actor_Name}</Link></td>
            <td><Link href={`/people/${p.Director_ID}`}>{p.Director_Name}</Link></td>
            <td className="rating">{p.Films_Together}</td>
            <td className="small">{p.Titles}</td>
          </tr>
        ))}</tbody>
      </table>
    </>
  );
}

export default function ExplorePage() {
  return <Suspense fallback={<p className="muted">Loading…</p>}><ExploreInner /></Suspense>;
}
