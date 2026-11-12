'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, year } from '@/lib/api';

export default function PersonDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [me, setMe] = useState(null);
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    api(`/api/people/${id}`).then((d) => { setData(d); setEdit({ ...d.person }); }).catch((e) => setError(e.message));
  }, [id]);
  useEffect(() => { load(); api('/api/auth/me').then((d) => setMe(d.user)); }, [load]);

  if (error && !data) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;
  const { person, roles, filmography, collaborators, totalCredits } = data;

  async function save(e) {
    e.preventDefault();
    try { await api(`/api/people/${id}`, { method: 'PUT', body: edit }); setMsg('Saved'); setError(''); load(); }
    catch (x) { setError(x.message); setMsg(''); }
  }
  async function remove() {
    if (!confirm('Delete this person and all their credits?')) return;
    try { await api(`/api/people/${id}`, { method: 'DELETE' }); router.push('/people'); } catch (x) { setError(x.message); }
  }

  return (
    <>
      <h1 style={{ marginBottom: 4 }}>{person.Name}</h1>
      <div className="muted">{person.Gender || ''}{person.Birth_Date ? ` · born ${person.Birth_Date}` : ''} · {totalCredits} credits</div>
      <div style={{ margin: '12px 0' }}>{roles.map((r) => <span key={r.RoleType_ID} className="badge gold">{r.Role_Name}</span>)}</div>
      <p>{person.Biography}</p>

      <div className="grid2">
        <div className="card">
          <h3>Filmography</h3>
          <table><thead><tr><th>Title</th><th>Year</th><th>Credit</th></tr></thead><tbody>
            {filmography.map((f, i) => (
              <tr key={i}>
                <td><Link href={`/movies/${f.Movie_ID}`}>{f.Title}</Link> <span className="muted small">{f.Type}</span></td>
                <td>{year(f.Release_Date)}</td>
                <td>{f.Credit}{f.Character_Name ? <span className="muted"> as {f.Character_Name}</span> : ''}</td>
              </tr>
            ))}
          </tbody></table>
          {!filmography.length && <p className="muted">No credits yet.</p>}
        </div>
        <div className="card">
          <h3>Frequent collaborators <span className="muted small">(2+ shared titles)</span></h3>
          {collaborators.length ? collaborators.map((c) => (
            <div key={c.Person_ID} className="row" style={{ justifyContent: 'space-between', padding: '6px 0' }}>
              <Link href={`/people/${c.Person_ID}`}>{c.Name}</Link>
              <span className="row small">{c.Shared_Titles} titles
                <Link href={`/explore?a=${person.Person_ID}&b=${c.Person_ID}`} className="muted">explore →</Link></span>
            </div>
          )) : <p className="muted">None yet.</p>}
        </div>
      </div>

      {me?.role === 'admin' && edit && (
        <form className="card" style={{ marginTop: 20, maxWidth: 520 }} onSubmit={save}>
          <h3>Admin: edit person</h3>
          <div className="field"><label>Name</label><input value={edit.Name} onChange={(e) => setEdit({ ...edit, Name: e.target.value })} /></div>
          <div className="field"><label>Birth date</label><input type="date" value={edit.Birth_Date || ''} onChange={(e) => setEdit({ ...edit, Birth_Date: e.target.value })} /></div>
          <div className="field"><label>Gender</label>
            <select value={edit.Gender || ''} onChange={(e) => setEdit({ ...edit, Gender: e.target.value })}>
              <option value="">—</option><option>Male</option><option>Female</option><option>Other</option></select></div>
          <div className="field"><label>Biography</label><textarea value={edit.Biography || ''} onChange={(e) => setEdit({ ...edit, Biography: e.target.value })} /></div>
          {msg && <p className="success">{msg}</p>}{error && <p className="error">{error}</p>}
          <div className="row"><button>Save</button><button type="button" className="danger" onClick={remove}>Delete person</button></div>
        </form>
      )}
    </>
  );
}
