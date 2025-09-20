-- Create a simple authentication without complex hashing
-- Drop the old function and authenticate_user
DROP FUNCTION IF EXISTS public.hash_password(text);
DROP FUNCTION IF EXISTS public.authenticate_user(text, text);

-- Create simple hash function using built-in functions
CREATE OR REPLACE FUNCTION public.simple_hash(input_text text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT md5(input_text || 'salt_key_inventory');
$$;

-- Create new authenticate function
CREATE OR REPLACE FUNCTION public.authenticate_user(username_input text, password_input text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id
  FROM public.profiles
  WHERE username = username_input 
    AND password_hash = public.simple_hash(password_input)
    AND is_active = true;
$$;

-- Update existing users with correct password hashes
UPDATE public.profiles 
SET password_hash = public.simple_hash('admin123')
WHERE username = 'admin';

UPDATE public.profiles 
SET password_hash = public.simple_hash('op123')
WHERE username = 'operateur1';

UPDATE public.profiles 
SET password_hash = public.simple_hash('op123')
WHERE username = 'operateur2';
