-- Create companies table for multi-tenant SaaS
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  subscription_plan TEXT NOT NULL DEFAULT 'free',
  max_users INTEGER NOT NULL DEFAULT 5,
  max_locations INTEGER NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create locations table for multi-location management
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Create stock_movements table for detailed traceability
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')),
  quantity INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  unit_cost NUMERIC DEFAULT 0,
  reference_number TEXT,
  notes TEXT,
  user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add company_id to existing tables
ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.parts ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.parts ADD COLUMN location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.activity_logs ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create alerts table for stock alerts
CREATE TABLE public.stock_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'LOW_STOCK',
  threshold_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL,
  is_acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID REFERENCES public.profiles(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for companies
CREATE POLICY "Users can view their company" ON public.companies
FOR SELECT USING (id IN (
  SELECT company_id FROM public.profiles WHERE id = get_current_user_id()
));

CREATE POLICY "Admin users can update their company" ON public.companies
FOR UPDATE USING (
  id IN (SELECT company_id FROM public.profiles WHERE id = get_current_user_id() AND role = 'admin')
);

-- Create RLS policies for locations
CREATE POLICY "Users can view company locations" ON public.locations
FOR SELECT USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = get_current_user_id()
));

CREATE POLICY "Admin users can manage company locations" ON public.locations
FOR ALL USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = get_current_user_id() AND role = 'admin'
));

-- Create RLS policies for stock_movements
CREATE POLICY "Users can view company stock movements" ON public.stock_movements
FOR SELECT USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = get_current_user_id()
));

CREATE POLICY "Users can create stock movements" ON public.stock_movements
FOR INSERT WITH CHECK (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = get_current_user_id()
));

-- Create RLS policies for stock_alerts
CREATE POLICY "Users can view company stock alerts" ON public.stock_alerts
FOR SELECT USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = get_current_user_id()
));

CREATE POLICY "Users can update stock alerts" ON public.stock_alerts
FOR UPDATE USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = get_current_user_id()
));

-- Update existing RLS policies to include company_id filtering
DROP POLICY IF EXISTS "Allow authenticated access to profiles" ON public.profiles;
CREATE POLICY "Users can view company profiles" ON public.profiles
FOR SELECT USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = get_current_user_id()
) OR id = get_current_user_id());

CREATE POLICY "Admin users can manage company profiles" ON public.profiles
FOR ALL USING (
  company_id IN (SELECT company_id FROM public.profiles WHERE id = get_current_user_id() AND role = 'admin')
  OR id = get_current_user_id()
);

DROP POLICY IF EXISTS "Allow authenticated access to parts" ON public.parts;
CREATE POLICY "Users can view company parts" ON public.parts
FOR SELECT USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = get_current_user_id()
));

CREATE POLICY "Users can manage company parts" ON public.parts
FOR ALL USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = get_current_user_id()
));

DROP POLICY IF EXISTS "Allow authenticated access to activity_logs" ON public.activity_logs;
CREATE POLICY "Users can view company activity logs" ON public.activity_logs
FOR SELECT USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = get_current_user_id()
));

CREATE POLICY "Users can create company activity logs" ON public.activity_logs
FOR INSERT WITH CHECK (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = get_current_user_id()
));

-- Create function to check low stock and create alerts
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new alerts for parts below threshold
  INSERT INTO public.stock_alerts (company_id, part_id, alert_type, threshold_value, current_value)
  SELECT 
    p.company_id,
    p.id,
    'LOW_STOCK',
    p.reorder_threshold,
    p.quantity
  FROM public.parts p
  WHERE p.quantity <= p.reorder_threshold
    AND p.company_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.stock_alerts sa
      WHERE sa.part_id = p.id 
        AND sa.alert_type = 'LOW_STOCK'
        AND sa.resolved_at IS NULL
    );
END;
$$;

-- Create function to log stock movements
CREATE OR REPLACE FUNCTION public.log_stock_movement(
  part_id_param UUID,
  location_id_param UUID,
  movement_type_param TEXT,
  quantity_param INTEGER,
  previous_quantity_param INTEGER,
  new_quantity_param INTEGER,
  unit_cost_param NUMERIC DEFAULT 0,
  reference_number_param TEXT DEFAULT NULL,
  notes_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_id_val UUID;
  movement_id UUID;
BEGIN
  -- Get company_id from the part
  SELECT company_id INTO company_id_val
  FROM public.parts
  WHERE id = part_id_param;

  -- Insert the stock movement
  INSERT INTO public.stock_movements (
    company_id,
    part_id,
    location_id,
    movement_type,
    quantity,
    previous_quantity,
    new_quantity,
    unit_cost,
    reference_number,
    notes,
    user_id
  ) VALUES (
    company_id_val,
    part_id_param,
    location_id_param,
    movement_type_param,
    quantity_param,
    previous_quantity_param,
    new_quantity_param,
    unit_cost_param,
    reference_number_param,
    notes_param,
    get_current_user_id()
  ) RETURNING id INTO movement_id;

  -- Check for low stock after movement
  PERFORM check_low_stock();

  RETURN movement_id;
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_parts_company_location ON public.parts(company_id, location_id);
CREATE INDEX idx_stock_movements_part_date ON public.stock_movements(part_id, created_at DESC);
CREATE INDEX idx_stock_movements_company_date ON public.stock_movements(company_id, created_at DESC);
CREATE INDEX idx_stock_alerts_company_unresolved ON public.stock_alerts(company_id, resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_locations_company ON public.locations(company_id) WHERE is_active = true;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert demo data
INSERT INTO public.companies (name, slug, subscription_plan) VALUES 
('Demo Company', 'demo-company', 'premium');

-- Get the demo company ID
DO $$
DECLARE
  demo_company_id UUID;
BEGIN
  SELECT id INTO demo_company_id FROM public.companies WHERE slug = 'demo-company';
  
  -- Insert default locations
  INSERT INTO public.locations (company_id, name, description) VALUES 
  (demo_company_id, 'Atelier Principal', 'Atelier de réparation principal'),
  (demo_company_id, 'Entrepôt', 'Stockage des pièces de rechange'),
  (demo_company_id, 'Magasin', 'Point de vente client');
  
  -- Update existing profiles to belong to demo company
  UPDATE public.profiles SET company_id = demo_company_id WHERE company_id IS NULL;
  
  -- Update existing parts to belong to demo company and first location
  UPDATE public.parts SET 
    company_id = demo_company_id,
    location_id = (SELECT id FROM public.locations WHERE company_id = demo_company_id LIMIT 1)
  WHERE company_id IS NULL;
  
  -- Update existing activity logs
  UPDATE public.activity_logs SET company_id = demo_company_id WHERE company_id IS NULL;
END $$;