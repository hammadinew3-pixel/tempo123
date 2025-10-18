-- Temporary unblock: allow authenticated users to insert vehicles (no tenant yet)
DROP POLICY IF EXISTS "Authenticated can insert vehicles" ON public.vehicles;
CREATE POLICY "Authenticated can insert vehicles"
ON public.vehicles FOR INSERT TO authenticated
WITH CHECK (true);
