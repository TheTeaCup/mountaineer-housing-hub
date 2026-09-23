-- Run from backend/ using the mysql client against an EMPTY database.
-- This is a one-time bootstrap, not a migration or a reset script.
SOURCE src/db/schemas/users.sql;
SOURCE src/db/schemas/auth.sql;
SOURCE src/db/schemas/agencies.sql;
SOURCE src/db/schemas/properties.sql;
SOURCE src/db/schemas/floor_plans.sql;
SOURCE src/db/schemas/reviews.sql;
