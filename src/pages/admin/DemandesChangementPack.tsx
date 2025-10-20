import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Clock, Building, ArrowRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function DemandesChangementPack() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['subscription-change-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_requests')
        .select(`
          *,
          tenant:tenants!inner (
            id,
            name,
            status
          ),
          current_plan:plans!subscription_requests_current_plan_id_fkey (
            id,
            name,
            max_vehicles,
            max_users,
            max_contracts,
            max_clients,
            module_assistance
          ),
          requested_plan:plans!subscription_requests_requested_plan_id_fkey (
            id,
            name,
            price_6_months,
            price_12_months,
            max_vehicles,
            max_users,
            max_contracts,
            max_clients,
            module_assistance
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleActionMutation = useMutation({
    mutationFn: async ({ requestId, tenantId, action, planId }: { 
      requestId: string;
      tenantId: string; 
      action: 'approve' | 'reject';
      planId: string;
    }) => {
      if (action === 'approve') {
        // 1. Mettre à jour le tenant avec le nouveau plan
        const { error: tenantError } = await supabase
          .from('tenants')
          .update({ 
            plan_id: planId
          })
          .eq('id', tenantId);

        if (tenantError) throw tenantError;

        // 2. Marquer la demande comme approuvée
        const { error: requestError } = await supabase
          .from('subscription_requests')
          .update({ 
            status: 'approved',
            processed_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (requestError) throw requestError;
      } else {
        // Rejeter la demande
        const { error: requestError } = await supabase
          .from('subscription_requests')
          .update({ 
            status: 'rejected',
            processed_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (requestError) throw requestError;
      }
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-change-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-tenants'] });
      toast({
        title: action === 'approve' ? "✅ Changement approuvé" : "❌ Demande rejetée",
        description: action === 'approve' 
          ? "Le pack de l'agence a été modifié avec succès." 
          : "La demande de changement a été rejetée.",
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
        <h1 className="text-3xl font-semibold text-black">Demandes de changement de pack</h1>
        <Skeleton className="h-64 w-full bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-black flex items-center gap-3">
          <ArrowRight className="h-8 w-8 text-[#c01533]" />
          Demandes de changement de pack
        </h1>
        <p className="text-gray-600 mt-1">
          Gérez les demandes d'upgrade ou de downgrade des agences
        </p>
      </div>

      {requests.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-orange-600 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            En attente de validation ({requests.length})
          </h2>
          {requests.map((request) => {
            return (
              <Card key={request.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2 text-black">
                        <Building className="h-5 w-5 text-[#c01533]" />
                        {request.tenant.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Demandé le {format(new Date(request.created_at), "d MMMM yyyy à HH:mm", { locale: fr })}
                      </p>
                    </div>
                    <Badge className="bg-orange-50 text-orange-600 border border-orange-200">
                      En attente
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Comparaison des plans */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Plan actuel */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-2 font-medium">Plan actuel :</p>
                      <p className="font-semibold text-black text-lg mb-3">{request.current_plan?.name || 'Aucun'}</p>
                      {request.current_plan && (
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>🚗 {request.current_plan.max_vehicles === 0 || request.current_plan.max_vehicles === -1 ? 'Illimité' : request.current_plan.max_vehicles} véhicules</p>
                          <p>👥 {request.current_plan.max_users === 0 || request.current_plan.max_users === -1 ? 'Illimité' : request.current_plan.max_users} utilisateurs</p>
                          <p>📄 {request.current_plan.max_contracts === 0 || request.current_plan.max_contracts === -1 ? 'Illimité' : request.current_plan.max_contracts} contrats</p>
                          <p>👤 {request.current_plan.max_clients === 0 || request.current_plan.max_clients === -1 ? 'Illimité' : request.current_plan.max_clients} clients</p>
                          {request.current_plan.module_assistance && (
                            <Badge className="bg-green-50 text-green-600 border border-green-200 mt-2 text-xs">
                              ✅ Module Assistance
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Nouveau plan demandé */}
                    <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300">
                      <p className="text-xs text-blue-700 mb-2 font-medium">Nouveau plan demandé :</p>
                      <p className="font-semibold text-blue-900 text-lg mb-3">{request.requested_plan.name}</p>
                      <div className="space-y-1 text-sm text-blue-700">
                        <p>🚗 {request.requested_plan.max_vehicles === 0 || request.requested_plan.max_vehicles === -1 ? 'Illimité' : request.requested_plan.max_vehicles} véhicules</p>
                        <p>👥 {request.requested_plan.max_users === 0 || request.requested_plan.max_users === -1 ? 'Illimité' : request.requested_plan.max_users} utilisateurs</p>
                        <p>📄 {request.requested_plan.max_contracts === 0 || request.requested_plan.max_contracts === -1 ? 'Illimité' : request.requested_plan.max_contracts} contrats</p>
                        <p>👤 {request.requested_plan.max_clients === 0 || request.requested_plan.max_clients === -1 ? 'Illimité' : request.requested_plan.max_clients} clients</p>
                        {request.requested_plan.module_assistance && (
                          <Badge className="bg-green-50 text-green-600 border border-green-200 mt-2 text-xs">
                            ✅ Module Assistance
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {request.notes && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Notes :</p>
                      <p className="text-sm text-black">{request.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => handleActionMutation.mutate({ 
                        requestId: request.id,
                        tenantId: request.tenant_id, 
                        action: 'reject',
                        planId: request.requested_plan_id
                      })}
                      disabled={handleActionMutation.isPending}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                    <Button
                      onClick={() => handleActionMutation.mutate({ 
                        requestId: request.id,
                        tenantId: request.tenant_id, 
                        action: 'approve',
                        planId: request.requested_plan_id
                      })}
                      disabled={handleActionMutation.isPending}
                      className="bg-[#c01533] hover:bg-[#9a0f26] text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Aucune demande en attente</p>
            <p className="text-sm text-gray-500 mt-1">
              Les demandes de changement de pack apparaîtront ici
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
