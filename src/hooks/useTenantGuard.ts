import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdmin } from "./use-super-admin";

export function useTenantGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isSuperAdmin } = useSuperAdmin();

  useEffect(() => {
    const checkTenantStatus = async () => {
      if (!user || isSuperAdmin) return;

      // Routes qui ne nécessitent pas de vérification
      const publicRoutes = ['/auth', '/register', '/choisir-pack', '/paiement', '/attente-validation', '/suspended', '/contact'];
      if (publicRoutes.some(route => location.pathname.startsWith(route))) {
        return;
      }

      try {
        // Récupérer le tenant de l'utilisateur avec son statut
        const { data: userTenant, error: tenantError } = await supabase
          .from('user_tenants')
          .select(`
            tenant_id,
            tenants!inner (
              id,
              status,
              is_active,
              onboarding_completed
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (tenantError) {
          console.error('Erreur lors de la récupération du tenant:', tenantError);
          return;
        }

        if (!userTenant) {
          // Pas de tenant trouvé, rediriger vers l'inscription
          navigate('/register');
          return;
        }

        const tenant = userTenant.tenants as { id: string; status: string; is_active: boolean; onboarding_completed: boolean };

        // Si tenant actif mais onboarding non terminé, forcer /parametres
        if (tenant.is_active && !tenant.onboarding_completed && location.pathname !== '/parametres') {
          navigate('/parametres', { replace: true });
          return;
        }

        // Rediriger selon le statut du tenant
        switch (tenant.status) {
          case 'pending_selection':
            navigate('/choisir-pack');
            break;
          case 'pending_payment':
            // Chercher la subscription en attente de paiement
            const { data: pendingSubscription } = await supabase
              .from('subscriptions')
              .select('id')
              .eq('tenant_id', tenant.id)
              .eq('status', 'awaiting_payment')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (pendingSubscription) {
              navigate(`/paiement?subscription_id=${pendingSubscription.id}`);
            } else {
              navigate('/paiement');
            }
            break;
          case 'awaiting_verification':
            navigate('/attente-validation');
            break;
          case 'suspended':
            navigate('/suspended');
            break;
          case 'rejected':
            navigate('/contact');
            break;
          case 'active':
            // Statut actif, ne rien faire
            break;
          default:
            // Statut inconnu, rediriger vers choisir pack
            navigate('/choisir-pack');
            break;
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut du tenant:', error);
      }
    };

    checkTenantStatus();
  }, [user, isSuperAdmin, navigate, location.pathname]);
}
