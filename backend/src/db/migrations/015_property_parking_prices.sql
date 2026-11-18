ALTER TABLE properties MODIFY COLUMN parking_type ENUM (
  'free',
  'monthly',
  'yearly',
  'semester',
  'one_time'
) NULL,
ADD COLUMN parking_fee DECIMAL(8, 2) UNSIGNED NULL,
ADD COLUMN parking_notes TEXT NULL;
