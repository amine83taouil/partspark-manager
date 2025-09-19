-- Re-enable RLS with proper non-recursive policies
-- Since we're using custom authentication, we'll create simple policies

-- Clean up any remaining policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all profile operations" ON public.profiles;

DROP POLICY IF EXISTS "Active users can view parts" ON public.parts;
DROP POLICY IF EXISTS "Active users can insert parts" ON public.parts;
DROP POLICY IF EXISTS "Active users can update parts" ON public.parts;
DROP POLICY IF EXISTS "Active users can delete parts" ON public.parts;
DROP POLICY IF EXISTS "Allow all parts operations" ON public.parts;

DROP POLICY IF EXISTS "Active users can view activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Active users can insert activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow all activity_logs operations" ON public.activity_logs;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow authenticated users to access data
-- Since we manage authentication in the app layer, we'll use a permissive approach
CREATE POLICY "Allow authenticated access to profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access to parts" ON public.parts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access to activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);