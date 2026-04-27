-- Add skip support to campaign_progress
-- DO NOT RUN without manual review. Apply via: supabase db push or psql.

ALTER TABLE campaign_progress
  ADD COLUMN IF NOT EXISTS skip_count INTEGER NOT NULL DEFAULT 0;

-- Expand status CHECK constraint to include 'skipped'.
-- NOTE: The constraint name may differ in your instance.
-- Verify via: SELECT conname FROM pg_constraint WHERE conrelid = 'campaign_progress'::regclass;
ALTER TABLE campaign_progress
  DROP CONSTRAINT IF EXISTS campaign_progress_status_check;

ALTER TABLE campaign_progress
  ADD CONSTRAINT campaign_progress_status_check
  CHECK (status IN ('locked', 'available', 'complete', 'skipped'));
