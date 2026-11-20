# Movie/TV Relationship Exploration System

- Shree Krishna - PES1UG24CS440
- Simran Joshi - PES1UG24CS455

A web application for browsing movies and TV shows and exploring how the people behind them
(actors, directors, writers, producers) are connected.

- **SQL database:** MySQL 8: the 14-table relational schema (titles, people, credits, genres, franchises, companies)
- **NoSQL database:** MongoDB: user accounts and roles, reviews, watchlists, activity logs
- **Web app:** Next.js 14 (App Router), with API route handlers as the backend layer
- **Auth:** JWT in an httpOnly cookie, with two roles: **admin** and **user**

---

## 1. Prerequisites

Install these on **both** team members' laptops:

| Tool | Version | Link |
|---|---|---|
| Node.js | 18.18 or newer (20 LTS recommended) | https://nodejs.org |
| MySQL Server + MySQL Workbench | 8.0 or newer | https://dev.mysql.com/downloads/ |
| MongoDB Community Server + Compass | 6.0 or newer | https://www.mongodb.com/try/download/community |
| Git | any | https://git-scm.com |

(Instead of installing MongoDB locally, you can use a free MongoDB Atlas cluster and paste its connection string.)

## 2. Set up MySQL

From the project folder:

```bash
mysql -u root -p < sql/run_all.sql
```

This runs, in order:

| File | What it does |
|---|---|
| `sql/01_schema.sql` | CREATE DATABASE, the 14 tables, PK/FK/UNIQUE/CHECK constraints, indexes, FULLTEXT indexes, ALTER/DROP demo |
| `sql/02_views.sql` | 5 views |
| `sql/03_functions_procedures.sql` | 2 functions + 4 stored procedures (one uses a transaction) |
| `sql/04_triggers.sql` | 7 triggers (validation + keeping WORKS_AS in sync) |
| `sql/05_seed.sql` | sample data (13 titles, 34 people, 3 franchises, …) |

**Using MySQL Workbench instead:** open each file in the order above and run it with the ⚡ button.

`sql/06_queries.sql` holds the demo queries for the viva. Run its statements one by one during the demo.

## 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and set your MySQL password, your MongoDB URI and a long random `JWT_SECRET`.
**Never commit `.env.local`.** It is already in `.gitignore`.

## 4. Install and seed MongoDB

```bash
npm install
npm run seed:mongo
```

This configures MongoDB collection validation and indexes, then seeds two accounts and sample reviews:

| Role | Email | Password |
|---|---|---|
| admin | admin@movietv.local | Admin@123 (or whatever you set in `.env.local`) |
| user | user@movietv.local | User@123 |

New sign-ups always get the **user** role.

For an existing database, run `npm run validate:mongo` to apply or update the
validators without reseeding. The MongoDB account needs permission to create
collections and run `collMod`. The database rejects invalid inserts and updates
to users, reviews, and activity logs. Existing documents are checked when updated.

## 5. Run

```bash
npm run dev
```

Open http://localhost:3000

---

## Features

| Page | What it shows | Who |
|---|---|---|
| `/` | counts, top-rated titles, franchises | everyone |
| `/movies` | full-text search, filter by genre, franchise and type, sort | everyone |
| `/movies/[id]` | details, cast with characters, directors, writers, companies, franchise titles, reviews | everyone; reviews and watchlist need login; edit controls for admin |
| `/people`, `/people/[id]` | professions, filmography, frequent collaborators (stored procedure) | everyone; edit/delete for admin |
| `/explore` | pick two people: shared titles, and the people who link them | everyone |
| `/stats` | dashboard from SQL views, GROUP BY/HAVING, a procedure and MongoDB aggregations | everyone |
| `/watchlist` | personal watchlist (MongoDB) | logged-in users |
| `/admin` | add titles (one transaction), people, genres/franchises/companies/roles/characters; activity log | admin only |

## How the requirements are covered

| Requirement | Where |
|---|---|
| CREATE / ALTER / DROP | `01_schema.sql` |
| PK, FK, UNIQUE, CHECK, NOT NULL | `01_schema.sql` |
| Indexes and full-text search | `01_schema.sql`; used in `/api/movies` and `/api/people` (`MATCH … AGAINST`) |
| Views | `02_views.sql`; used in `/api/movies`, `/api/people/[id]`, `/api/explore`, `/api/stats` |
| Stored functions/procedures | `03_functions_procedures.sql`; `fn_person_credit_count` in `/api/people`, `sp_frequent_collaborators` in `/api/people/[id]`, `sp_top_rated_by_genre` in `/api/stats` |
| Triggers | `04_triggers.sql`; validation (empty title, release date before 1888, future birth date) and automatic WORKS_AS rows |
| Transactions | `sp_add_movie` (SQL); `transaction()` in `lib/db.js`, used when creating a title with all its links, a person with roles, and a cast member with a new character |
| INSERT / UPDATE / DELETE / SELECT, JOIN, GROUP BY, HAVING, ORDER BY, subqueries | API routes + `06_queries.sql` |
| NoSQL aggregation | `/api/stats` (`$group`, `$bucket`, `$sort`), `/api/movies/[id]/reviews` (`$avg`), `/api/activity` |
| Authentication + 2 roles | `lib/auth.js`, `middleware.js`, `/api/auth/*` |
| Validation and integrity | checks in the API (`lib/validate.js`), plus DB CHECK constraints, triggers and FKs; MySQL errors are shown in the UI |
| No hard-coded credentials | `.env.local` + `lib/db.js`, `lib/mongo.js` |

## Database choice and justification

**MySQL (relational) for the catalogue.** Titles, people, characters, genres, franchises and companies are
structured data linked by many-to-many relationships. They need referential integrity (a credit must not
point to a missing person), JOIN-heavy queries and transactions. The 14 tables are in 3NF.

**MongoDB (document) for user-generated and operational data:**

- **users**: `{ name, email, passwordHash, role, watchlist: [Movie_ID…], createdAt }`. The watchlist is an embedded array, so one read returns the whole list.
- **reviews**: `{ movieId, userId, userName, score, text, tags: [...], spoiler, createdAt }`. Reviews are free text, have optional tags and flags, and are written much more often than the catalogue changes. The schema can grow (for example likes or replies) without migrations.
- **activity_logs**: `{ userId, userName, role, action, details: {...}, createdAt }`. Append-only events whose `details` field has a different shape for each action.

MongoDB indexes:
- `users.email`: unique.
- `reviews.{movieId, userId}`: unique, so one review per user per title.
- `reviews.{movieId, createdAt}`: for listing a title's reviews in date order.
- Text index on `reviews.text` and `reviews.tags`.
- `activity_logs.createdAt`.

Cross-database integrity:
- Before a review or watchlist item is saved, the API checks in MySQL that the title exists.
- Deleting a title in MySQL also deletes its reviews and watchlist entries in MongoDB.

## Project structure

```
sql/                 MySQL scripts (run in order)
scripts/seed-mongo.mjs
lib/                 db.js (MySQL pool + transactions), mongo.js, auth.js, validate.js, api.js
middleware.js        protects /admin and /watchlist
app/api/...          backend API routes
app/...              pages (Next.js App Router)
components/          Nav, MovieTable
```

## Git workflow (both members must commit)

```bash
git init
git add .
git commit -m "Initial project"
git remote add origin https://github.com/<you>/movie-tv-explorer.git
git push -u origin main
```

Each member should commit their own parts from their own laptop. Examiners check individual contributions.

## Troubleshooting

- **`ER_ACCESS_DENIED_ERROR`**: the MySQL user or password in `.env.local` is wrong.
- **`ECONNREFUSED 27017`**: MongoDB isn't running. Start the MongoDB service, or use an Atlas URI.
- **`This function has none of DETERMINISTIC…`** when running SQL: run `SET GLOBAL log_bin_trust_function_creators = 1;` and rerun `03_functions_procedures.sql`.
- **Full-text search finds nothing for very short words**: MySQL ignores words shorter than 3 letters. The app also falls back to a `LIKE` title match.
