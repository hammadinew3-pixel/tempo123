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
  const [duration, setDuration] = useState<6 | 12>(6);

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

      // Utiliser la fonction RPC sécurisée pour créer la souscription
      const { data: newSubscriptionId, error: rpcError } = await supabase.rpc(
        'create_subscription_for_current_tenant',
        {
          _plan_id: planId,
          _duration: duration,
        }
      );

      if (rpcError) throw rpcError;

      toast({
        title: "✅ Pack sélectionné",
        description: "Vous allez être redirigé vers la page de paiement",
      });

      navigate(`/paiement?subscription_id=${newSubscriptionId}`);
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
          <p className="text-lg text-gray-600 mb-6">
            Sélectionnez l'offre qui correspond le mieux à vos besoins
          </p>
          
          <div className="inline-flex items-center gap-2 bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setDuration(6)}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                duration === 6
                  ? 'bg-[#c01533] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              6 mois
            </button>
            <button
              onClick={() => setDuration(12)}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                duration === 12
                  ? 'bg-[#c01533] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              12 mois
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow relative flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl text-[#c01533]">{plan.name}</CardTitle>
                {plan.description && (
                  <CardDescription className="text-gray-600">{plan.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6 flex-1 flex flex-col">
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
                <Badge className={plan.module_assistance ? "bg-green-50 text-green-600 border-green-200 pointer-events-none" : "bg-gray-50 text-gray-600 border-gray-200 pointer-events-none"}>
                  Module Assistance / Assurances {plan.module_assistance ? 'inclus' : 'non inclus'}
                </Badge>

                {/* Prix et bouton */}
                <div className="mt-auto pt-4">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-[#c01533]">
                      {duration === 6 ? plan.price_6_months : plan.price_12_months} DH
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      pour {duration} mois
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSubscribe(plan.id, duration)}
                    disabled={subscribing === `${plan.id}-${duration}`}
                    className="w-full bg-[#c01533] hover:bg-[#9a0f26] text-white"
                  >
                    {subscribing === `${plan.id}-${duration}` ? "En cours..." : "Souscrire"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
