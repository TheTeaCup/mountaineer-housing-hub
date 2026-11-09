-- Record explicit agreement before accepting user submissions.
CREATE TABLE IF NOT EXISTS user_legal_acceptances (
  user_id INT NOT NULL,
  terms_version VARCHAR(32) NOT NULL,
  privacy_version VARCHAR(32) NOT NULL,
  accepted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, terms_version, privacy_version),
  CONSTRAINT fk_legal_acceptance_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
