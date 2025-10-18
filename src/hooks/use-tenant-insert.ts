import { useTenant } from '@/contexts/TenantContext';

/**
 * Hook pour faciliter les inserts avec tenant_id automatique
 * Retourne un objet avec tenant_id qui peut être spread dans les inserts
 */
export function useTenantInsert() {
  const { currentTenant } = useTenant();

  const getTenantId = () => {
    return currentTenant?.id || '';
  };

  return {
    tenantId: getTenantId(),
    withTenantId: <T extends Record<string, any>>(data: T) => ({
      ...data,
      tenant_id: getTenantId()
    })
  };
}
