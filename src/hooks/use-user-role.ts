import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'agent' | 'super_admin' | null;

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // Récupérer tous les rôles de l'utilisateur
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, tenant_id')
          .eq('user_id', user.id);

        if (error) throw error;

        // Priorité au rôle super_admin (sans tenant)
        const superAdminRole = data?.find(r => r.role === 'super_admin' && r.tenant_id === null);
        if (superAdminRole) {
          setRole('super_admin');
        } else {
          // Sinon, prendre le premier rôle disponible (admin ou agent)
          setRole(data?.[0]?.role as UserRole || null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const isAgent = role === 'agent';
  const isSuperAdmin = role === 'super_admin';

  return { role, isAdmin, isAgent, isSuperAdmin, loading };
}
