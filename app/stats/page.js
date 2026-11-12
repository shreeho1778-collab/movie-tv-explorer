'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

function Bars({ rows, label, value }) {
  const max = Math.max(1, ...rows.map((r) => Number(r[value]) || 0));
  return (
    <table><tbody>
      {rows.map((r, i) => (
        <tr key={i}>
          <td style={{ width: '40%' }}>{r[label]}</td>
          <td><div className="bar" style={{ width: `${(Number(r[value]) / max) * 100}%` }} /></td>
          <td style={{ width: 50 }} className="rating">{r[value]}</td>
        </tr>
      ))}
    </tbody></table>
  );
}

export default function Stats() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/api/stats').then(setS).catch((e) => setError(e.message)); }, []);
  if (error) return <p className="error">{error}</p>;
  if (!s) return <p className="muted">Loading…</p>;
  const r = s.reviewStats;

  return (
    <>
      <h1>Dashboard</h1>
      <div className="grid2">
        <div className="card"><h3>Titles per genre <span className="muted small">(vw_genre_stats)</span></h3>
          <Bars rows={s.genreStats} label="Genre_Name" value="Total_Titles" /></div>
        <div className="card"><h3>Average rating per genre</h3>
          <Bars rows={s.genreStats.filter((g) => g.Avg_Rating)} label="Genre_Name" value="Avg_Rating" /></div>
        <div className="card"><h3>Titles per decade</h3><Bars rows={s.byDecade} label="Decade" value="Titles" /></div>
        <div className="card"><h3>Franchises <span className="muted small">(vw_franchise_stats)</span></h3>
          <table><thead><tr><th>Franchise</th><th>Titles</th><th>Avg</th></tr></thead><tbody>
            {s.franchiseStats.map((f) => <tr key={f.Franchise_ID}><td>{f.Franchise_Name}</td><td>{f.Total_Titles}</td><td className="rating">{f.Avg_Rating ?? '—'}</td></tr>)}
          </tbody></table></div>
        <div className="card"><h3>Actors in 2+ titles <span className="muted small">(GROUP BY / HAVING)</span></h3>
          <table><thead><tr><th>Actor</th><th>Titles</th><th>Avg rating</th></tr></thead><tbody>
            {s.topActors.map((a) => <tr key={a.Person_ID}><td><Link href={`/people/${a.Person_ID}`}>{a.Name}</Link></td><td>{a.Appearances}</td><td className="rating">{a.Avg_Rating}</td></tr>)}
          </tbody></table></div>
        <div className="card"><h3>Top action titles <span className="muted small">(sp_top_rated_by_genre)</span></h3>
          {s.topAction.map((m) => <div key={m.Movie_ID} className="row" style={{ justifyContent: 'space-between', padding: '4px 0' }}>
            <Link href={`/movies/${m.Movie_ID}`}>{m.Title}</Link><span className="rating">★ {m.Rating}</span></div>)}</div>
      </div>

      <h2>User reviews <span className="muted small">(MongoDB aggregation pipelines)</span></h2>
      <div className="grid2">
        <div className="card"><h3>Most reviewed</h3>
          <table><thead><tr><th>Title</th><th>Reviews</th><th>Avg score</th></tr></thead><tbody>
            {r.topReviewed.map((m) => <tr key={m.Movie_ID}><td><Link href={`/movies/${m.Movie_ID}`}>{m.Title}</Link></td><td>{m.reviews}</td><td className="rating">{m.avgScore}</td></tr>)}
          </tbody></table>
          <p className="muted small">{r.totalReviews} reviews in total</p></div>
        <div className="card"><h3>Score distribution ($bucket)</h3><Bars rows={r.scoreDistribution} label="range" value="count" /></div>
        <div className="card"><h3>Most active reviewers</h3>
          <table><tbody>{r.topReviewers.map((u) => <tr key={u.name}><td>{u.name}</td><td>{u.reviews} reviews</td><td className="rating">avg {u.avgScore}</td></tr>)}</tbody></table></div>
      </div>
    </>
  );
}
