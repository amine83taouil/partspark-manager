-- Update other table policies to use the new security definer functions
-- This ensures no infinite recursion issues across all tables

-- Update parts table policies
DROP POLICY IF EXISTS "Authenticated users can view parts" ON public.parts;
DROP POLICY IF EXISTS "Operators and admins can insert parts" ON public.parts;
DROP POLICY IF EXISTS "Operators and admins can update parts" ON public.parts;
DROP POLICY IF EXISTS "Operators and admins can delete parts" ON public.parts;
DROP POLICY IF EXISTS "Active users can view parts" ON public.parts;
DROP POLICY IF EXISTS "Active users can insert parts" ON public.parts;
DROP POLICY IF EXISTS "Active users can update parts" ON public.parts;
DROP POLICY IF EXISTS "Active users can delete parts" ON public.parts;

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
DROP POLICY IF EXISTS "Active users can view activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Active users can insert activity_logs" ON public.activity_logs;

CREATE POLICY "Active users can view activity_logs" 
ON public.activity_logs 
FOR SELECT 
USING (public.is_active_user());

CREATE POLICY "Active users can insert activity_logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (public.is_active_user());
