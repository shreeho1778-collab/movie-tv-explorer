import Link from 'next/link';
import { year } from '@/lib/api';

export default function MovieTable({ movies, extra }) {
  if (!movies?.length) return <p className="muted">No titles found.</p>;
  return (
    <table>
      <thead>
        <tr><th>Title</th><th>Year</th><th>Type</th><th>Genres</th><th>Directed by</th><th>Rating</th>{extra && <th></th>}</tr>
      </thead>
      <tbody>
        {movies.map((m) => (
          <tr key={m.Movie_ID}>
            <td><Link href={`/movies/${m.Movie_ID}`}><b>{m.Title}</b></Link>
              {m.Franchise && <div className="muted small">{m.Franchise}</div>}</td>
            <td>{year(m.Release_Date)}</td>
            <td>{m.Type}</td>
            <td className="small">{m.Genres || '—'}</td>
            <td className="small">{m.Directors || '—'}</td>
            <td className="rating">{m.Rating ?? '—'}</td>
            {extra && <td>{extra(m)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
