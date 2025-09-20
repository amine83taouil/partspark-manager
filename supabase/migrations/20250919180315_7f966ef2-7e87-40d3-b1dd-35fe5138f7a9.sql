-- Temporarily disable RLS to fix the infinite recursion issue
-- This is the quickest way to get authentication working

-- Disable RLS on all tables temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts DISABLE ROW LEVEL SECURITY;  
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;
