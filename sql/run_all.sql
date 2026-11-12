-- Run from the project folder:
--   mysql -u root -p < sql/run_all.sql
-- (or open each file in MySQL Workbench in this order)
SOURCE sql/01_schema.sql;
SOURCE sql/02_views.sql;
SOURCE sql/03_functions_procedures.sql;
SOURCE sql/04_triggers.sql;
SOURCE sql/05_seed.sql;
