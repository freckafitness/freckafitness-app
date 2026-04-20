CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_payment_intent_id text,
  type text NOT NULL CHECK (type IN ('subscription', 'one_time')),
  status text NOT NULL,
  product_name text,
  amount integer,
  currency text DEFAULT 'usd',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach can read all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'coach'
    )
  );

CREATE POLICY "Coach can insert payments"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'coach'
    )
  );

CREATE POLICY "Coach can update payments"
  ON payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'coach'
    )
  );
