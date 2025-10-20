import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  
  useEffect(() => {
    const checkSubscription = async () => {
      if (!currentTenant) return;
      
      // Vérifier si le tenant est actif
      if (!currentTenant.is_active) {
        // Vérifier s'il a une subscription en attente
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('tenant_id', currentTenant.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (subscription?.status === 'awaiting_verification') {
          navigate('/attente-validation');
        } else if (subscription?.status === 'awaiting_payment') {
          navigate(`/paiement?subscription_id=${subscription.id}`);
        } else {
          navigate('/choisir-pack');
        }
      }
    };
    
    checkSubscription();
  }, [currentTenant, navigate]);
  
  return <>{children}</>;
}
