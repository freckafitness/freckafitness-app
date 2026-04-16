-- Move favourite color to clients table (denormalized from intakes)
-- Intake form still collects it; Convert to Client flow should copy it over.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS favorite_color text;
