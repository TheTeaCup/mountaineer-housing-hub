-- Select the existing database in phpMyAdmin, then run this file once.
-- Do not run the empty-database bootstrap against your existing database.
ALTER TABLE users
ADD COLUMN role ENUM ('user', 'staff') NOT NULL DEFAULT 'user';

CREATE TABLE favorites (
  user_id INT NOT NULL,
  property_id INT NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, property_id),
  CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_favorite_property FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE apartment_submissions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  website VARCHAR(2048) NULL,
  information TEXT NULL,
  status ENUM ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_submission_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- After your first Google sign-in, run separately with your actual email:
-- UPDATE users SET role = 'staff'
-- WHERE email = 'YOUR_EMAIL@appstate.edu' AND email_verified = 1 AND status = 'active';
