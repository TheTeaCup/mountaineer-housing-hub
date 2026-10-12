-- Remove legacy Google photo URLs; keep generated avatar preferences.
-- Keep auth_image nullable for Better Auth schema compatibility.
UPDATE users
SET
  auth_image = NULL
WHERE
  auth_image IS NOT NULL;
