import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  
  useEffect(() => {
    const checkSubscription = async () => {
      if (!currentTenant || !user) return;
      
      // Récupérer le statut complet du tenant
      const { data: tenant } = await supabase
        .from('tenants')
        .select('status, is_active')
        .eq('id', currentTenant.id)
        .single();
      
      if (!tenant) return;

      // Rediriger selon le statut du tenant
      switch (tenant.status) {
        case 'pending_selection':
          navigate('/choisir-pack');
          break;
        case 'pending_payment':
          const { data: pendingSubscription } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('tenant_id', currentTenant.id)
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
          // Vérifier que le tenant est bien actif
          if (!tenant.is_active) {
            navigate('/suspended');
          }
          break;
        default:
          // Statut inconnu ou pas de statut
          if (!tenant.is_active) {
            navigate('/choisir-pack');
          }
          break;
      }
    };
    
    checkSubscription();
  }, [currentTenant, user, navigate]);
  
  return <>{children}</>;
}
