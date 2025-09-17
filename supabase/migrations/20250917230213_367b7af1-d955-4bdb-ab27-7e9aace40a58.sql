-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'operator');

-- Create profiles table for internal users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'operator',
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add user_id to activity_logs to track who did what
ALTER TABLE public.activity_logs ADD COLUMN user_id UUID REFERENCES public.profiles(id);

-- Add user_id to parts table to track who created/modified parts
ALTER TABLE public.parts ADD COLUMN created_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.parts ADD COLUMN updated_by UUID REFERENCES public.profiles(id);

-- Create RLS policies for profiles (only admins can manage users)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid()::uuid AND p.role = 'admin' AND p.is_active = true
  )
);

CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid()::uuid AND p.role = 'admin' AND p.is_active = true
  )
);

CREATE POLICY "Admins can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid()::uuid AND p.role = 'admin' AND p.is_active = true
  )
);

-- Update parts policies to allow operators and admins
DROP POLICY IF EXISTS "Allow all operations on parts" ON public.parts;

CREATE POLICY "Authenticated users can view parts" 
ON public.parts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid()::uuid AND p.is_active = true
  )
);

CREATE POLICY "Operators and admins can insert parts" 
ON public.parts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid()::uuid AND p.is_active = true
  )
);

CREATE POLICY "Operators and admins can update parts" 
ON public.parts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid()::uuid AND p.is_active = true
  )
);

CREATE POLICY "Operators and admins can delete parts" 
ON public.parts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid()::uuid AND p.is_active = true
  )
);

-- Update activity_logs policies
DROP POLICY IF EXISTS "Allow all operations on activity_logs" ON public.activity_logs;

CREATE POLICY "Authenticated users can view activity_logs" 
ON public.activity_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid()::uuid AND p.is_active = true
  )
);

CREATE POLICY "Authenticated users can insert activity_logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid()::uuid AND p.is_active = true
  )
);

-- Create function to hash passwords (simple for internal use)
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Simple hash for internal use - in production you'd want bcrypt or similar
  RETURN encode(digest(password || 'inventory_salt', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to authenticate users
CREATE OR REPLACE FUNCTION public.authenticate_user(username_input TEXT, password_input TEXT)
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin user (username: admin, password: admin123)
INSERT INTO public.profiles (username, password_hash, role, full_name, is_active) 
VALUES ('admin', public.hash_password('admin123'), 'admin', 'Administrateur', true);

-- Insert sample operators
INSERT INTO public.profiles (username, password_hash, role, full_name, created_by, is_active) 
VALUES 
  ('operateur1', public.hash_password('op123'), 'operator', 'Opérateur 1', (SELECT id FROM public.profiles WHERE username = 'admin'), true),
  ('operateur2', public.hash_password('op123'), 'operator', 'Opérateur 2', (SELECT id FROM public.profiles WHERE username = 'admin'), true);