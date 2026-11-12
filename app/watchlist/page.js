'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import MovieTable from '@/components/MovieTable';

export default function Watchlist() {
  const [movies, setMovies] = useState(null);
  const [error, setError] = useState('');
  const load = () => api('/api/watchlist').then((d) => setMovies(d.movies)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  const remove = async (id) => { await api(`/api/watchlist?movieId=${id}`, { method: 'DELETE' }); load(); };

  return (
    <>
      <h1>My watchlist</h1>
      {error && <p className="error">{error}</p>}
      {movies ? <MovieTable movies={movies} extra={(m) => <button className="link" onClick={() => remove(m.Movie_ID)}>remove</button>} />
              : <p className="muted">Loading…</p>}
    </>
  );
}
