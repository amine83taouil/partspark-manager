-- Fix infinite recursion in profiles RLS policies by creating a security definer function
-- and restructuring the policies to avoid circular references

-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;  
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- Create a security definer function to check if current user is admin
-- This bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'::user_role 
    AND is_active = true
  );
$$;

-- Create a security definer function to check if current user is active
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean  
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_active = true
  );
$$;

-- Create new non-recursive policies for profiles table
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin());

-- Update other table policies to use the new functions
-- Update parts table policies
DROP POLICY IF EXISTS "Authenticated users can view parts" ON public.parts;
DROP POLICY IF EXISTS "Operators and admins can insert parts" ON public.parts;
DROP POLICY IF EXISTS "Operators and admins can update parts" ON public.parts;
DROP POLICY IF EXISTS "Operators and admins can delete parts" ON public.parts;

CREATE POLICY "Active users can view parts" 
ON public.parts 
FOR SELECT 
USING (public.is_active_user());

CREATE POLICY "Active users can insert parts" 
ON public.parts 
FOR INSERT 
WITH CHECK (public.is_active_user());

CREATE POLICY "Active users can update parts" 
ON public.parts 
FOR UPDATE 
USING (public.is_active_user());

CREATE POLICY "Active users can delete parts" 
ON public.parts 
FOR DELETE 
USING (public.is_active_user());

-- Update activity_logs table policies  
DROP POLICY IF EXISTS "Authenticated users can view activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Authenticated users can insert activity_logs" ON public.activity_logs;

CREATE POLICY "Active users can view activity_logs" 
ON public.activity_logs 
FOR SELECT 
USING (public.is_active_user());

CREATE POLICY "Active users can insert activity_logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (public.is_active_user());