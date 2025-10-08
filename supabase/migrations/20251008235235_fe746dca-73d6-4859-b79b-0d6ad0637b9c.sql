-- Allow anonymous users to read tenant info by slug for registration
CREATE POLICY "Anyone can view tenant by slug for registration"
ON public.tenants FOR SELECT
TO anon
USING (true);