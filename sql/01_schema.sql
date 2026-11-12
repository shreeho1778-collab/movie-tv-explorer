-- =====================================================================
-- Movie/TV Relationship Exploration System
-- 01_schema.sql  :  DDL (CREATE / ALTER / DROP, keys, constraints, indexes)
-- Database: MySQL 8.0+
-- Tables and attributes match the ER and Relational Schema diagrams exactly.
-- =====================================================================

DROP DATABASE IF EXISTS movie_tv_db;
CREATE DATABASE movie_tv_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE movie_tv_db;

-- ---------------------------------------------------------------------
-- ENTITY TABLES (7)
-- ---------------------------------------------------------------------

CREATE TABLE PERSON (
    Person_ID   INT          NOT NULL AUTO_INCREMENT,
    Name        VARCHAR(100) NOT NULL,
    Birth_Date  DATE,
    Gender      VARCHAR(10),
    Biography   TEXT,
    CONSTRAINT pk_person PRIMARY KEY (Person_ID),
    CONSTRAINT chk_person_gender CHECK (Gender IN ('Male', 'Female', 'Other'))
);

CREATE TABLE ROLE_TYPE (
    RoleType_ID INT         NOT NULL AUTO_INCREMENT,
    Role_Name   VARCHAR(50) NOT NULL,
    CONSTRAINT pk_role_type PRIMARY KEY (RoleType_ID),
    CONSTRAINT uq_role_name UNIQUE (Role_Name)
);

CREATE TABLE MOVIE_TV_SHOW (
    Movie_ID     INT          NOT NULL AUTO_INCREMENT,
    Title        VARCHAR(200) NOT NULL,
    Release_Date DATE,
    Runtime      INT,
    Type         VARCHAR(10)  NOT NULL,
    Overview     TEXT,
    Rating       DECIMAL(3,1),
    CONSTRAINT pk_movie PRIMARY KEY (Movie_ID),
    CONSTRAINT chk_movie_type    CHECK (Type IN ('Movie', 'TV Show')),
    CONSTRAINT chk_movie_runtime CHECK (Runtime IS NULL OR Runtime > 0),
    CONSTRAINT chk_movie_rating  CHECK (Rating IS NULL OR (Rating >= 0 AND Rating <= 10))
);

CREATE TABLE GENRE (
    Genre_ID   INT         NOT NULL AUTO_INCREMENT,
    Genre_Name VARCHAR(50) NOT NULL,
    CONSTRAINT pk_genre PRIMARY KEY (Genre_ID),
    CONSTRAINT uq_genre_name UNIQUE (Genre_Name)
);

-- CHARACTER is a MySQL keyword, so it is always written with backticks.
CREATE TABLE `CHARACTER` (
    Character_ID   INT          NOT NULL AUTO_INCREMENT,
    Character_Name VARCHAR(100) NOT NULL,
    Description    TEXT,
    CONSTRAINT pk_character PRIMARY KEY (Character_ID)
);

CREATE TABLE FRANCHISE (
    Franchise_ID   INT          NOT NULL AUTO_INCREMENT,
    Franchise_Name VARCHAR(150) NOT NULL,
    Description    TEXT,
    CONSTRAINT pk_franchise PRIMARY KEY (Franchise_ID),
    CONSTRAINT uq_franchise_name UNIQUE (Franchise_Name)
);

CREATE TABLE PRODUCTION_COMPANY (
    Company_ID   INT          NOT NULL AUTO_INCREMENT,
    Company_Name VARCHAR(150) NOT NULL,
    Country      VARCHAR(60),
    CONSTRAINT pk_company PRIMARY KEY (Company_ID),
    CONSTRAINT uq_company_name UNIQUE (Company_Name)
);

-- ---------------------------------------------------------------------
-- RELATIONSHIP TABLES (7)
-- ---------------------------------------------------------------------

CREATE TABLE WORKS_AS (
    Person_ID   INT NOT NULL,
    RoleType_ID INT NOT NULL,
    CONSTRAINT pk_works_as PRIMARY KEY (Person_ID, RoleType_ID),
    CONSTRAINT fk_works_person FOREIGN KEY (Person_ID)   REFERENCES PERSON(Person_ID)       ON DELETE CASCADE,
    CONSTRAINT fk_works_role   FOREIGN KEY (RoleType_ID) REFERENCES ROLE_TYPE(RoleType_ID)  ON DELETE CASCADE
);

CREATE TABLE ACTS_IN (
    Person_ID    INT NOT NULL,
    Movie_ID     INT NOT NULL,
    Character_ID INT,
    CONSTRAINT pk_acts_in PRIMARY KEY (Person_ID, Movie_ID),
    CONSTRAINT fk_acts_person    FOREIGN KEY (Person_ID)    REFERENCES PERSON(Person_ID)          ON DELETE CASCADE,
    CONSTRAINT fk_acts_movie     FOREIGN KEY (Movie_ID)     REFERENCES MOVIE_TV_SHOW(Movie_ID)    ON DELETE CASCADE,
    CONSTRAINT fk_acts_character FOREIGN KEY (Character_ID) REFERENCES `CHARACTER`(Character_ID)  ON DELETE SET NULL
);

CREATE TABLE BELONGS_TO (
    Movie_ID INT NOT NULL,
    Genre_ID INT NOT NULL,
    CONSTRAINT pk_belongs_to PRIMARY KEY (Movie_ID, Genre_ID),
    CONSTRAINT fk_belongs_movie FOREIGN KEY (Movie_ID) REFERENCES MOVIE_TV_SHOW(Movie_ID) ON DELETE CASCADE,
    CONSTRAINT fk_belongs_genre FOREIGN KEY (Genre_ID) REFERENCES GENRE(Genre_ID)         ON DELETE CASCADE
);

CREATE TABLE DIRECTED_BY (
    Movie_ID  INT NOT NULL,
    Person_ID INT NOT NULL,
    CONSTRAINT pk_directed_by PRIMARY KEY (Movie_ID, Person_ID),
    CONSTRAINT fk_directed_movie  FOREIGN KEY (Movie_ID)  REFERENCES MOVIE_TV_SHOW(Movie_ID) ON DELETE CASCADE,
    CONSTRAINT fk_directed_person FOREIGN KEY (Person_ID) REFERENCES PERSON(Person_ID)       ON DELETE CASCADE
);

CREATE TABLE WRITTEN_BY (
    Movie_ID  INT NOT NULL,
    Person_ID INT NOT NULL,
    CONSTRAINT pk_written_by PRIMARY KEY (Movie_ID, Person_ID),
    CONSTRAINT fk_written_movie  FOREIGN KEY (Movie_ID)  REFERENCES MOVIE_TV_SHOW(Movie_ID) ON DELETE CASCADE,
    CONSTRAINT fk_written_person FOREIGN KEY (Person_ID) REFERENCES PERSON(Person_ID)       ON DELETE CASCADE
);

CREATE TABLE PRODUCED_BY (
    Movie_ID   INT NOT NULL,
    Company_ID INT NOT NULL,
    CONSTRAINT pk_produced_by PRIMARY KEY (Movie_ID, Company_ID),
    CONSTRAINT fk_produced_movie   FOREIGN KEY (Movie_ID)   REFERENCES MOVIE_TV_SHOW(Movie_ID)        ON DELETE CASCADE,
    CONSTRAINT fk_produced_company FOREIGN KEY (Company_ID) REFERENCES PRODUCTION_COMPANY(Company_ID)  ON DELETE CASCADE
);

CREATE TABLE PART_OF (
    Movie_ID     INT NOT NULL,
    Franchise_ID INT NOT NULL,
    CONSTRAINT pk_part_of PRIMARY KEY (Movie_ID, Franchise_ID),
    CONSTRAINT fk_partof_movie     FOREIGN KEY (Movie_ID)     REFERENCES MOVIE_TV_SHOW(Movie_ID) ON DELETE CASCADE,
    CONSTRAINT fk_partof_franchise FOREIGN KEY (Franchise_ID) REFERENCES FRANCHISE(Franchise_ID) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------
CREATE INDEX idx_movie_release   ON MOVIE_TV_SHOW (Release_Date);
CREATE INDEX idx_movie_type      ON MOVIE_TV_SHOW (Type);
CREATE INDEX idx_movie_rating    ON MOVIE_TV_SHOW (Rating);
CREATE INDEX idx_person_name     ON PERSON (Name);
CREATE INDEX idx_acts_movie      ON ACTS_IN (Movie_ID);        -- reverse lookups (who acted in movie X)
CREATE INDEX idx_directed_person ON DIRECTED_BY (Person_ID);
CREATE INDEX idx_written_person  ON WRITTEN_BY (Person_ID);

-- Full-text search indexes (advanced feature)
CREATE FULLTEXT INDEX ft_movie_text  ON MOVIE_TV_SHOW (Title, Overview);
CREATE FULLTEXT INDEX ft_person_text ON PERSON (Name, Biography);

-- ---------------------------------------------------------------------
-- ALTER / DROP demonstration (run safely, schema ends unchanged)
-- ---------------------------------------------------------------------
ALTER TABLE PRODUCTION_COMPANY ADD COLUMN Temp_Note VARCHAR(50);   -- ALTER: add
ALTER TABLE PRODUCTION_COMPANY MODIFY Temp_Note VARCHAR(100);      -- ALTER: modify
ALTER TABLE PRODUCTION_COMPANY DROP COLUMN Temp_Note;              -- ALTER: drop column

CREATE TABLE TEMP_DEMO (Id INT PRIMARY KEY);                       -- DROP demo
DROP TABLE TEMP_DEMO;
