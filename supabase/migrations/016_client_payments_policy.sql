CREATE POLICY "Client can read own payments"
  ON payments FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM user_roles WHERE user_id = auth.uid()
    )
  );
