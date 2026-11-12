-- =====================================================================
-- 06_queries.sql  :  DEMO QUERIES for the viva / demonstration
-- DML (INSERT, UPDATE, DELETE, SELECT), JOIN, GROUP BY, HAVING,
-- ORDER BY, aggregates, subqueries, views, procedures, functions,
-- transactions, full-text search, trigger tests.
-- =====================================================================
USE movie_tv_db;

-- ---------- 1. Basic DML ----------
INSERT INTO GENRE (Genre_Name) VALUES ('Mystery');
UPDATE GENRE SET Genre_Name = 'Mystery & Suspense' WHERE Genre_Name = 'Mystery';
SELECT * FROM GENRE ORDER BY Genre_ID;
DELETE FROM GENRE WHERE Genre_Name = 'Mystery & Suspense';

-- ---------- 2. JOINs ----------
-- Full cast of The Dark Knight with characters
SELECT p.Name AS Actor, c.Character_Name AS `Character`
  FROM ACTS_IN a
  JOIN PERSON p             ON p.Person_ID    = a.Person_ID
  JOIN MOVIE_TV_SHOW m      ON m.Movie_ID     = a.Movie_ID
  LEFT JOIN `CHARACTER` c   ON c.Character_ID = a.Character_ID
 WHERE m.Title = 'The Dark Knight';

-- Every title with its directors and production companies
SELECT m.Title, GROUP_CONCAT(DISTINCT p.Name) AS Directors,
       GROUP_CONCAT(DISTINCT pc.Company_Name) AS Companies
  FROM MOVIE_TV_SHOW m
  LEFT JOIN DIRECTED_BY d         ON d.Movie_ID   = m.Movie_ID
  LEFT JOIN PERSON p              ON p.Person_ID  = d.Person_ID
  LEFT JOIN PRODUCED_BY pb        ON pb.Movie_ID  = m.Movie_ID
  LEFT JOIN PRODUCTION_COMPANY pc ON pc.Company_ID = pb.Company_ID
 GROUP BY m.Movie_ID, m.Title
 ORDER BY m.Title;

-- ---------- 3. GROUP BY / HAVING / aggregates ----------
-- Genres with at least 3 titles, best average rating first
SELECT g.Genre_Name, COUNT(*) AS Titles, ROUND(AVG(m.Rating),2) AS Avg_Rating, MAX(m.Rating) AS Best
  FROM GENRE g
  JOIN BELONGS_TO b    ON b.Genre_ID = g.Genre_ID
  JOIN MOVIE_TV_SHOW m ON m.Movie_ID = b.Movie_ID
 GROUP BY g.Genre_Name
HAVING COUNT(*) >= 3
 ORDER BY Avg_Rating DESC;

-- Actors who appear in more than one title
SELECT p.Name, COUNT(*) AS Appearances
  FROM ACTS_IN a JOIN PERSON p ON p.Person_ID = a.Person_ID
 GROUP BY p.Person_ID, p.Name
HAVING COUNT(*) > 1
 ORDER BY Appearances DESC;

-- Production companies by number of titles and total runtime
SELECT pc.Company_Name, pc.Country, COUNT(*) AS Titles, SUM(m.Runtime) AS Total_Minutes
  FROM PRODUCTION_COMPANY pc
  JOIN PRODUCED_BY pb  ON pb.Company_ID = pc.Company_ID
  JOIN MOVIE_TV_SHOW m ON m.Movie_ID    = pb.Movie_ID
 GROUP BY pc.Company_ID, pc.Company_Name, pc.Country
 ORDER BY Titles DESC;

-- ---------- 4. Subqueries ----------
-- Titles rated above the overall average
SELECT Title, Rating FROM MOVIE_TV_SHOW
 WHERE Rating > (SELECT AVG(Rating) FROM MOVIE_TV_SHOW)
 ORDER BY Rating DESC;

-- People who both directed and wrote the same title
SELECT DISTINCT p.Name
  FROM PERSON p
 WHERE EXISTS (SELECT 1 FROM DIRECTED_BY d JOIN WRITTEN_BY w
                 ON w.Movie_ID = d.Movie_ID AND w.Person_ID = d.Person_ID
                WHERE d.Person_ID = p.Person_ID);

-- Actors who have never appeared in a franchise title
SELECT p.Name FROM PERSON p
 WHERE p.Person_ID IN (SELECT Person_ID FROM ACTS_IN)
   AND p.Person_ID NOT IN (SELECT a.Person_ID FROM ACTS_IN a JOIN PART_OF po ON po.Movie_ID = a.Movie_ID);

-- Highest-rated title in each franchise (correlated subquery)
SELECT f.Franchise_Name, m.Title, m.Rating
  FROM FRANCHISE f
  JOIN PART_OF po      ON po.Franchise_ID = f.Franchise_ID
  JOIN MOVIE_TV_SHOW m ON m.Movie_ID      = po.Movie_ID
 WHERE m.Rating = (SELECT MAX(m2.Rating) FROM PART_OF po2
                     JOIN MOVIE_TV_SHOW m2 ON m2.Movie_ID = po2.Movie_ID
                    WHERE po2.Franchise_ID = f.Franchise_ID);

-- ---------- 5. Views ----------
SELECT * FROM vw_movie_details ORDER BY Rating DESC;
SELECT * FROM vw_person_filmography WHERE Name = 'Michael Caine';
SELECT * FROM vw_franchise_stats;
SELECT * FROM vw_actor_director_pairs WHERE Films_Together >= 2 ORDER BY Films_Together DESC;

-- ---------- 6. Functions & procedures ----------
SELECT Name, fn_person_credit_count(Person_ID) AS Credits FROM PERSON ORDER BY Credits DESC LIMIT 5;
SELECT Title, fn_movie_genres(Movie_ID) AS Genres FROM MOVIE_TV_SHOW;
CALL sp_top_rated_by_genre('Action', 3);
CALL sp_frequent_collaborators(1);          -- Christopher Nolan
CALL sp_search_titles('dream thief');       -- full-text search

-- ---------- 7. Transaction (commit) via stored procedure ----------
CALL sp_add_movie('Oppenheimer','2023-07-21',180,'Movie',
     'The story of the physicist who led the project to build the first atomic bomb.',8.3, 3, 1, @new_id);
SELECT @new_id, Title FROM MOVIE_TV_SHOW WHERE Movie_ID = @new_id;
SELECT * FROM WORKS_AS WHERE Person_ID = 1;           -- trigger kept Director role

-- ---------- 8. Transaction (rollback) ----------
START TRANSACTION;
    UPDATE MOVIE_TV_SHOW SET Rating = 1.0 WHERE Title = 'Inception';
    SELECT Title, Rating FROM MOVIE_TV_SHOW WHERE Title = 'Inception';   -- shows 1.0
ROLLBACK;
SELECT Title, Rating FROM MOVIE_TV_SHOW WHERE Title = 'Inception';       -- back to 8.8

-- ---------- 9. Constraint & trigger tests (each should FAIL) ----------
-- INSERT INTO MOVIE_TV_SHOW (Title, Type, Rating) VALUES ('Bad', 'Movie', 11);      -- CHECK rating
-- INSERT INTO MOVIE_TV_SHOW (Title, Type) VALUES ('Bad', 'Podcast');                -- CHECK type
-- INSERT INTO MOVIE_TV_SHOW (Title, Type) VALUES ('   ', 'Movie');                  -- trigger: empty title
-- INSERT INTO PERSON (Name, Birth_Date) VALUES ('Future Guy', '2999-01-01');        -- trigger: future birth date
-- INSERT INTO ACTS_IN (Person_ID, Movie_ID) VALUES (999, 1);                        -- FK violation
-- INSERT INTO GENRE (Genre_Name) VALUES ('Action');                                 -- UNIQUE violation

-- Clean-up of demo insert
DELETE FROM MOVIE_TV_SHOW WHERE Title = 'Oppenheimer';
