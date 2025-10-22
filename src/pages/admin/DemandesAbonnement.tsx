import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, XCircle, Clock, Building, Download, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function DemandesAbonnement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['subscription-payment-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          tenant:tenants!inner (
            id,
            name,
            status,
            is_active
          ),
          plan:plans (
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
        .eq('status', 'awaiting_verification')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleActionMutation = useMutation({
    mutationFn: async ({ subscriptionId, tenantId, action, planId }: { 
      subscriptionId: string;
      tenantId: string; 
      action: 'approve' | 'reject';
      planId: string;
    }) => {
      if (action === 'approve') {
        // 1. Activer le tenant et forcer l'onboarding
        const { error: tenantError } = await supabase
          .from('tenants')
          .update({ 
            is_active: true, 
            status: 'active',
            plan_id: planId,
            onboarding_completed: false
          })
          .eq('id', tenantId);

        if (tenantError) throw tenantError;

        // 2. Activer la subscription
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({ 
            is_active: true, 
            status: 'active' 
          })
          .eq('id', subscriptionId);

        if (subError) throw subError;
      } else {
        // Rejeter la demande
        const { error: tenantError } = await supabase
          .from('tenants')
          .update({ 
            is_active: false, 
            status: 'rejected' 
          })
          .eq('id', tenantId);

        if (tenantError) throw tenantError;

        const { error: subError } = await supabase
          .from('subscriptions')
          .update({ 
            is_active: false, 
            status: 'cancelled' 
          })
          .eq('id', subscriptionId);

        if (subError) throw subError;
      }
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-payment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-tenants'] });
      toast({
        title: action === 'approve' ? "✅ Abonnement validé" : "❌ Demande rejetée",
        description: action === 'approve' 
          ? "L'agence doit compléter son onboarding dans Paramètres." 
          : "Le tenant a été informé du rejet.",
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

  const downloadProof = async (url: string, fileName: string) => {
    try {
      // Extraire le path du fichier depuis l'URL publique
      const urlParts = url.split('/payment-proofs/');
      if (urlParts.length < 2) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "URL du fichier invalide",
        });
        return;
      }

      const filePath = urlParts[1];
      
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .download(filePath);

      if (error) throw error;

      if (data) {
        const blobUrl = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName || 'justificatif.pdf';
        link.click();
        URL.revokeObjectURL(blobUrl);
      }
    } catch (error: any) {
      console.error('Erreur téléchargement:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger le justificatif",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-black">Demandes d'abonnement</h1>
        <Skeleton className="h-64 w-full bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-black flex items-center gap-3">
          <AlertCircle className="h-8 w-8 text-[#c01533]" />
          Demandes d'abonnement
        </h1>
        <p className="text-gray-600 mt-1">
          Validez les paiements par virement bancaire des nouvelles agences
        </p>
      </div>

      {subscriptions.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-orange-600 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            En attente de validation ({subscriptions.length})
          </h2>
          {subscriptions.map((subscription) => {
            const price = subscription.duration === 6 
              ? subscription.plan.price_6_months 
              : subscription.plan.price_12_months;

            return (
              <Card key={subscription.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2 text-black">
                        <Building className="h-5 w-5 text-[#c01533]" />
                        {subscription.tenant.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Demandé le {format(new Date(subscription.created_at), "d MMMM yyyy à HH:mm", { locale: fr })}
                      </p>
                    </div>
                    <Badge className="bg-orange-50 text-orange-600 border border-orange-200">
                      En attente
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Détails du plan */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Pack</p>
                      <p className="font-semibold text-black">{subscription.plan.name}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Durée</p>
                      <p className="font-semibold text-black">{subscription.duration} mois</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Montant</p>
                      <p className="font-semibold text-[#c01533]">{price} DH</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Mode</p>
                      <p className="font-semibold text-black">
                        {subscription.payment_method === 'virement' ? 'Virement' : 'En ligne'}
                      </p>
                    </div>
                  </div>

                  {/* Quotas */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-700 mb-2">Quotas du plan :</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-600">
                      <p>🚗 {subscription.plan.max_vehicles === -1 || subscription.plan.max_vehicles === 0 ? 'Illimité' : subscription.plan.max_vehicles} véhicules</p>
                      <p>👥 {subscription.plan.max_users === -1 || subscription.plan.max_users === 0 ? 'Illimité' : subscription.plan.max_users} utilisateurs</p>
                      <p>📄 {subscription.plan.max_contracts === -1 || subscription.plan.max_contracts === 0 ? 'Illimité' : subscription.plan.max_contracts} contrats</p>
                      <p>👤 {subscription.plan.max_clients === -1 || subscription.plan.max_clients === 0 ? 'Illimité' : subscription.plan.max_clients} clients</p>
                    </div>
                    {subscription.plan.module_assistance && (
                      <Badge className="bg-green-50 text-green-600 border border-green-200 mt-2">
                        ✅ Module Assistance inclus
                      </Badge>
                    )}
                  </div>

                  {/* Motif de virement */}
                  {subscription.payment_reference && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Motif de virement :</p>
                      <code className="text-sm font-mono text-black">{subscription.payment_reference}</code>
                    </div>
                  )}

                  {/* Justificatif */}
                  {subscription.payment_proof_url && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-black">Justificatif de paiement</p>
                          <p className="text-xs text-gray-500">Cliquez pour télécharger</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadProof(
                          subscription.payment_proof_url!, 
                          `justificatif_${subscription.tenant.name}.pdf`
                        )}
                        className="border-gray-300 text-black hover:bg-gray-100"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Télécharger
                      </Button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => handleActionMutation.mutate({ 
                        subscriptionId: subscription.id,
                        tenantId: subscription.tenant_id, 
                        action: 'reject',
                        planId: subscription.plan_id
                      })}
                      disabled={handleActionMutation.isPending}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                    <Button
                      onClick={() => handleActionMutation.mutate({ 
                        subscriptionId: subscription.id,
                        tenantId: subscription.tenant_id, 
                        action: 'approve',
                        planId: subscription.plan_id
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
              Les nouvelles demandes d'abonnement apparaîtront ici
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
