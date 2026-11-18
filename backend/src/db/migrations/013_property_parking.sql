-- NULL means unverified; never assume that parking is free.
ALTER TABLE properties
ADD COLUMN parking_type ENUM ('free', 'monthly', 'one_time') NULL;
