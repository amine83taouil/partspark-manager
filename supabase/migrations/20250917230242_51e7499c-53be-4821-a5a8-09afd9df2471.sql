-- Fix security warnings by setting search_path on functions

-- Update hash_password function with proper search_path
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Simple hash for internal use - in production you'd want bcrypt or similar
  RETURN encode(digest(password || 'inventory_salt', 'sha256'), 'hex');
END;
$$;

-- Update authenticate_user function with proper search_path
CREATE OR REPLACE FUNCTION public.authenticate_user(username_input TEXT, password_input TEXT)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM public.profiles
  WHERE username = username_input 
    AND password_hash = public.hash_password(password_input)
    AND is_active = true;
  
  RETURN user_id;
END;
$$;
