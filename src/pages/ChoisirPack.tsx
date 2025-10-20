import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Users, Car, FileText, UserCircle, Headset } from "lucide-react";

export default function ChoisirPack() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['active-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_6_months', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleSubscribe = async (planId: string, duration: 6 | 12) => {
    setSubscribing(`${planId}-${duration}`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté",
          variant: "destructive",
        });
        navigate('/register');
        return;
      }

      const { data: userTenant, error: tenantError } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (tenantError) throw tenantError;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + duration);

      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          tenant_id: userTenant.tenant_id,
          plan_id: planId,
          duration: duration,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          is_active: false,
          status: 'awaiting_payment'
        })
        .select()
        .single();

      if (subError) throw subError;

      toast({
        title: "✅ Pack sélectionné",
        description: "Vous allez être redirigé vers la page de paiement",
      });

      navigate(`/paiement?subscription_id=${subscription.id}`);
    } catch (error: any) {
      console.error('Erreur souscription:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setSubscribing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c01533] mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des packs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">Choisissez votre pack CRSApp</h1>
          <p className="text-lg text-gray-600">
            Sélectionnez l'offre qui correspond le mieux à vos besoins
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow relative">
              <CardHeader>
                <CardTitle className="text-2xl text-[#c01533]">{plan.name}</CardTitle>
                {plan.description && (
                  <CardDescription className="text-gray-600">{plan.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quotas */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Car className="h-4 w-4 text-[#c01533]" />
                    <span className="text-sm">
                      {!plan.max_vehicles || plan.max_vehicles === -1 ? 'Véhicules illimités' : `${plan.max_vehicles} véhicules`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="h-4 w-4 text-[#c01533]" />
                    <span className="text-sm">
                      {!plan.max_users || plan.max_users === -1 ? 'Utilisateurs illimités' : `${plan.max_users} utilisateur${plan.max_users > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <FileText className="h-4 w-4 text-[#c01533]" />
                    <span className="text-sm">
                      {!plan.max_contracts || plan.max_contracts === -1 ? 'Contrats illimités' : `${plan.max_contracts} contrats`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <UserCircle className="h-4 w-4 text-[#c01533]" />
                    <span className="text-sm">
                      {!plan.max_clients || plan.max_clients === -1 ? 'Clients illimités' : `${plan.max_clients} clients`}
                    </span>
                  </div>
                </div>

                {/* Module Assistance */}
                {plan.module_assistance && (
                  <Badge className="bg-green-50 text-green-600 border-green-200">
                    <Headset className="h-3 w-3 mr-1" />
                    Module Assistance inclus
                  </Badge>
                )}

                {/* Modules inclus */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Modules inclus :</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">Sinistres</Badge>
                    <Badge variant="outline" className="text-xs">Infractions</Badge>
                    <Badge variant="outline" className="text-xs">Alertes</Badge>
                    <Badge variant="outline" className="text-xs">Rapports</Badge>
                  </div>
                </div>

                {/* Prix et boutons */}
                <div className="space-y-3 pt-4">
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-sm text-gray-600">6 mois</span>
                      <span className="text-2xl font-bold text-[#c01533]">
                        {plan.price_6_months} DH
                      </span>
                    </div>
                    <Button
                      onClick={() => handleSubscribe(plan.id, 6)}
                      disabled={subscribing === `${plan.id}-6`}
                      className="w-full bg-[#c01533] hover:bg-[#9a0f26] text-white"
                    >
                      {subscribing === `${plan.id}-6` ? "En cours..." : "Souscrire 6 mois"}
                    </Button>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-sm text-gray-600">12 mois</span>
                      <span className="text-2xl font-bold text-[#c01533]">
                        {plan.price_12_months} DH
                      </span>
                    </div>
                    <Button
                      onClick={() => handleSubscribe(plan.id, 12)}
                      disabled={subscribing === `${plan.id}-12`}
                      className="w-full bg-[#c01533] hover:bg-[#9a0f26] text-white"
                    >
                      {subscribing === `${plan.id}-12` ? "En cours..." : "Souscrire 12 mois"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
