'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const multi = (e) => [...e.target.selectedOptions].map((o) => Number(o.value));

export default function Admin() {
  const [tab, setTab] = useState('title');
  const [lk, setLk] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const reload = () => api('/api/lookups').then(setLk).catch((e) => setError(e.message));
  useEffect(() => { reload(); }, []);

  async function run(fn, ok) {
    try { const r = await fn(); setMsg(typeof ok === 'function' ? ok(r) : ok); setError(''); reload(); return true; }
    catch (e) { setError(e.message); setMsg(''); return false; }
  }

  return (
    <>
      <h1>Admin panel</h1>
      <p className="muted small">To edit or delete a title or person, open its page – admin controls appear at the bottom.</p>
      <div className="tabs">
        {[['title', 'Add title'], ['person', 'Add person'], ['lookups', 'Genres, franchises, companies…'], ['activity', 'Activity log']].map(([k, l]) => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => { setTab(k); setMsg(''); setError(''); }}>{l}</button>
        ))}
      </div>
      {msg && <p className="success">{msg}</p>}
      {error && <p className="error">{error}</p>}
      {!lk ? <p className="muted">Loading…</p> : (
        <>
          {tab === 'title' && <AddTitle lk={lk} run={run} />}
          {tab === 'person' && <AddPerson lk={lk} run={run} />}
          {tab === 'lookups' && <Lookups lk={lk} run={run} />}
          {tab === 'activity' && <Activity />}
        </>
      )}
    </>
  );
}

function AddTitle({ lk, run }) {
  const blank = { Title: '', Release_Date: '', Runtime: '', Type: 'Movie', Overview: '', Rating: '',
    genreIds: [], directorIds: [], writerIds: [], companyIds: [], franchiseIds: [] };
  const [f, setF] = useState(blank);
  const [created, setCreated] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const ok = await run(async () => { const r = await api('/api/movies', { method: 'POST', body: f }); setCreated(r.Movie_ID); return r; },
      (r) => `Title created (ID ${r.Movie_ID}) with all its links in one transaction`);
    if (ok) setF(blank);
  }
  const pickers = [
    ['Genres', 'genreIds', lk.genres.map((g) => [g.Genre_ID, g.Genre_Name])],
    ['Directors', 'directorIds', lk.people.map((p) => [p.Person_ID, p.Name])],
    ['Writers', 'writerIds', lk.people.map((p) => [p.Person_ID, p.Name])],
    ['Production companies', 'companyIds', lk.companies.map((c) => [c.Company_ID, c.Company_Name])],
    ['Franchise', 'franchiseIds', lk.franchises.map((x) => [x.Franchise_ID, x.Franchise_Name])],
  ];

  return (
    <form className="card" onSubmit={submit}>
      <div className="grid2">
        <div>
          <div className="field"><label>Title *</label><input value={f.Title} onChange={set('Title')} required /></div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}><label>Type *</label>
              <select value={f.Type} onChange={set('Type')}><option>Movie</option><option>TV Show</option></select></div>
            <div className="field" style={{ flex: 1 }}><label>Release date</label><input type="date" value={f.Release_Date} onChange={set('Release_Date')} /></div>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}><label>Runtime (min)</label><input type="number" min="1" value={f.Runtime} onChange={set('Runtime')} /></div>
            <div className="field" style={{ flex: 1 }}><label>Rating (0–10)</label><input type="number" min="0" max="10" step="0.1" value={f.Rating} onChange={set('Rating')} /></div>
          </div>
          <div className="field"><label>Overview</label><textarea value={f.Overview} onChange={set('Overview')} /></div>
        </div>
        <div>
          {pickers.map(([label, key, opts]) => (
            <div className="field" key={key}><label>{label} <span className="small">(Ctrl/Cmd-click for several)</span></label>
              <select multiple value={f[key].map(String)} onChange={(e) => setF({ ...f, [key]: multi(e) })}>
                {opts.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
              </select></div>
          ))}
        </div>
      </div>
      <div className="row"><button>Create title</button>
        {created && <Link href={`/movies/${created}`} className="muted">Open the new title to add cast →</Link>}</div>
    </form>
  );
}

function AddPerson({ lk, run }) {
  const blank = { Name: '', Birth_Date: '', Gender: '', Biography: '', roleIds: [] };
  const [f, setF] = useState(blank);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    if (await run(() => api('/api/people', { method: 'POST', body: f }), (r) => `Person created (ID ${r.Person_ID})`)) setF(blank);
  }
  return (
    <form className="card" style={{ maxWidth: 560 }} onSubmit={submit}>
      <div className="field"><label>Name *</label><input value={f.Name} onChange={set('Name')} required /></div>
      <div className="row">
        <div className="field" style={{ flex: 1 }}><label>Birth date</label><input type="date" value={f.Birth_Date} onChange={set('Birth_Date')} /></div>
        <div className="field" style={{ flex: 1 }}><label>Gender</label>
          <select value={f.Gender} onChange={set('Gender')}><option value="">—</option><option>Male</option><option>Female</option><option>Other</option></select></div>
      </div>
      <div className="field"><label>Biography</label><textarea value={f.Biography} onChange={set('Biography')} /></div>
      <div className="field"><label>Works as (ROLE_TYPE)</label>
        <select multiple value={f.roleIds.map(String)} onChange={(e) => setF({ ...f, roleIds: multi(e) })}>
          {lk.roles.map((r) => <option key={r.RoleType_ID} value={r.RoleType_ID}>{r.Role_Name}</option>)}
        </select></div>
      <button>Create person</button>
    </form>
  );
}

function Lookups({ lk, run }) {
  const forms = [
    { kind: 'genre', title: 'Genre', fields: ['Genre_Name'], list: lk.genres.map((g) => g.Genre_Name) },
    { kind: 'franchise', title: 'Franchise', fields: ['Franchise_Name', 'Description'], list: lk.franchises.map((x) => x.Franchise_Name) },
    { kind: 'company', title: 'Production company', fields: ['Company_Name', 'Country'], list: lk.companies.map((c) => `${c.Company_Name} (${c.Country || '—'})`) },
    { kind: 'role', title: 'Role type', fields: ['Role_Name'], list: lk.roles.map((r) => r.Role_Name) },
    { kind: 'character', title: 'Character', fields: ['Character_Name', 'Description'], list: lk.characters.map((c) => c.Character_Name) },
  ];
  return <div className="grid2">{forms.map((f) => <LookupForm key={f.kind} {...f} run={run} />)}</div>;
}

function LookupForm({ kind, title, fields, list, run }) {
  const [v, setV] = useState({});
  async function submit(e) {
    e.preventDefault();
    if (await run(() => api('/api/lookups', { method: 'POST', body: { kind, ...v } }), `${title} added`)) setV({});
  }
  return (
    <form className="card" onSubmit={submit}>
      <h3>{title}</h3>
      {fields.map((k) => <div className="field" key={k}><label>{k.replace('_', ' ')}</label>
        <input value={v[k] || ''} onChange={(e) => setV({ ...v, [k]: e.target.value })} required={k === fields[0]} /></div>)}
      <button>Add</button>
      <div style={{ marginTop: 10 }}>{list.map((x) => <span key={x} className="badge">{x}</span>)}</div>
    </form>
  );
}

function Activity() {
  const [d, setD] = useState(null);
  useEffect(() => { api('/api/activity').then(setD).catch(() => setD({ logs: [], byAction: [] })); }, []);
  if (!d) return <p className="muted">Loading…</p>;
  return (
    <div className="grid2">
      <div className="card"><h3>Actions by type <span className="muted small">(MongoDB $group)</span></h3>
        {d.byAction.map((a) => <div key={a.action} className="row" style={{ justifyContent: 'space-between' }}><span>{a.action}</span><b>{a.count}</b></div>)}</div>
      <div className="card"><h3>Latest activity</h3>
        <table><tbody>{d.logs.map((l) => (
          <tr key={l.id}><td className="small muted">{new Date(l.createdAt).toLocaleString()}</td>
            <td>{l.userName}</td><td><span className="badge">{l.action}</span></td>
            <td className="small muted">{Object.entries(l.details || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}</td></tr>
        ))}</tbody></table></div>
    </div>
  );
}
