-- Better Auth 1.7 schema matching auth/policy.ts and the installed plugins.
-- Preserve camelCase where policy.ts does not define a field mapping.
CREATE TABLE auth_sessions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  token VARCHAR(255) COLLATE utf8mb4_bin NOT NULL UNIQUE,
  expiresAt TIMESTAMP(3) NOT NULL,
  createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  ipAddress TEXT NULL,
  userAgent TEXT NULL,
  INDEX idx_auth_session_user (userId),
  CONSTRAINT fk_session_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE auth_accounts (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  accountId VARCHAR(255) COLLATE utf8mb4_bin NOT NULL,
  providerId VARCHAR(255) COLLATE utf8mb4_bin NOT NULL,
  accessToken TEXT NULL,
  refreshToken TEXT NULL,
  idToken TEXT NULL,
  accessTokenExpiresAt TIMESTAMP(3) NULL,
  refreshTokenExpiresAt TIMESTAMP(3) NULL,
  scope TEXT NULL,
  password TEXT NULL,
  createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_auth_provider_account (providerId, accountId),
  INDEX idx_auth_account_user (userId),
  CONSTRAINT fk_account_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Required even for Google-only login: OAuth state/PKCE and the configured
-- oneTimeToken plugin use this table. It is not just for verifying emails.
CREATE TABLE verification (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(255) COLLATE utf8mb4_bin NOT NULL,
  value TEXT COLLATE utf8mb4_bin NOT NULL,
  expiresAt TIMESTAMP(3) NOT NULL,
  createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_verification_identifier (identifier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE auth_rate_limits (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(255) COLLATE utf8mb4_bin NOT NULL UNIQUE,
  count INT NOT NULL,
  lastRequest BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
