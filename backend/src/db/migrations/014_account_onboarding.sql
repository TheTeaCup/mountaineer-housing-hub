-- Run once before deploying the account welcome guide.
ALTER TABLE user_profiles
ADD COLUMN onboarding_completed_at TIMESTAMP(3) NULL;

-- Existing accounts can continue without a first-login interruption.
UPDATE user_profiles
SET
  onboarding_completed_at = CURRENT_TIMESTAMP(3);
