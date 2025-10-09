-- Create table to track vehicle changes during contracts
CREATE TABLE IF NOT EXISTS public.vehicle_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  old_vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  new_vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  change_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_changes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view vehicle changes"
  ON public.vehicle_changes
  FOR SELECT
  USING (true);

CREATE POLICY "Admins and agents can manage vehicle changes"
  ON public.vehicle_changes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- Add index for better performance
CREATE INDEX idx_vehicle_changes_contract ON public.vehicle_changes(contract_id);
CREATE INDEX idx_vehicle_changes_date ON public.vehicle_changes(change_date DESC);