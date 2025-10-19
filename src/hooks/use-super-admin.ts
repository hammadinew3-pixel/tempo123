import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useSuperAdmin() {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSuperAdmin() {
      if (!user) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'super_admin')
          .is('tenant_id', null)
          .maybeSingle();

        if (error) throw error;
        setIsSuperAdmin(!!data);
      } catch (error) {
        console.error('Error checking super admin:', error);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkSuperAdmin();
  }, [user]);

  return { isSuperAdmin, loading };
}
