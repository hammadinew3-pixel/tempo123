import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, XCircle, Clock, Building, ArrowRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function DemandesAbonnement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['subscription-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_requests')
        .select(`
          *,
          tenants (
            id,
            name
          ),
          current_plan:plans!current_plan_id (
            id,
            name
          ),
          requested_plan:plans!requested_plan_id (
            id,
            name,
            price,
            price_6_months,
            price_12_months,
            max_vehicles,
            max_users,
            module_assistance
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleActionMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'approved' | 'rejected' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      const { error } = await supabase
        .from('subscription_requests')
        .update({
          status: action,
          processed_at: new Date().toISOString(),
          processed_by: user.id,
        })
        .eq('id', requestId);

      if (error) throw error;

      // If approved, update the tenant's plan
      if (action === 'approved') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          const { error: updateError } = await supabase
            .from('tenants')
            .update({ plan_id: request.requested_plan_id })
            .eq('id', request.tenant_id);

          if (updateError) throw updateError;
        }
      }
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-requests'] });
      toast({
        title: action === 'approved' ? "Demande approuvée" : "Demande refusée",
        description: action === 'approved' 
          ? "Le plan a été mis à jour avec succès." 
          : "La demande a été refusée.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de traiter la demande. Veuillez réessayer.",
      });
      console.error(error);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-black">Demandes de changement d'abonnement</h1>
        <Skeleton className="h-64 w-full bg-gray-200" />
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-black flex items-center gap-3">
          <AlertCircle className="h-8 w-8 text-red-500" />
          Demandes d'abonnement
        </h1>
        <p className="text-gray-500 mt-1">
          Gérez les demandes de changement de plan des agences
        </p>
      </div>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-yellow-600 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            En attente ({pendingRequests.length})
          </h2>
          {pendingRequests.map((request) => (
            <Card key={request.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2 text-black">
                      <Building className="h-5 w-5 text-red-500" />
                      {request.tenants?.name || 'Tenant inconnu'}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      Demandé le {format(new Date(request.created_at), "d MMMM yyyy à HH:mm", { locale: fr })}
                    </p>
                  </div>
                  <Badge className="bg-yellow-50 text-yellow-600 border border-yellow-200">
                    En attente
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-4 flex-1 border border-gray-200">
                    <p className="text-gray-500 text-xs mb-1 font-medium">Plan actuel</p>
                    <p className="font-semibold text-black">
                      {request.current_plan?.name || 'Aucun plan'}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex-1">
                    <p className="text-gray-500 text-xs mb-1 font-medium">Plan demandé</p>
                    <p className="font-semibold text-red-600">
                      {request.requested_plan?.name || 'Plan inconnu'}
                    </p>
                  </div>
                </div>

                {request.requested_plan && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm border border-gray-200">
                    <p className="text-gray-600 font-medium">Détails du plan demandé :</p>
                    <div className="grid grid-cols-2 gap-2 text-gray-700">
                      <p>💰 6 mois : <strong className="text-black">{request.requested_plan.price_6_months} MAD</strong></p>
                      <p>💰 12 mois : <strong className="text-black">{request.requested_plan.price_12_months} MAD</strong></p>
                      <p>🚗 {request.requested_plan.max_vehicles} véhicules</p>
                      <p>👥 {request.requested_plan.max_users} utilisateurs</p>
                    </div>
                    {request.requested_plan.module_assistance && (
                      <Badge className="bg-green-50 text-green-600 border border-green-200 mt-2">
                        ✅ Module Assistance inclus
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleActionMutation.mutate({ 
                      requestId: request.id, 
                      action: 'rejected' 
                    })}
                    disabled={handleActionMutation.isPending}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Refuser
                  </Button>
                  <Button
                    onClick={() => handleActionMutation.mutate({ 
                      requestId: request.id, 
                      action: 'approved' 
                    })}
                    disabled={handleActionMutation.isPending}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approuver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pendingRequests.length === 0 && (
        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <CardContent className="p-12 text-center">
            <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucune demande en attente</p>
          </CardContent>
        </Card>
      )}

      {/* Processed requests */}
      {processedRequests.length > 0 && (
        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
            Historique ({processedRequests.length})
          </h2>
          {processedRequests.map((request) => (
            <Card key={request.id} className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <CardContent className="p-5">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="font-semibold text-black flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      {request.tenants?.name || 'Tenant inconnu'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {request.current_plan?.name || 'Aucun plan'} → {request.requested_plan?.name || 'Plan inconnu'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Traité le {format(new Date(request.processed_at), "d MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <Badge
                    className={
                      request.status === 'approved'
                        ? "bg-green-50 text-green-600 border border-green-200"
                        : "bg-red-50 text-red-600 border border-red-200"
                    }
                  >
                    {request.status === 'approved' ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approuvé
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Refusé
                      </>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
