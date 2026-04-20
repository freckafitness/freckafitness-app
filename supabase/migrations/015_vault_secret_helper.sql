-- Security definer function so Edge Functions can read vault secrets via RPC
CREATE OR REPLACE FUNCTION public.get_vault_secret(secret_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _value text;
BEGIN
  SELECT decrypted_secret
    INTO _value
    FROM vault.decrypted_secrets
   WHERE name = secret_name
   LIMIT 1;
  RETURN _value;
END;
$$;
