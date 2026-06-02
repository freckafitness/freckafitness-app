-- Form tracking columns on clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS ga_q_received               boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ga_q_received_at            timestamptz,
  ADD COLUMN IF NOT EXISTS ga_q_storage_path           text,
  ADD COLUMN IF NOT EXISTS informed_consent_received     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS informed_consent_received_at  timestamptz,
  ADD COLUMN IF NOT EXISTS informed_consent_storage_path text;

-- RLS policy: coach can read/write files in the client-documents storage bucket
-- (Bucket must be created manually in Supabase dashboard as a private bucket)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'coach_access_client_documents'
  ) THEN
    CREATE POLICY "coach_access_client_documents"
    ON storage.objects FOR ALL TO authenticated
    USING (
      bucket_id = 'client-documents'
      AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'coach')
    )
    WITH CHECK (
      bucket_id = 'client-documents'
      AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'coach')
    );
  END IF;
END $$;
