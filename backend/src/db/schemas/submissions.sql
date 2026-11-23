CREATE TABLE apartment_submissions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NULL,
  submission_kind ENUM ('property', 'agency') NOT NULL DEFAULT 'property',
  property_type ENUM (
    'apartment_complex',
    'townhome',
    'house',
    'duplex',
    'condo',
    'other'
  ) NULL DEFAULT NULL,
  agency_id INT NULL,
  proposed_agency_name VARCHAR(255) NULL,
  proposed_agency_website VARCHAR(2048) NULL,
  website VARCHAR(2048) NULL,
  information TEXT NULL,
  status ENUM ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_submission_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_submission_agency FOREIGN KEY (agency_id) REFERENCES agencies (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE property_correction_reports (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  user_id INT NULL,
  reported_field ENUM (
    'address',
    'contact',
    'rent',
    'floor_plan',
    'description',
    'amenities',
    'other'
  ) NOT NULL,
  details TEXT NOT NULL,
  status ENUM ('pending', 'reviewed', 'dismissed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  reviewed_at TIMESTAMP(3) NULL,
  CONSTRAINT fk_correction_property FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE,
  CONSTRAINT fk_correction_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_correction_status_created (status, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
