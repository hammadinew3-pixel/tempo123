-- Fonction pour obtenir les inscriptions d'agences par mois
CREATE OR REPLACE FUNCTION public.get_tenant_signups_by_month()
RETURNS TABLE (
  mois TEXT,
  count BIGINT
) 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    TO_CHAR(created_at, 'YYYY-MM') AS mois,
    COUNT(*) AS count
  FROM public.tenants
  GROUP BY mois
  ORDER BY mois DESC
  LIMIT 12;
$$;

-- Fonction pour obtenir les statistiques d'un tenant spécifique
CREATE OR REPLACE FUNCTION public.get_tenant_stats(tenant_uuid UUID)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  vehicles_count BIGINT,
  users_count BIGINT,
  clients_count BIGINT,
  contracts_count BIGINT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
) 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    t.id AS tenant_id,
    t.name AS tenant_name,
    COALESCE(v.count, 0) AS vehicles_count,
    COALESCE(u.count, 0) AS users_count,
    COALESCE(c.count, 0) AS clients_count,
    COALESCE(ct.count, 0) AS contracts_count,
    t.is_active,
    t.created_at
  FROM public.tenants t
  LEFT JOIN (
    SELECT tenant_id, COUNT(*) AS count
    FROM public.vehicles
    GROUP BY tenant_id
  ) v ON v.tenant_id = t.id
  LEFT JOIN (
    SELECT tenant_id, COUNT(*) AS count
    FROM public.user_tenants
    GROUP BY tenant_id
  ) u ON u.tenant_id = t.id
  LEFT JOIN (
    SELECT tenant_id, COUNT(*) AS count
    FROM public.clients
    GROUP BY tenant_id
  ) c ON c.tenant_id = t.id
  LEFT JOIN (
    SELECT tenant_id, COUNT(*) AS count
    FROM public.contracts
    GROUP BY tenant_id
  ) ct ON ct.tenant_id = t.id
  WHERE t.id = tenant_uuid;
$$;