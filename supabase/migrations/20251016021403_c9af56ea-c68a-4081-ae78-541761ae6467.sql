-- Add foreign key constraint between assistance and assurances
ALTER TABLE public.assistance
ADD CONSTRAINT assistance_assureur_id_fkey 
FOREIGN KEY (assureur_id) 
REFERENCES public.assurances(id) 
ON DELETE SET NULL;