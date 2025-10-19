import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useSuperAdmin } from '@/hooks/use-super-admin';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin();
  const navigate = useNavigate();
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Écouter les changements de statut du tenant en temps réel
  useEffect(() => {
    if (!currentTenant) return;

    const channel = supabase
      .channel(`tenant-${currentTenant.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tenants',
          filter: `id=eq.${currentTenant.id}`,
        },
        (payload) => {
          const updatedTenant = payload.new as Tenant;
          
          // Si le tenant est suspendu, rediriger immédiatement
          if (!updatedTenant.is_active) {
            setCurrentTenant(updatedTenant);
            navigate('/suspended');
            toast.error("Votre agence a été suspendue");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentTenant?.id, navigate]);

  useEffect(() => {
    // Si super_admin, pas besoin de tenant
    if (!superAdminLoading && isSuperAdmin) {
      setCurrentTenant(null);
      setTenants([]);
      setLoading(false);
      return;
    }

    if (user && !isSuperAdmin) {
      loadUserTenants();
    } else if (!user) {
      setCurrentTenant(null);
      setTenants([]);
      setLoading(false);
    }
  }, [user, isSuperAdmin, superAdminLoading]);

  const loadUserTenants = async () => {
    if (!user) {
      setCurrentTenant(null);
      setTenants([]);
      setLoading(false);
      return;
    }

    try {
      // Vérifier d'abord si l'utilisateur est super_admin
      const { data: superAdminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .is('tenant_id', null)
        .maybeSingle();

      // Si super_admin, ne pas charger de tenant
      if (superAdminRole) {
        setCurrentTenant(null);
        setTenants([]);
        setLoading(false);
        return;
      }

      // Sinon, charger les tenants normalement
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
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      const tenantsList = userTenants
        .map(ut => ut.tenants)
        .filter(t => t !== null) as Tenant[];

      setTenants(tenantsList);

      const activeTenant = userTenants.find(ut => ut.is_active)?.tenants;
      if (activeTenant) {
        const tenant = activeTenant as Tenant;
        
        // Vérifier immédiatement si le tenant est suspendu
        if (!tenant.is_active) {
          setCurrentTenant(null);
          setTenants([]);
          navigate('/suspended');
          toast.error("Votre agence est suspendue");
          return;
        }
        
        setCurrentTenant(tenant);
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
