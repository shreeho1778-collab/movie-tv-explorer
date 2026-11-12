-- =====================================================================
-- 02_views.sql  :  VIEWS (advanced feature)
-- =====================================================================
USE movie_tv_db;

-- One row per title with its genres, directors, writers and franchise
CREATE OR REPLACE VIEW vw_movie_details AS
SELECT
    m.Movie_ID,
    m.Title,
    m.Release_Date,
    YEAR(m.Release_Date) AS Release_Year,
    m.Runtime,
    m.Type,
    m.Overview,
    m.Rating,
    (SELECT GROUP_CONCAT(g.Genre_Name ORDER BY g.Genre_Name SEPARATOR ', ')
       FROM BELONGS_TO b JOIN GENRE g ON g.Genre_ID = b.Genre_ID
      WHERE b.Movie_ID = m.Movie_ID)                       AS Genres,
    (SELECT GROUP_CONCAT(p.Name ORDER BY p.Name SEPARATOR ', ')
       FROM DIRECTED_BY d JOIN PERSON p ON p.Person_ID = d.Person_ID
      WHERE d.Movie_ID = m.Movie_ID)                       AS Directors,
    (SELECT GROUP_CONCAT(p.Name ORDER BY p.Name SEPARATOR ', ')
       FROM WRITTEN_BY w JOIN PERSON p ON p.Person_ID = w.Person_ID
      WHERE w.Movie_ID = m.Movie_ID)                       AS Writers,
    (SELECT GROUP_CONCAT(f.Franchise_Name SEPARATOR ', ')
       FROM PART_OF po JOIN FRANCHISE f ON f.Franchise_ID = po.Franchise_ID
      WHERE po.Movie_ID = m.Movie_ID)                      AS Franchise
FROM MOVIE_TV_SHOW m;

-- Every credit a person has: acting, directing, writing
CREATE OR REPLACE VIEW vw_person_filmography AS
SELECT a.Person_ID, p.Name, m.Movie_ID, m.Title, m.Release_Date, m.Type,
       'Actor' AS Credit, c.Character_Name
  FROM ACTS_IN a
  JOIN PERSON p        ON p.Person_ID = a.Person_ID
  JOIN MOVIE_TV_SHOW m ON m.Movie_ID  = a.Movie_ID
  LEFT JOIN `CHARACTER` c ON c.Character_ID = a.Character_ID
UNION ALL
SELECT d.Person_ID, p.Name, m.Movie_ID, m.Title, m.Release_Date, m.Type,
       'Director', NULL
  FROM DIRECTED_BY d
  JOIN PERSON p        ON p.Person_ID = d.Person_ID
  JOIN MOVIE_TV_SHOW m ON m.Movie_ID  = d.Movie_ID
UNION ALL
SELECT w.Person_ID, p.Name, m.Movie_ID, m.Title, m.Release_Date, m.Type,
       'Writer', NULL
  FROM WRITTEN_BY w
  JOIN PERSON p        ON p.Person_ID = w.Person_ID
  JOIN MOVIE_TV_SHOW m ON m.Movie_ID  = w.Movie_ID;

-- Franchise summary
CREATE OR REPLACE VIEW vw_franchise_stats AS
SELECT f.Franchise_ID, f.Franchise_Name,
       COUNT(po.Movie_ID)        AS Total_Titles,
       ROUND(AVG(m.Rating), 2)   AS Avg_Rating,
       MIN(m.Release_Date)       AS First_Release,
       MAX(m.Release_Date)       AS Latest_Release
  FROM FRANCHISE f
  LEFT JOIN PART_OF po      ON po.Franchise_ID = f.Franchise_ID
  LEFT JOIN MOVIE_TV_SHOW m ON m.Movie_ID      = po.Movie_ID
 GROUP BY f.Franchise_ID, f.Franchise_Name;

-- Actor-director collaborations (the "relationship exploration" core)
CREATE OR REPLACE VIEW vw_actor_director_pairs AS
SELECT a.Person_ID  AS Actor_ID,    pa.Name AS Actor_Name,
       d.Person_ID  AS Director_ID, pd.Name AS Director_Name,
       COUNT(*)     AS Films_Together,
       GROUP_CONCAT(m.Title ORDER BY m.Release_Date SEPARATOR ', ') AS Titles
  FROM ACTS_IN a
  JOIN DIRECTED_BY d   ON d.Movie_ID  = a.Movie_ID
  JOIN PERSON pa       ON pa.Person_ID = a.Person_ID
  JOIN PERSON pd       ON pd.Person_ID = d.Person_ID
  JOIN MOVIE_TV_SHOW m ON m.Movie_ID  = a.Movie_ID
 WHERE a.Person_ID <> d.Person_ID
 GROUP BY a.Person_ID, pa.Name, d.Person_ID, pd.Name;

-- Genre summary
CREATE OR REPLACE VIEW vw_genre_stats AS
SELECT g.Genre_ID, g.Genre_Name,
       COUNT(b.Movie_ID)       AS Total_Titles,
       ROUND(AVG(m.Rating), 2) AS Avg_Rating
  FROM GENRE g
  LEFT JOIN BELONGS_TO b    ON b.Genre_ID = g.Genre_ID
  LEFT JOIN MOVIE_TV_SHOW m ON m.Movie_ID = b.Movie_ID
 GROUP BY g.Genre_ID, g.Genre_Name;
