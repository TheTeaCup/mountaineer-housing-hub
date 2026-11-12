CREATE TABLE IF NOT EXISTS property_daily_views (
  property_id INT NOT NULL,
  view_date DATE NOT NULL,
  views BIGINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (property_id, view_date),
  CONSTRAINT fk_daily_views_property FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE
) ENGINE = InnoDB;
