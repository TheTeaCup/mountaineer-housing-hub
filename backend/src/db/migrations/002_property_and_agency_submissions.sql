-- For existing databases after migration 001. Run once in phpMyAdmin.
-- No example agencies or properties are inserted.
ALTER TABLE apartment_submissions MODIFY COLUMN address VARCHAR(255) NULL,
ADD COLUMN submission_kind ENUM ('property', 'agency') NOT NULL DEFAULT 'property',
ADD COLUMN property_type ENUM (
  'apartment_complex',
  'townhome',
  'house',
  'duplex',
  'condo',
  'other'
) NULL DEFAULT NULL,
ADD COLUMN agency_id INT NULL,
ADD COLUMN proposed_agency_name VARCHAR(255) NULL,
ADD COLUMN proposed_agency_website VARCHAR(2048) NULL,
ADD CONSTRAINT fk_submission_agency FOREIGN KEY (agency_id) REFERENCES agencies (id) ON DELETE SET NULL;
