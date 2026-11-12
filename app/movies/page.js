'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import MovieTable from '@/components/MovieTable';

function MoviesInner() {
  const sp = useSearchParams();
  const [lookups, setLookups] = useState({ genres: [], franchises: [] });
  const [filters, setFilters] = useState({
    q: sp.get('q') || '', genre: sp.get('genre') || '', type: '', franchise: sp.get('franchise') || '', sort: 'rating',
  });
  const [movies, setMovies] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api('/api/lookups').then(setLookups).catch(() => {}); }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
      api(`/api/movies?${qs}`).then((d) => { setMovies(d.movies); setError(''); }).catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [filters]);

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <>
      <h1>Movies & TV shows</h1>
      <div className="row card" style={{ marginBottom: 16 }}>
        <input placeholder="Search title or plot (full-text)…" value={filters.q} onChange={set('q')} style={{ flex: 2, minWidth: 220 }} />
        <select value={filters.genre} onChange={set('genre')}>
          <option value="">All genres</option>
          {lookups.genres.map((g) => <option key={g.Genre_ID} value={g.Genre_ID}>{g.Genre_Name}</option>)}
        </select>
        <select value={filters.franchise} onChange={set('franchise')}>
          <option value="">All franchises</option>
          {lookups.franchises.map((f) => <option key={f.Franchise_ID} value={f.Franchise_ID}>{f.Franchise_Name}</option>)}
        </select>
        <select value={filters.type} onChange={set('type')}>
          <option value="">Movies + TV</option><option>Movie</option><option>TV Show</option>
        </select>
        <select value={filters.sort} onChange={set('sort')}>
          <option value="rating">Highest rated</option><option value="newest">Newest</option>
          <option value="oldest">Oldest</option><option value="title">A–Z</option>
        </select>
      </div>
      {error && <p className="error">{error}</p>}
      {movies ? <><p className="muted small">{movies.length} result(s)</p><MovieTable movies={movies} /></> : <p className="muted">Loading…</p>}
    </>
  );
}

export default function MoviesPage() {
  return <Suspense fallback={<p className="muted">Loading…</p>}><MoviesInner /></Suspense>;
}
