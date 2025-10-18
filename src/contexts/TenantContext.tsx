import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  loading: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserTenants();
    } else {
      setCurrentTenant(null);
      setTenants([]);
      setLoading(false);
    }
  }, [user]);

  const loadUserTenants = async () => {
    try {
      const { data: userTenants, error } = await supabase
        .from('user_tenants')
        .select(`
          tenant_id,
          is_active,
          tenants (
            id,
            name,
            slug,
            is_active
          )
        `)
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;

      const tenantsList = userTenants
        .map(ut => ut.tenants)
        .filter(t => t !== null) as Tenant[];

      setTenants(tenantsList);

      const activeTenant = userTenants.find(ut => ut.is_active)?.tenants;
      if (activeTenant) {
        setCurrentTenant(activeTenant as Tenant);
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchTenant = async (tenantId: string) => {
    try {
      await supabase
        .from('user_tenants')
        .update({ is_active: false })
        .eq('user_id', user?.id);

      await supabase
        .from('user_tenants')
        .update({ is_active: true })
        .eq('user_id', user?.id)
        .eq('tenant_id', tenantId);

      const newTenant = tenants.find(t => t.id === tenantId);
      if (newTenant) {
        setCurrentTenant(newTenant);
      }

      window.location.reload();
    } catch (error) {
      console.error('Error switching tenant:', error);
    }
  };

  return (
    <TenantContext.Provider value={{ currentTenant, tenants, loading, switchTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
