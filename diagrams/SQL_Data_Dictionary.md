# MySQL data dictionary

The 14 catalogue tables below follow [01_schema.sql](../sql/01_schema.sql). All entity IDs are auto-incrementing, required INT primary keys. Required columns use NOT NULL. Optional columns allow NULL.

## Entity tables

| Table | Primary key | Required attributes | Optional attributes | Additional rules |
|---|---|---|---|---|
| PERSON | Person_ID | Name VARCHAR(100) | Birth_Date DATE, Gender VARCHAR(10), Biography TEXT | Gender, when given, must be Male, Female, or Other. |
| ROLE_TYPE | RoleType_ID | Role_Name VARCHAR(50) | None | Role_Name is unique. |
| MOVIE_TV_SHOW | Movie_ID | Title VARCHAR(200), Type VARCHAR(10) | Release_Date DATE, Runtime INT, Overview TEXT, Rating DECIMAL(3,1) | Type must be Movie or TV Show. Runtime must be positive and rating must be between 0 and 10 inclusive when present. |
| GENRE | Genre_ID | Genre_Name VARCHAR(50) | None | Genre_Name is unique. |
| CHARACTER | Character_ID | Character_Name VARCHAR(100) | Description TEXT | Character names may repeat. |
| FRANCHISE | Franchise_ID | Franchise_Name VARCHAR(150) | Description TEXT | Franchise_Name is unique. |
| PRODUCTION_COMPANY | Company_ID | Company_Name VARCHAR(150) | Country VARCHAR(60) | Company_Name is unique. |

## Association tables

All association columns are INT. Each composite primary key prevents duplicate pairs. Every foreign key is required and uses ON DELETE CASCADE unless marked otherwise.

| Table | Composite primary key | Foreign key references |
|---|---|---|
| WORKS_AS | Person_ID, RoleType_ID | Person_ID to PERSON.Person_ID, RoleType_ID to ROLE_TYPE.RoleType_ID |
| ACTS_IN | Person_ID, Movie_ID | Person_ID to PERSON.Person_ID, Movie_ID to MOVIE_TV_SHOW.Movie_ID, Character_ID to CHARACTER.Character_ID |
| BELONGS_TO | Movie_ID, Genre_ID | Movie_ID to MOVIE_TV_SHOW.Movie_ID, Genre_ID to GENRE.Genre_ID |
| DIRECTED_BY | Movie_ID, Person_ID | Movie_ID to MOVIE_TV_SHOW.Movie_ID, Person_ID to PERSON.Person_ID |
| WRITTEN_BY | Movie_ID, Person_ID | Movie_ID to MOVIE_TV_SHOW.Movie_ID, Person_ID to PERSON.Person_ID |
| PRODUCED_BY | Movie_ID, Company_ID | Movie_ID to MOVIE_TV_SHOW.Movie_ID, Company_ID to PRODUCTION_COMPANY.Company_ID |
| PART_OF | Movie_ID, Franchise_ID | Movie_ID to MOVIE_TV_SHOW.Movie_ID, Franchise_ID to FRANCHISE.Franchise_ID |

ACTS_IN.Character_ID allows NULL and uses ON DELETE SET NULL. Deleting the character clears the reference and keeps the cast credit. Deleting a person or title removes its associated credits through cascading foreign keys.

## Trigger rules

[04_triggers.sql](../sql/04_triggers.sql) trims titles and person names and rejects empty values on insert and update. It also rejects a supplied release date before 1888-01-01 or a supplied birth date in the future. Inserting an acting, directing, or writing credit adds the corresponding WORKS_AS entry when the Actor, Director, or Writer role type exists.
