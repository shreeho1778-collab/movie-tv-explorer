import pool, { query } from '@/lib/db';
import { json, dbError } from '@/lib/auth';
import { getDb } from '@/lib/mongo';

export const dynamic = 'force-dynamic';

// GET /api/stats – dashboard numbers from MySQL views + MongoDB aggregation
export async function GET() {
  try {
    const [[counts], genreStats, franchiseStats, pairs, topActors, byDecade] = await Promise.all([
      query(`SELECT (SELECT COUNT(*) FROM MOVIE_TV_SHOW WHERE Type = 'Movie')   AS movies,
                    (SELECT COUNT(*) FROM MOVIE_TV_SHOW WHERE Type = 'TV Show') AS shows,
                    (SELECT COUNT(*) FROM PERSON)    AS people,
                    (SELECT COUNT(*) FROM FRANCHISE) AS franchises,
                    (SELECT COUNT(*) FROM GENRE)     AS genres,
                    (SELECT ROUND(AVG(Rating), 2) FROM MOVIE_TV_SHOW) AS avgRating`),
      query('SELECT * FROM vw_genre_stats ORDER BY Total_Titles DESC, Genre_Name'),
      query('SELECT * FROM vw_franchise_stats ORDER BY Total_Titles DESC'),
      query('SELECT * FROM vw_actor_director_pairs WHERE Films_Together >= 2 ORDER BY Films_Together DESC, Actor_Name'),
      query(`SELECT p.Person_ID, p.Name, COUNT(*) AS Appearances, ROUND(AVG(m.Rating), 2) AS Avg_Rating
               FROM ACTS_IN a JOIN PERSON p ON p.Person_ID = a.Person_ID
               JOIN MOVIE_TV_SHOW m ON m.Movie_ID = a.Movie_ID
              GROUP BY p.Person_ID, p.Name
             HAVING COUNT(*) >= 2
              ORDER BY Appearances DESC, Avg_Rating DESC`),
      query(`SELECT CONCAT(FLOOR(YEAR(Release_Date) / 10) * 10, 's') AS Decade, COUNT(*) AS Titles
               FROM MOVIE_TV_SHOW WHERE Release_Date IS NOT NULL
              GROUP BY Decade ORDER BY Decade`),
    ]);
    const [topAction] = await pool.query('CALL sp_top_rated_by_genre(?, ?)', ['Action', 5]);

    // MongoDB aggregation pipelines over user reviews
    let reviewStats = { topReviewed: [], scoreDistribution: [], topReviewers: [], totalReviews: 0 };
    try {
      const db = await getDb();
      const [topReviewed, scoreDistribution, topReviewers, totalReviews] = await Promise.all([
        db.collection('reviews').aggregate([
          { $group: { _id: '$movieId', avgScore: { $avg: '$score' }, reviews: { $sum: 1 } } },
          { $sort: { reviews: -1, avgScore: -1 } },
          { $limit: 5 },
        ]).toArray(),
        db.collection('reviews').aggregate([
          { $bucket: { groupBy: '$score', boundaries: [1, 4, 7, 9, 11], default: 'other',
                       output: { count: { $sum: 1 } } } },
        ]).toArray(),
        db.collection('reviews').aggregate([
          { $group: { _id: '$userName', reviews: { $sum: 1 }, avgScore: { $avg: '$score' } } },
          { $sort: { reviews: -1 } },
          { $limit: 5 },
        ]).toArray(),
        db.collection('reviews').countDocuments(),
      ]);
      // attach titles from MySQL to the MongoDB results
      const ids = topReviewed.map((r) => r._id);
      const titles = ids.length ? await query('SELECT Movie_ID, Title FROM MOVIE_TV_SHOW WHERE Movie_ID IN (?)', [ids]) : [];
      const t = Object.fromEntries(titles.map((x) => [x.Movie_ID, x.Title]));
      const labels = { 1: '1-3', 4: '4-6', 7: '7-8', 9: '9-10' };
      reviewStats = {
        totalReviews,
        topReviewed: topReviewed.map((r) => ({ Movie_ID: r._id, Title: t[r._id] || `#${r._id}`, reviews: r.reviews, avgScore: Math.round(r.avgScore * 10) / 10 })),
        scoreDistribution: scoreDistribution.map((b) => ({ range: labels[b._id] || b._id, count: b.count })),
        topReviewers: topReviewers.map((r) => ({ name: r._id, reviews: r.reviews, avgScore: Math.round(r.avgScore * 10) / 10 })),
      };
    } catch (e) {
      console.error('MongoDB stats unavailable', e.message);
    }

    return json({ counts, genreStats, franchiseStats, pairs, topActors, byDecade, topAction: topAction[0] || [], reviewStats });
  } catch (e) {
    return dbError(e);
  }
}
