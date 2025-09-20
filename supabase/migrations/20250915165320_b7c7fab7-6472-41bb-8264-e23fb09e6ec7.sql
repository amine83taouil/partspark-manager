-- Drop existing tables and types if they exist
DROP TABLE IF EXISTS public.parts CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TYPE IF EXISTS public.part_category CASCADE;
DROP TYPE IF EXISTS public.activity_action CASCADE;

-- Create enum for categories
CREATE TYPE public.part_category AS ENUM (
  'Adhésif',
  'Antenne', 
  'Batterie',
  'Caméra',
  'Châssis',
  'Connecteur de charge',
  'Écouteur interne',
  'Écran complet',
  'Haut-parleur',
  'Lentille caméra',
  'Nappe',
  'Tiroir SIM',
  'Vibreur',
  'Visserie',
  'Vitre arrière'
);

-- Create enum for activity log actions
CREATE TYPE public.activity_action AS ENUM (
  'CREATE',
  'UPDATE', 
  'DELETE',
  'STOCK_ADJUST'
);

-- Create parts table
CREATE TABLE public.parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category public.part_category NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  location TEXT NOT NULL DEFAULT '',
  supplier TEXT NOT NULL DEFAULT '',
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  reorder_threshold INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  action public.activity_action NOT NULL,
  part_id UUID,
  part_name TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT ''
);

-- Enable Row Level Security
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for parts (allow all operations for now)
CREATE POLICY "Allow all operations on parts" 
ON public.parts 
FOR ALL
USING (true)
WITH CHECK (true);

-- Create policies for activity logs
CREATE POLICY "Allow all operations on activity_logs" 
ON public.activity_logs 
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on parts
CREATE TRIGGER update_parts_updated_at
  BEFORE UPDATE ON public.parts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_parts_sku ON public.parts(sku);
CREATE INDEX idx_parts_category ON public.parts(category);
CREATE INDEX idx_parts_quantity ON public.parts(quantity);
CREATE INDEX idx_activity_logs_timestamp ON public.activity_logs(timestamp);
CREATE INDEX idx_activity_logs_part_id ON public.activity_logs(part_id);
