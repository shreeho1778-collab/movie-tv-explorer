-- =====================================================================
-- 03_functions_procedures.sql  :  STORED FUNCTIONS & PROCEDURES
-- Run with the mysql client or MySQL Workbench (uses DELIMITER).
-- =====================================================================
USE movie_tv_db;

DROP FUNCTION  IF EXISTS fn_person_credit_count;
DROP FUNCTION  IF EXISTS fn_movie_genres;
DROP PROCEDURE IF EXISTS sp_add_movie;
DROP PROCEDURE IF EXISTS sp_search_titles;
DROP PROCEDURE IF EXISTS sp_top_rated_by_genre;
DROP PROCEDURE IF EXISTS sp_frequent_collaborators;

DELIMITER $$

-- Total credits (acting + directing + writing) for a person
CREATE FUNCTION fn_person_credit_count(p_person_id INT)
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE total INT DEFAULT 0;
    SELECT (SELECT COUNT(*) FROM ACTS_IN     WHERE Person_ID = p_person_id)
         + (SELECT COUNT(*) FROM DIRECTED_BY WHERE Person_ID = p_person_id)
         + (SELECT COUNT(*) FROM WRITTEN_BY  WHERE Person_ID = p_person_id)
      INTO total;
    RETURN total;
END $$

-- Comma-separated genres for a title
CREATE FUNCTION fn_movie_genres(p_movie_id INT)
RETURNS VARCHAR(500)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE result VARCHAR(500);
    SELECT GROUP_CONCAT(g.Genre_Name ORDER BY g.Genre_Name SEPARATOR ', ')
      INTO result
      FROM BELONGS_TO b JOIN GENRE g ON g.Genre_ID = b.Genre_ID
     WHERE b.Movie_ID = p_movie_id;
    RETURN IFNULL(result, '');
END $$

-- Add a title with one genre and one director inside a TRANSACTION.
-- If any step fails, everything is rolled back.
CREATE PROCEDURE sp_add_movie(
    IN  p_title        VARCHAR(200),
    IN  p_release_date DATE,
    IN  p_runtime      INT,
    IN  p_type         VARCHAR(10),
    IN  p_overview     TEXT,
    IN  p_rating       DECIMAL(3,1),
    IN  p_genre_id     INT,
    IN  p_director_id  INT,
    OUT p_movie_id     INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
        INSERT INTO MOVIE_TV_SHOW (Title, Release_Date, Runtime, Type, Overview, Rating)
        VALUES (p_title, p_release_date, p_runtime, p_type, p_overview, p_rating);
        SET p_movie_id = LAST_INSERT_ID();

        IF p_genre_id IS NOT NULL THEN
            INSERT INTO BELONGS_TO (Movie_ID, Genre_ID) VALUES (p_movie_id, p_genre_id);
        END IF;

        IF p_director_id IS NOT NULL THEN
            INSERT INTO DIRECTED_BY (Movie_ID, Person_ID) VALUES (p_movie_id, p_director_id);
        END IF;
    COMMIT;
END $$

-- Full-text search over titles and overviews
CREATE PROCEDURE sp_search_titles(IN p_term VARCHAR(200))
BEGIN
    SELECT Movie_ID, Title, Type, Rating, Release_Date,
           MATCH(Title, Overview) AGAINST (p_term IN NATURAL LANGUAGE MODE) AS Relevance
      FROM MOVIE_TV_SHOW
     WHERE MATCH(Title, Overview) AGAINST (p_term IN NATURAL LANGUAGE MODE)
     ORDER BY Relevance DESC;
END $$

-- Top-rated titles for a genre
CREATE PROCEDURE sp_top_rated_by_genre(IN p_genre_name VARCHAR(50), IN p_limit INT)
BEGIN
    SELECT m.Movie_ID, m.Title, m.Type, m.Rating, m.Release_Date
      FROM MOVIE_TV_SHOW m
      JOIN BELONGS_TO b ON b.Movie_ID = m.Movie_ID
      JOIN GENRE g      ON g.Genre_ID = b.Genre_ID
     WHERE g.Genre_Name = p_genre_name
     ORDER BY m.Rating DESC
     LIMIT p_limit;
END $$

-- People who worked with a given person on 2+ titles (in any role)
CREATE PROCEDURE sp_frequent_collaborators(IN p_person_id INT)
BEGIN
    SELECT other.Person_ID, p.Name, COUNT(DISTINCT other.Movie_ID) AS Shared_Titles
      FROM (SELECT Person_ID, Movie_ID FROM ACTS_IN
            UNION SELECT Person_ID, Movie_ID FROM DIRECTED_BY
            UNION SELECT Person_ID, Movie_ID FROM WRITTEN_BY) AS other
      JOIN (SELECT Movie_ID FROM ACTS_IN     WHERE Person_ID = p_person_id
            UNION SELECT Movie_ID FROM DIRECTED_BY WHERE Person_ID = p_person_id
            UNION SELECT Movie_ID FROM WRITTEN_BY  WHERE Person_ID = p_person_id) AS mine
        ON mine.Movie_ID = other.Movie_ID
      JOIN PERSON p ON p.Person_ID = other.Person_ID
     WHERE other.Person_ID <> p_person_id
     GROUP BY other.Person_ID, p.Name
    HAVING COUNT(DISTINCT other.Movie_ID) >= 2
     ORDER BY Shared_Titles DESC, p.Name;
END $$

DELIMITER ;
