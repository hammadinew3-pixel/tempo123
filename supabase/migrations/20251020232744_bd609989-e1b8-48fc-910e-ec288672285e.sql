-- 1. Corriger policy SELECT sur subscriptions pour permettre la lecture même si tenant pas actif
DROP POLICY IF EXISTS "Users can view their tenant subscription" ON public.subscriptions;

CREATE POLICY "Users can view their tenant subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
);

-- 2. S'assurer que les plans actifs sont lisibles par tous les utilisateurs authentifiés
-- (Cette policy existe déjà mais on s'assure qu'elle est présente)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'plans' 
    AND policyname = 'Authenticated users can view active plans'
  ) THEN
    CREATE POLICY "Authenticated users can view active plans"
    ON public.plans
    FOR SELECT
    TO authenticated
    USING (is_active = true);
  END IF;
END $$;

-- 3. Corriger policy UPDATE sur tenants pour permettre les mises à jour même si pas actif
DROP POLICY IF EXISTS "Admins can update their tenant" ON public.tenants;

CREATE POLICY "Admins can update their tenant"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
  id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- 4. Créer fonction RPC sécurisée pour soumettre le justificatif de paiement
CREATE OR REPLACE FUNCTION public.submit_payment_proof(
  _subscription_id uuid,
  _proof_url text,
  _reference text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Récupérer le tenant_id de la subscription
  SELECT tenant_id INTO v_tenant_id
  FROM public.subscriptions
  WHERE id = _subscription_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  -- Vérifier que l'utilisateur appartient au tenant
  IF v_tenant_id != get_user_tenant_id(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Vérifier que l'utilisateur est admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  -- Mettre à jour la subscription
  UPDATE public.subscriptions
  SET 
    payment_method = 'virement',
    payment_reference = _reference,
    payment_proof_url = _proof_url,
    status = 'awaiting_verification',
    updated_at = now()
  WHERE id = _subscription_id;

  -- Mettre à jour le tenant
  UPDATE public.tenants
  SET status = 'awaiting_verification'
  WHERE id = v_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_payment_proof(uuid, text, text) TO authenticated;