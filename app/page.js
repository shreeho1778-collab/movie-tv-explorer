'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, year } from '@/lib/api';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [top, setTop] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/stats').then(setStats).catch((e) => setError(e.message));
    api('/api/movies?sort=rating').then((d) => setTop(d.movies.slice(0, 6))).catch(() => {});
  }, []);

  return (
    <>
      <h1>Movie/TV Relationship Exploration System</h1>
      <p className="muted">Browse films and TV shows, see who made them, and discover how actors, directors and writers are connected.</p>
      {error && <p className="error">{error}</p>}

      {stats && (
        <div className="grid" style={{ marginTop: 20 }}>
          {[['Movies', stats.counts.movies], ['TV shows', stats.counts.shows], ['People', stats.counts.people],
            ['Franchises', stats.counts.franchises], ['Genres', stats.counts.genres], ['Average rating', stats.counts.avgRating]]
            .map(([k, v]) => <div className="card" key={k}><div className="stat">{v ?? '—'}</div><div className="muted">{k}</div></div>)}
        </div>
      )}

      <h2>Top rated</h2>
      <div className="grid">
        {top.map((m) => (
          <Link key={m.Movie_ID} href={`/movies/${m.Movie_ID}`} className="card">
            <h3>{m.Title}</h3>
            <div className="muted small">{m.Type} · {year(m.Release_Date)}</div>
            <div className="small" style={{ margin: '6px 0' }}>{m.Genres}</div>
            <span className="rating">★ {m.Rating}</span>
          </Link>
        ))}
      </div>

      {stats?.franchiseStats?.length > 0 && (
        <>
          <h2>Franchises</h2>
          <div className="grid">
            {stats.franchiseStats.map((f) => (
              <Link key={f.Franchise_ID} href={`/movies?franchise=${f.Franchise_ID}`} className="card">
                <h3>{f.Franchise_Name}</h3>
                <div className="muted small">{f.Total_Titles} titles · avg ★ {f.Avg_Rating ?? '—'}</div>
                <div className="muted small">{year(f.First_Release)} – {year(f.Latest_Release)}</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
