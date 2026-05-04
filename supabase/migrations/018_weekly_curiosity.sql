ALTER TABLE clients  ADD COLUMN IF NOT EXISTS show_weekly_curiosity boolean NOT NULL DEFAULT false;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS weekly_curiosity text;
