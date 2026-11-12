'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, year } from '@/lib/api';

export default function MovieDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState({ reviews: [], avgScore: null, count: 0 });
  const [me, setMe] = useState(null);
  const [inList, setInList] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    api(`/api/movies/${id}`).then(setData).catch((e) => setError(e.message));
    api(`/api/movies/${id}/reviews`).then(setReviews).catch(() => {});
  }, [id]);

  useEffect(() => {
    load();
    api('/api/auth/me').then((d) => {
      setMe(d.user);
      if (d.user) api('/api/watchlist').then((w) => setInList(w.ids.includes(Number(id)))).catch(() => {});
    });
  }, [id, load]);

  async function toggleWatchlist() {
    try {
      if (inList) await api(`/api/watchlist?movieId=${id}`, { method: 'DELETE' });
      else await api('/api/watchlist', { method: 'POST', body: { movieId: Number(id) } });
      setInList(!inList);
    } catch (e) { setError(e.message); }
  }

  if (error && !data) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;
  const { movie, cast, directors, writers, genres, companies, franchises, related } = data;
  const isAdmin = me?.role === 'admin';

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>{movie.Title}</h1>
          <div className="muted">{movie.Type} · {year(movie.Release_Date)} · {movie.Runtime ? `${movie.Runtime} min${movie.Type === 'TV Show' ? ' / episode' : ''}` : '—'}</div>
        </div>
        <div className="row">
          <span className="rating" style={{ fontSize: 24 }}>★ {movie.Rating ?? '—'}</span>
          {reviews.avgScore !== null && <span className="muted small">Users: {reviews.avgScore}/10 ({reviews.count})</span>}
          {me && <button className="secondary" onClick={toggleWatchlist}>{inList ? '✓ In watchlist' : '+ Watchlist'}</button>}
        </div>
      </div>

      <div style={{ margin: '14px 0' }}>
        {genres.map((g) => <Link key={g.Genre_ID} href={`/movies?genre=${g.Genre_ID}`} className="badge">{g.Genre_Name}</Link>)}
        {franchises.map((f) => <Link key={f.Franchise_ID} href={`/movies?franchise=${f.Franchise_ID}`} className="badge gold">{f.Franchise_Name}</Link>)}
      </div>
      <p>{movie.Overview}</p>
      {msg && <p className="success">{msg}</p>}
      {error && <p className="error">{error}</p>}

      <div className="grid2">
        <div className="card">
          <h3>Cast</h3>
          {cast.length ? (
            <table><tbody>
              {cast.map((c) => (
                <tr key={c.Person_ID}>
                  <td><Link href={`/people/${c.Person_ID}`}>{c.Name}</Link></td>
                  <td className="muted">{c.Character_Name || '—'}</td>
                  {isAdmin && <td><button className="link" onClick={() => removeCast(c.Person_ID)}>remove</button></td>}
                </tr>
              ))}
            </tbody></table>
          ) : <p className="muted">No cast recorded.</p>}
        </div>
        <div className="card">
          <h3>Crew</h3>
          <CrewList label="Directed by" kind="director" items={directors} isAdmin={isAdmin} onRemove={removeLink} />
          <CrewList label="Written by" kind="writer" items={writers} isAdmin={isAdmin} onRemove={removeLink} />
          <h3 style={{ marginTop: 14 }}>Produced by</h3>
          {companies.length ? companies.map((c) => (
            <div key={c.Company_ID} className="small">{c.Company_Name} <span className="muted">({c.Country || '—'})</span>
              {isAdmin && <> <button className="link" onClick={() => removeLink('company', c.Company_ID)}>remove</button></>}
            </div>
          )) : <p className="muted small">—</p>}
        </div>
      </div>

      {related.length > 0 && (
        <>
          <h2>More from the franchise</h2>
          <div className="row">
            {related.map((r) => <Link key={r.Movie_ID} href={`/movies/${r.Movie_ID}`} className="card small">{r.Title} ({year(r.Release_Date)}) <span className="rating">★ {r.Rating}</span></Link>)}
          </div>
        </>
      )}

      {isAdmin && <AdminPanel movie={movie} id={id} reload={load} setMsg={setMsg} setError={setError} router={router} />}

      <h2>User reviews <span className="muted small">(stored in MongoDB)</span></h2>
      {me ? <ReviewForm id={id} onDone={load} /> : <p className="muted"><Link href={`/login?next=/movies/${id}`}>Log in</Link> to write a review.</p>}
      {reviews.reviews.map((r) => <Review key={r.id} r={r} onDelete={async () => { await api(`/api/reviews/${r.id}`, { method: 'DELETE' }); load(); }} />)}
      {!reviews.reviews.length && <p className="muted">No reviews yet.</p>}
    </>
  );

  async function removeCast(personId) {
    try { await api(`/api/movies/${id}/cast?personId=${personId}`, { method: 'DELETE' }); load(); } catch (e) { setError(e.message); }
  }
  async function removeLink(kind, refId) {
    try { await api(`/api/movies/${id}/crew?kind=${kind}&refId=${refId}`, { method: 'DELETE' }); load(); } catch (e) { setError(e.message); }
  }
}

function CrewList({ label, kind, items, isAdmin, onRemove }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span className="muted small">{label}: </span>
      {items.length ? items.map((p, i) => (
        <span key={p.Person_ID}>
          {i > 0 && ', '}<Link href={`/people/${p.Person_ID}`}>{p.Name}</Link>
          {isAdmin && <> <button className="link" onClick={() => onRemove(kind, p.Person_ID)}>×</button></>}
        </span>
      )) : '—'}
    </div>
  );
}

function Review({ r, onDelete }) {
  const [show, setShow] = useState(!r.spoiler);
  return (
    <div className="review">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <b>{r.userName} <span className="rating">{r.score}/10</span></b>
        <span className="muted small">{new Date(r.createdAt).toLocaleDateString()}
          {r.canDelete && <> · <button className="link" onClick={onDelete}>delete</button></>}</span>
      </div>
      {show ? <p style={{ margin: '6px 0' }}>{r.text}</p> : <button className="link" onClick={() => setShow(true)}>Contains spoilers – click to show</button>}
      {r.tags.map((t) => <span key={t} className="badge">#{t}</span>)}
    </div>
  );
}

function ReviewForm({ id, onDone }) {
  const [f, setF] = useState({ score: 8, text: '', tags: '', spoiler: false });
  const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault();
    try {
      await api(`/api/movies/${id}/reviews`, { method: 'POST', body: f });
      setF({ score: 8, text: '', tags: '', spoiler: false }); setErr(''); onDone();
    } catch (x) { setErr(x.message); }
  }
  return (
    <form className="card" onSubmit={submit} style={{ marginBottom: 12 }}>
      <div className="row">
        <label style={{ margin: 0 }}>Score</label>
        <select value={f.score} onChange={(e) => setF({ ...f, score: Number(e.target.value) })}>
          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => <option key={n}>{n}</option>)}
        </select>
        <input placeholder="tags, comma separated" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} style={{ flex: 1 }} />
        <label style={{ margin: 0 }}><input type="checkbox" checked={f.spoiler} onChange={(e) => setF({ ...f, spoiler: e.target.checked })} /> spoiler</label>
      </div>
      <textarea placeholder="Your review…" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} style={{ marginTop: 10 }} />
      {err && <p className="error">{err}</p>}
      <button style={{ marginTop: 8 }}>Post review</button>
    </form>
  );
}

function AdminPanel({ movie, id, reload, setMsg, setError, router }) {
  const [lk, setLk] = useState(null);
  const [edit, setEdit] = useState({ ...movie });
  const [cast, setCast] = useState({ personId: '', characterId: '', newCharacterName: '' });
  const [link, setLink] = useState({ kind: 'director', refId: '' });

  useEffect(() => { api('/api/lookups').then(setLk); }, []);
  useEffect(() => { setEdit({ ...movie }); }, [movie]);
  if (!lk) return null;

  const run = async (fn, ok) => {
    try { await fn(); setMsg(ok); setError(''); reload(); api('/api/lookups').then(setLk); }
    catch (e) { setError(e.message); setMsg(''); }
  };
  const options = {
    director: lk.people.map((p) => [p.Person_ID, p.Name]), writer: lk.people.map((p) => [p.Person_ID, p.Name]),
    genre: lk.genres.map((g) => [g.Genre_ID, g.Genre_Name]), company: lk.companies.map((c) => [c.Company_ID, c.Company_Name]),
    franchise: lk.franchises.map((f) => [f.Franchise_ID, f.Franchise_Name]),
  };

  return (
    <>
      <h2>Admin: manage this title</h2>
      <div className="grid2">
        <form className="card" onSubmit={(e) => { e.preventDefault(); run(() => api(`/api/movies/${id}`, { method: 'PUT', body: edit }), 'Title updated'); }}>
          <h3>Edit details</h3>
          {['Title', 'Release_Date', 'Runtime', 'Rating'].map((k) => (
            <div className="field" key={k}><label>{k.replace('_', ' ')}</label>
              <input type={k === 'Release_Date' ? 'date' : k === 'Title' ? 'text' : 'number'} step={k === 'Rating' ? '0.1' : undefined}
                value={edit[k] ?? ''} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></div>
          ))}
          <div className="field"><label>Type</label>
            <select value={edit.Type} onChange={(e) => setEdit({ ...edit, Type: e.target.value })}><option>Movie</option><option>TV Show</option></select></div>
          <div className="field"><label>Overview</label><textarea value={edit.Overview ?? ''} onChange={(e) => setEdit({ ...edit, Overview: e.target.value })} /></div>
          <div className="row">
            <button>Save</button>
            <button type="button" className="danger" onClick={() => {
              if (confirm('Delete this title and all its links?'))
                api(`/api/movies/${id}`, { method: 'DELETE' }).then(() => router.push('/movies')).catch((e) => setError(e.message));
            }}>Delete title</button>
          </div>
        </form>

        <div>
          <form className="card" style={{ marginBottom: 16 }} onSubmit={(e) => { e.preventDefault(); run(() => api(`/api/movies/${id}/cast`, { method: 'POST', body: cast }), 'Cast member added'); }}>
            <h3>Add cast member</h3>
            <div className="field"><label>Actor</label>
              <select value={cast.personId} onChange={(e) => setCast({ ...cast, personId: e.target.value })}>
                <option value="">Select…</option>{lk.people.map((p) => <option key={p.Person_ID} value={p.Person_ID}>{p.Name}</option>)}
              </select></div>
            <div className="field"><label>Existing character</label>
              <select value={cast.characterId} onChange={(e) => setCast({ ...cast, characterId: e.target.value })}>
                <option value="">— none / new —</option>{lk.characters.map((c) => <option key={c.Character_ID} value={c.Character_ID}>{c.Character_Name}</option>)}
              </select></div>
            <div className="field"><label>…or new character name</label>
              <input value={cast.newCharacterName} onChange={(e) => setCast({ ...cast, newCharacterName: e.target.value })} /></div>
            <button>Add to cast</button>
          </form>

          <form className="card" onSubmit={(e) => { e.preventDefault(); run(() => api(`/api/movies/${id}/crew`, { method: 'POST', body: link }), 'Link added'); }}>
            <h3>Add director / writer / genre / company / franchise</h3>
            <div className="row">
              <select value={link.kind} onChange={(e) => setLink({ kind: e.target.value, refId: '' })}>
                {Object.keys(options).map((k) => <option key={k}>{k}</option>)}
              </select>
              <select value={link.refId} onChange={(e) => setLink({ ...link, refId: e.target.value })} style={{ flex: 1 }}>
                <option value="">Select…</option>{options[link.kind].map(([v, n]) => <option key={v} value={v}>{n}</option>)}
              </select>
              <button>Add</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
