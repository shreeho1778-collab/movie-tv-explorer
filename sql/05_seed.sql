-- =====================================================================
-- 05_seed.sql  :  SAMPLE DATA (run after 01-04)
-- WORKS_AS rows for Actor/Director/Writer are filled automatically by
-- the triggers in 04_triggers.sql; only Producer rows are inserted here.
-- =====================================================================
USE movie_tv_db;

INSERT INTO ROLE_TYPE (RoleType_ID, Role_Name) VALUES
(1,'Actor'),(2,'Director'),(3,'Writer'),(4,'Producer');

INSERT INTO GENRE (Genre_ID, Genre_Name) VALUES
(1,'Action'),(2,'Sci-Fi'),(3,'Drama'),(4,'Thriller'),
(5,'Crime'),(6,'Adventure'),(7,'Fantasy'),(8,'Horror');

INSERT INTO FRANCHISE (Franchise_ID, Franchise_Name, Description) VALUES
(1,'The Dark Knight Trilogy','Christopher Nolan''s three-film take on Batman.'),
(2,'Marvel Cinematic Universe','Shared universe of Marvel Studios superhero films and series.'),
(3,'Breaking Bad Universe','Crime dramas set in Albuquerque created by Vince Gilligan.');

INSERT INTO PRODUCTION_COMPANY (Company_ID, Company_Name, Country) VALUES
(1,'Warner Bros. Pictures','USA'),
(2,'Legendary Pictures','USA'),
(3,'Syncopy','UK'),
(4,'Paramount Pictures','USA'),
(5,'Marvel Studios','USA'),
(6,'Sony Pictures Television','USA'),
(7,'21 Laps Entertainment','USA'),
(8,'Castle Rock Entertainment','USA');

INSERT INTO MOVIE_TV_SHOW (Movie_ID, Title, Release_Date, Runtime, Type, Overview, Rating) VALUES
(1,'Inception','2010-07-16',148,'Movie','A thief who steals secrets through shared dreaming is offered a chance to erase his past by planting an idea in a target''s mind.',8.8),
(2,'Interstellar','2014-11-07',169,'Movie','With Earth failing, a former pilot joins a mission through a wormhole to find humanity a new home among distant planets.',8.7),
(3,'The Dark Knight','2008-07-18',152,'Movie','Batman faces the Joker, a criminal mastermind who pushes Gotham into chaos and tests the hero''s limits.',9.0),
(4,'Batman Begins','2005-06-15',140,'Movie','After training abroad, Bruce Wayne returns to Gotham and becomes Batman to fight corruption and fear.',8.2),
(5,'The Dark Knight Rises','2012-07-20',164,'Movie','Eight years later, Batman comes out of exile to protect Gotham from the revolutionary terrorist Bane.',8.4),
(6,'Iron Man','2008-05-02',126,'Movie','A billionaire weapons maker builds a powered armour suit to escape captivity and becomes a hero.',7.9),
(7,'The Avengers','2012-05-04',143,'Movie','Earth''s mightiest heroes must learn to fight as a team to stop an alien invasion of New York.',8.0),
(8,'Captain America: The Winter Soldier','2014-04-04',136,'Movie','Steve Rogers uncovers a conspiracy inside S.H.I.E.L.D. and faces a mysterious assassin from his past.',7.7),
(9,'Avengers: Endgame','2019-04-26',181,'Movie','The surviving Avengers attempt one last mission to reverse the devastation caused by Thanos.',8.4),
(10,'Breaking Bad','2008-01-20',49,'TV Show','A chemistry teacher with a terminal diagnosis turns to making methamphetamine to secure his family''s future.',9.5),
(11,'Better Call Saul','2015-02-08',46,'TV Show','The story of small-time lawyer Jimmy McGill and his transformation into the criminal lawyer Saul Goodman.',9.0),
(12,'Stranger Things','2016-07-15',51,'TV Show','In a small Indiana town, friends search for a missing boy and uncover secret experiments and a girl with powers.',8.7),
(13,'The Shawshank Redemption','1994-09-23',142,'Movie','A banker sentenced to life in prison forms a lasting friendship and quietly plans his freedom over two decades.',9.3);

INSERT INTO PERSON (Person_ID, Name, Birth_Date, Gender, Biography) VALUES
(1,'Christopher Nolan','1970-07-30','Male','British-American filmmaker known for complex, large-scale films.'),
(2,'Jonathan Nolan','1976-06-06','Male','Screenwriter and producer, frequent co-writer with his brother Christopher.'),
(3,'Leonardo DiCaprio','1974-11-11','Male','American actor and producer.'),
(4,'Joseph Gordon-Levitt','1981-02-17','Male','American actor and filmmaker.'),
(5,'Matthew McConaughey','1969-11-04','Male','American actor.'),
(6,'Anne Hathaway','1982-11-12','Female','American actress.'),
(7,'Christian Bale','1974-01-30','Male','English actor known for intense physical transformations.'),
(8,'Heath Ledger','1979-04-04','Male','Australian actor.'),
(9,'Michael Caine','1933-03-14','Male','English actor with a career spanning seven decades.'),
(10,'David S. Goyer','1965-12-22','Male','American screenwriter, known for superhero films.'),
(11,'Robert Downey Jr.','1965-04-04','Male','American actor.'),
(12,'Jon Favreau','1966-10-19','Male','American director, actor and producer.'),
(13,'Mark Fergus',NULL,'Male','American screenwriter.'),
(14,'Joss Whedon','1964-06-23','Male','American director and screenwriter.'),
(15,'Scarlett Johansson','1984-11-22','Female','American actress.'),
(16,'Chris Evans','1981-06-13','Male','American actor.'),
(17,'Anthony Russo','1970-02-03','Male','American director, works with his brother Joe.'),
(18,'Joe Russo','1971-07-18','Male','American director, works with his brother Anthony.'),
(19,'Christopher Markus',NULL,'Male','American screenwriter, writing partner of Stephen McFeely.'),
(20,'Stephen McFeely',NULL,'Male','American screenwriter, writing partner of Christopher Markus.'),
(21,'Vince Gilligan','1967-02-10','Male','American writer, director and producer; creator of Breaking Bad.'),
(22,'Bryan Cranston','1956-03-07','Male','American actor.'),
(23,'Aaron Paul','1979-08-27','Male','American actor.'),
(24,'Bob Odenkirk','1962-10-22','Male','American actor and comedian.'),
(25,'Peter Gould',NULL,'Male','American writer and producer, co-creator of Better Call Saul.'),
(26,'Matt Duffer','1984-02-15','Male','American filmmaker, one of the Duffer Brothers.'),
(27,'Ross Duffer','1984-02-15','Male','American filmmaker, one of the Duffer Brothers.'),
(28,'Millie Bobby Brown','2004-02-19','Female','British actress.'),
(29,'Winona Ryder','1971-10-29','Female','American actress.'),
(30,'Frank Darabont','1959-01-28','Male','American director and screenwriter.'),
(31,'Tim Robbins','1958-10-16','Male','American actor and director.'),
(32,'Morgan Freeman','1937-06-01','Male','American actor and narrator.'),
(33,'Emma Thomas','1971-12-09','Female','British film producer and co-founder of Syncopy.'),
(34,'Kevin Feige','1973-06-02','Male','American film producer and president of Marvel Studios.');

INSERT INTO `CHARACTER` (Character_ID, Character_Name, Description) VALUES
(1,'Dom Cobb','An extractor who steals secrets from dreams.'),
(2,'Arthur','Cobb''s point man and planner.'),
(3,'Cooper','Former NASA pilot turned farmer.'),
(4,'Amelia Brand','Scientist on the Endurance mission.'),
(5,'Bruce Wayne / Batman','Billionaire who fights crime in Gotham.'),
(6,'The Joker','Anarchic criminal mastermind.'),
(7,'Alfred Pennyworth','Bruce Wayne''s loyal butler.'),
(8,'Selina Kyle','Skilled cat burglar.'),
(9,'John Blake','Idealistic Gotham police officer.'),
(10,'Tony Stark / Iron Man','Genius inventor in a powered suit.'),
(11,'Natasha Romanoff / Black Widow','Former spy and S.H.I.E.L.D. agent.'),
(12,'Steve Rogers / Captain America','Super-soldier from World War II.'),
(13,'Walter White','Chemistry teacher turned drug manufacturer.'),
(14,'Jesse Pinkman','Walter''s former student and partner.'),
(15,'Saul Goodman','Flamboyant criminal lawyer.'),
(16,'Eleven','Girl with psychokinetic powers.'),
(17,'Joyce Byers','Mother searching for her missing son.'),
(18,'Andy Dufresne','Banker wrongly imprisoned for murder.'),
(19,'Ellis "Red" Redding','Long-term inmate who can get things.'),
(20,'Miles','Professor and Cobb''s father-in-law.'),
(21,'Professor Brand','NASA scientist leading the Lazarus missions.');

INSERT INTO BELONGS_TO (Movie_ID, Genre_ID) VALUES
(1,1),(1,2),(1,4),
(2,2),(2,3),(2,6),
(3,1),(3,5),(3,3),
(4,1),(4,6),
(5,1),(5,3),
(6,1),(6,2),
(7,1),(7,2),(7,6),
(8,1),(8,4),
(9,1),(9,2),(9,6),
(10,5),(10,3),(10,4),
(11,5),(11,3),
(12,3),(12,7),(12,8),
(13,3),(13,5);

INSERT INTO PART_OF (Movie_ID, Franchise_ID) VALUES
(3,1),(4,1),(5,1),
(6,2),(7,2),(8,2),(9,2),
(10,3),(11,3);

INSERT INTO PRODUCED_BY (Movie_ID, Company_ID) VALUES
(1,1),(1,2),(1,3),
(2,4),(2,1),(2,3),(2,2),
(3,1),(3,2),(3,3),
(4,1),(4,2),(4,3),
(5,1),(5,2),(5,3),
(6,5),(7,5),(8,5),(9,5),
(10,6),(11,6),
(12,7),
(13,8);

INSERT INTO DIRECTED_BY (Movie_ID, Person_ID) VALUES
(1,1),(2,1),(3,1),(4,1),(5,1),
(6,12),(7,14),(8,17),(8,18),(9,17),(9,18),
(10,21),(11,21),(12,26),(12,27),(13,30);

INSERT INTO WRITTEN_BY (Movie_ID, Person_ID) VALUES
(1,1),(2,1),(2,2),(3,1),(3,2),(4,1),(4,10),(5,1),(5,2),
(6,13),(7,14),(8,19),(8,20),(9,19),(9,20),
(10,21),(11,21),(11,25),(12,26),(12,27),(13,30);

INSERT INTO ACTS_IN (Person_ID, Movie_ID, Character_ID) VALUES
(3,1,1),(4,1,2),(9,1,20),
(5,2,3),(6,2,4),(9,2,21),
(7,3,5),(8,3,6),(9,3,7),
(7,4,5),(9,4,7),
(7,5,5),(6,5,8),(4,5,9),(9,5,7),
(11,6,10),
(11,7,10),(15,7,11),(16,7,12),
(16,8,12),(15,8,11),
(11,9,10),(16,9,12),(15,9,11),
(22,10,13),(23,10,14),(24,10,15),
(24,11,15),
(28,12,16),(29,12,17),
(31,13,18),(32,13,19);

-- Professions not covered by the triggers
INSERT INTO WORKS_AS (Person_ID, RoleType_ID) VALUES
(33,4),(34,4),(1,4),(21,4),(12,1);
