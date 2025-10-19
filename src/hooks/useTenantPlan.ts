import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export function useTenantPlan() {
  const { currentTenant } = useTenant();

  return useQuery({
    queryKey: ['tenant-plan', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant) return null;

      // Récupérer le tenant avec son plan
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select(`
          *,
          plans (*)
        `)
        .eq('id', currentTenant.id)
        .single();

      if (error) throw error;

      // Si pas de plan assigné, retourner valeurs par défaut (accès illimité)
      if (!tenant.plans) {
        return {
          plan: null,
          usage: {
            vehicles: { current: 0, max: Infinity, canAdd: true, percentage: 0 },
            users: { current: 0, max: Infinity, canAdd: true, percentage: 0 },
            contracts: { current: 0, max: Infinity, canAdd: true, percentage: 0 },
            clients: { current: 0, max: Infinity, canAdd: true, percentage: 0 },
          },
          modules: {
            assistance: true,
            sinistres: true,
            infractions: true,
            alertes: true,
            rapports: true,
          },
        };
      }

      // Compter les ressources actuelles en parallèle
      const [vehiclesRes, usersRes, contractsRes, clientsRes] = await Promise.all([
        supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('tenant_id', currentTenant.id),
        supabase.from('user_tenants').select('id', { count: 'exact', head: true }).eq('tenant_id', currentTenant.id),
        supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('tenant_id', currentTenant.id),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('tenant_id', currentTenant.id),
      ]);

      const vehiclesCount = vehiclesRes.count || 0;
      const usersCount = usersRes.count || 0;
      const contractsCount = contractsRes.count || 0;
      const clientsCount = clientsRes.count || 0;

      return {
        plan: tenant.plans,
        usage: {
          vehicles: {
            current: vehiclesCount,
            max: tenant.plans.max_vehicles,
            canAdd: vehiclesCount < tenant.plans.max_vehicles,
            percentage: Math.round((vehiclesCount / tenant.plans.max_vehicles) * 100),
          },
          users: {
            current: usersCount,
            max: tenant.plans.max_users,
            canAdd: usersCount < tenant.plans.max_users,
            percentage: Math.round((usersCount / tenant.plans.max_users) * 100),
          },
          contracts: {
            current: contractsCount,
            max: tenant.plans.max_contracts,
            canAdd: contractsCount < tenant.plans.max_contracts,
            percentage: Math.round((contractsCount / tenant.plans.max_contracts) * 100),
          },
          clients: {
            current: clientsCount,
            max: tenant.plans.max_clients,
            canAdd: clientsCount < tenant.plans.max_clients,
            percentage: Math.round((clientsCount / tenant.plans.max_clients) * 100),
          },
        },
        modules: {
          assistance: tenant.plans.module_assistance,
          sinistres: tenant.plans.module_sinistres,
          infractions: tenant.plans.module_infractions,
          alertes: tenant.plans.module_alertes,
          rapports: tenant.plans.module_rapports,
        },
      };
    },
    enabled: !!currentTenant,
    staleTime: 30000, // Cache 30 secondes
  });
}
