-- For existing databases. Run once in phpMyAdmin; preserves current usernames.
ALTER TABLE user_profiles
ADD COLUMN username_changed_at TIMESTAMP(3) NULL,
ADD COLUMN avatar_variant ENUM ('beam', 'marble', 'bauhaus', 'ring') NOT NULL DEFAULT 'beam',
ADD COLUMN avatar_palette ENUM ('gold', 'forest', 'ocean') NOT NULL DEFAULT 'gold',
ADD COLUMN avatar_seed VARCHAR(36) NULL;
