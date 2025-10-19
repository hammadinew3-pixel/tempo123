-- Corriger la politique RLS SELECT sur expenses pour filtrer par tenant_id
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON public.expenses;

CREATE POLICY "Users can view their tenant expenses" 
ON public.expenses 
FOR SELECT 
USING (tenant_id = get_user_tenant_id(auth.uid()));