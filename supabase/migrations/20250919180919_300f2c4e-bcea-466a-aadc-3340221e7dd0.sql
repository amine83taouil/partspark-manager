-- Enable the pgcrypto extension and fix the hash_password function
-- The digest function requires the pgcrypto extension

-- Enable the pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the hash_password function to ensure it works correctly
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Simple hash for internal use using pgcrypto extension
  RETURN encode(digest(password || 'inventory_salt', 'sha256'), 'hex');
END;
$$;