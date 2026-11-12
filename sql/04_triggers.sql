-- =====================================================================
-- 04_triggers.sql  :  TRIGGERS (validation + keeping WORKS_AS consistent)
-- =====================================================================
USE movie_tv_db;

DROP TRIGGER IF EXISTS trg_movie_before_insert;
DROP TRIGGER IF EXISTS trg_movie_before_update;
DROP TRIGGER IF EXISTS trg_person_before_insert;
DROP TRIGGER IF EXISTS trg_person_before_update;
DROP TRIGGER IF EXISTS trg_acts_in_after_insert;
DROP TRIGGER IF EXISTS trg_directed_by_after_insert;
DROP TRIGGER IF EXISTS trg_written_by_after_insert;

DELIMITER $$

-- ---------- Data validation at database level ----------
CREATE TRIGGER trg_movie_before_insert
BEFORE INSERT ON MOVIE_TV_SHOW
FOR EACH ROW
BEGIN
    SET NEW.Title = TRIM(NEW.Title);
    IF NEW.Title = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Title cannot be empty';
    END IF;
    IF NEW.Release_Date IS NOT NULL AND NEW.Release_Date < '1888-01-01' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Release date is before the first film ever made (1888)';
    END IF;
END $$

CREATE TRIGGER trg_movie_before_update
BEFORE UPDATE ON MOVIE_TV_SHOW
FOR EACH ROW
BEGIN
    SET NEW.Title = TRIM(NEW.Title);
    IF NEW.Title = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Title cannot be empty';
    END IF;
    IF NEW.Release_Date IS NOT NULL AND NEW.Release_Date < '1888-01-01' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Release date is before the first film ever made (1888)';
    END IF;
END $$

CREATE TRIGGER trg_person_before_insert
BEFORE INSERT ON PERSON
FOR EACH ROW
BEGIN
    SET NEW.Name = TRIM(NEW.Name);
    IF NEW.Name = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Person name cannot be empty';
    END IF;
    IF NEW.Birth_Date IS NOT NULL AND NEW.Birth_Date > CURDATE() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Birth date cannot be in the future';
    END IF;
END $$

CREATE TRIGGER trg_person_before_update
BEFORE UPDATE ON PERSON
FOR EACH ROW
BEGIN
    SET NEW.Name = TRIM(NEW.Name);
    IF NEW.Name = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Person name cannot be empty';
    END IF;
    IF NEW.Birth_Date IS NOT NULL AND NEW.Birth_Date > CURDATE() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Birth date cannot be in the future';
    END IF;
END $$

-- ---------- Keep WORKS_AS in sync with credits ----------
-- Adding an acting/directing/writing credit automatically records the
-- person's profession in WORKS_AS (if that ROLE_TYPE exists).

CREATE TRIGGER trg_acts_in_after_insert
AFTER INSERT ON ACTS_IN
FOR EACH ROW
BEGIN
    DECLARE v_role INT;
    SELECT RoleType_ID INTO v_role FROM ROLE_TYPE WHERE Role_Name = 'Actor' LIMIT 1;
    IF v_role IS NOT NULL THEN
        INSERT IGNORE INTO WORKS_AS (Person_ID, RoleType_ID) VALUES (NEW.Person_ID, v_role);
    END IF;
END $$

CREATE TRIGGER trg_directed_by_after_insert
AFTER INSERT ON DIRECTED_BY
FOR EACH ROW
BEGIN
    DECLARE v_role INT;
    SELECT RoleType_ID INTO v_role FROM ROLE_TYPE WHERE Role_Name = 'Director' LIMIT 1;
    IF v_role IS NOT NULL THEN
        INSERT IGNORE INTO WORKS_AS (Person_ID, RoleType_ID) VALUES (NEW.Person_ID, v_role);
    END IF;
END $$

CREATE TRIGGER trg_written_by_after_insert
AFTER INSERT ON WRITTEN_BY
FOR EACH ROW
BEGIN
    DECLARE v_role INT;
    SELECT RoleType_ID INTO v_role FROM ROLE_TYPE WHERE Role_Name = 'Writer' LIMIT 1;
    IF v_role IS NOT NULL THEN
        INSERT IGNORE INTO WORKS_AS (Person_ID, RoleType_ID) VALUES (NEW.Person_ID, v_role);
    END IF;
END $$

DELIMITER ;
