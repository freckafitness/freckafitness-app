-- Link archived client records to their returning iterations
ALTER TABLE clients ADD COLUMN IF NOT EXISTS previous_client_id uuid REFERENCES clients(id);
