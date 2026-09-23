-- One row per advertised layout. A house can have a single floor plan.
-- Prices are monthly USD; NULL means unknown, never free.
CREATE TABLE floor_plans (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  bedrooms TINYINT UNSIGNED NOT NULL,
  bathrooms DECIMAL(3,1) NOT NULL,
  square_feet INT UNSIGNED NULL,
  rent_min DECIMAL(10,2) NULL,
  rent_max DECIMAL(10,2) NULL,
  rent_basis ENUM('per_unit', 'per_bedroom') NOT NULL,
  source_url VARCHAR(2048) NULL,
  last_verified_at DATE NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_floor_plan_name (property_id, name),
  CONSTRAINT fk_floor_plan_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT chk_floor_plan_name CHECK (CHAR_LENGTH(TRIM(name)) > 0),
  CONSTRAINT chk_floor_plan_bathrooms CHECK (bathrooms > 0),
  CONSTRAINT chk_floor_plan_area CHECK (square_feet IS NULL OR square_feet > 0),
  CONSTRAINT chk_floor_plan_rent_min CHECK (rent_min IS NULL OR rent_min >= 0),
  CONSTRAINT chk_floor_plan_rent_max CHECK (rent_max IS NULL OR rent_max >= 0),
  CONSTRAINT chk_floor_plan_rent_range CHECK (rent_max IS NULL OR (rent_min IS NOT NULL AND rent_max >= rent_min))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
