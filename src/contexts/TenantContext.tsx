import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Database } from '@/integrations/supabase/types';

type Tenant = Database['public']['Tables']['tenants']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];

interface TenantContextType {
  tenant: Tenant | null;
  profile: Profile | null;
  roles: string[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isComptable: boolean;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTenant(null);
      setProfile(null);
      setRoles([]);
      setLoading(false);
      return;
    }

    const loadTenantData = async () => {
      try {
        // Load user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Load user roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (rolesError) throw rolesError;
        setRoles(rolesData.map(r => r.role));

        // Load tenant if user has one
        if (profileData?.tenant_id) {
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profileData.tenant_id)
            .single();

          if (tenantError) throw tenantError;
          setTenant(tenantData);
        }
      } catch (error) {
        console.error('Error loading tenant data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTenantData();
  }, [user]);

  const isSuperAdmin = roles.includes('superadmin');
  const isAdmin = roles.includes('admin');
  const isAgent = roles.includes('agent');
  const isComptable = roles.includes('comptable');

  return (
    <TenantContext.Provider
      value={{
        tenant,
        profile,
        roles,
        isSuperAdmin,
        isAdmin,
        isAgent,
        isComptable,
        loading,
      }}
    >
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
