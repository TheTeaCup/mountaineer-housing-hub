CREATE TABLE IF NOT EXISTS external_accounts (
  user_id INT NOT NULL PRIMARY KEY,
  invite_hash CHAR(64) COLLATE utf8mb4_bin NULL UNIQUE,
  invite_expires_at TIMESTAMP(3) NULL,
  activated_at TIMESTAMP(3) NULL,
  created_by INT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_external_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_external_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agency_editors (
  user_id INT NOT NULL,
  agency_id INT NOT NULL,
  assigned_by INT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, agency_id),
  KEY idx_agency_editors_agency (agency_id),
  CONSTRAINT fk_agency_editor_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_agency_editor_agency FOREIGN KEY (agency_id) REFERENCES agencies (id) ON DELETE CASCADE,
  CONSTRAINT fk_agency_editor_assigner FOREIGN KEY (assigned_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
