-- Add weekly stress level to check-ins (1 = Calm, 10 = High Load)
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS stress_level integer;
