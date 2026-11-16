ALTER TABLE users MODIFY COLUMN role ENUM ('user', 'property_manager', 'staff') NOT NULL DEFAULT 'user';

-- Preserve existing scoped editors by assigning them the explicit manager role.
UPDATE users u
SET
  u.role = 'property_manager'
WHERE
  u.role = 'user'
  AND (
    EXISTS (
      SELECT
        1
      FROM
        property_editors pe
      WHERE
        pe.user_id = u.id
    )
    OR EXISTS (
      SELECT
        1
      FROM
        agency_editors ae
      WHERE
        ae.user_id = u.id
    )
  );
