-- Fix hash_password to use pgcrypto correctly
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT encode(digest(convert_to(password || 'inventory_salt','UTF8'), 'sha256'), 'hex');
$$;