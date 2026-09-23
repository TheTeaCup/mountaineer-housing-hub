-- A property is a community/development or a standalone rental, not a unit.
-- agency_id identifies the current manager, not necessarily the legal owner.
CREATE TABLE properties (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  agency_id INT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(191) NOT NULL UNIQUE,
  property_type ENUM('apartment_complex', 'townhome', 'house', 'duplex', 'condo', 'other') NOT NULL,
  description TEXT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255) NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Boone',
  state CHAR(2) NOT NULL DEFAULT 'NC',
  postal_code VARCHAR(10) NULL,
  latitude DECIMAL(9,6) NULL,
  longitude DECIMAL(9,6) NULL,
  website_url VARCHAR(2048) NULL,
  phone VARCHAR(32) NULL,
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  source_url VARCHAR(2048) NULL,
  last_verified_at DATE NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_property_agency (agency_id),
  INDEX idx_property_search (status, city, property_type),
  CONSTRAINT fk_property_agency FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE RESTRICT,
  CONSTRAINT chk_property_name CHECK (CHAR_LENGTH(TRIM(name)) > 0),
  CONSTRAINT chk_property_slug CHECK (CHAR_LENGTH(TRIM(slug)) > 0),
  CONSTRAINT chk_property_address CHECK (CHAR_LENGTH(TRIM(address_line1)) > 0),
  CONSTRAINT chk_property_coordinates CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude IS NOT NULL AND longitude IS NOT NULL AND
     latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE property_photos (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  image_url VARCHAR(2048) NOT NULL,
  alt_text VARCHAR(255) NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_property_photo_order (property_id, sort_order),
  CONSTRAINT fk_photo_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
