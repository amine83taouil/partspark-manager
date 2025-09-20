-- Create a better authentication approach for internal users
-- Update the authenticate_user function to set session variables

-- Create a function to set the current user in session
CREATE OR REPLACE FUNCTION public.set_current_user_id(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set the user ID in the session
  PERFORM set_config('app.current_user_id', user_id_param::text, true);
END;
$$;

-- Create a function to get the current user from session
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to get from session first, fallback to auth.uid()
  RETURN COALESCE(
    nullif(current_setting('app.current_user_id', true), '')::uuid,
    auth.uid()
  );
END;
$$;

-- Update the is_admin function to use our custom session
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = public.get_current_user_id()
    AND role = 'admin'::user_role 
    AND is_active = true
  );
$$;

-- Update the is_active_user function to use our custom session
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean  
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = public.get_current_user_id()
    AND is_active = true
  );
$$;

-- Update policies to use the new session-based authentication
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = public.get_current_user_id());
