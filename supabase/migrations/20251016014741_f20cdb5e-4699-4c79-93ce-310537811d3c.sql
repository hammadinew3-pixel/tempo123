-- Create vehicle_affectations table to track vehicle assignments in contracts
CREATE TABLE IF NOT EXISTS public.vehicle_affectations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_contract FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_vehicle FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.vehicle_affectations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage vehicle affectations"
  ON public.vehicle_affectations
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view vehicle affectations"
  ON public.vehicle_affectations
  FOR SELECT
  USING (true);

-- Create index for performance
CREATE INDEX idx_vehicle_affectations_contract ON public.vehicle_affectations(contract_id);
CREATE INDEX idx_vehicle_affectations_vehicle ON public.vehicle_affectations(vehicle_id);
CREATE INDEX idx_vehicle_affectations_dates ON public.vehicle_affectations(date_debut, date_fin);

-- Migrate existing data from contracts to affectations
INSERT INTO public.vehicle_affectations (contract_id, vehicle_id, date_debut, date_fin)
SELECT 
  id as contract_id,
  vehicle_id,
  date_debut,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM vehicle_changes vc 
      WHERE vc.contract_id = contracts.id 
      AND vc.old_vehicle_id = contracts.vehicle_id
    )
    THEN (
      SELECT MIN(change_date) 
      FROM vehicle_changes vc 
      WHERE vc.contract_id = contracts.id 
      AND vc.old_vehicle_id = contracts.vehicle_id
    )
    ELSE NULL
  END as date_fin
FROM public.contracts
WHERE vehicle_id IS NOT NULL;

-- Migrate vehicle_changes to affectations
INSERT INTO public.vehicle_affectations (contract_id, vehicle_id, date_debut, date_fin)
SELECT 
  vc1.contract_id,
  vc1.new_vehicle_id as vehicle_id,
  vc1.change_date as date_debut,
  (
    SELECT MIN(vc2.change_date)
    FROM vehicle_changes vc2
    WHERE vc2.contract_id = vc1.contract_id
    AND vc2.change_date > vc1.change_date
  ) as date_fin
FROM vehicle_changes vc1
WHERE vc1.new_vehicle_id IS NOT NULL
ON CONFLICT DO NOTHING;