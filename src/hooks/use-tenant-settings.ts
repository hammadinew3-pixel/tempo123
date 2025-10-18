import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export function useTenantSettings() {
  const { currentTenant } = useTenant();

  return useQuery({
    queryKey: ['tenant-settings', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant) return null;

      const { data, error } = await supabase
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!currentTenant,
  });
}
