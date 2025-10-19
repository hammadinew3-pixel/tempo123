import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useTenantPlan } from "@/hooks/useTenantPlan";
import { useQueryClient } from "@tanstack/react-query";
import { Car, Users, FileText, UserCheck, Loader2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  max_vehicles: number;
  max_users: number;
  max_contracts: number;
  max_clients: number;
  module_assistance: boolean;
}

interface PlanSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanSelectionDialog({ open, onOpenChange }: PlanSelectionDialogProps) {
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  const { data: currentPlanData } = useTenantPlan();
  const queryClient = useQueryClient();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (open) {
      loadPlans();
    }
  }, [open]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Error loading plans:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les plans",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (selectedPlan: Plan) => {
    if (!currentTenant || !currentPlanData) return;

    const { usage } = currentPlanData;

    // Vérifier les violations de quotas
    const violations: string[] = [];

    if (usage.vehicles.current > selectedPlan.max_vehicles) {
      violations.push(`véhicules (${usage.vehicles.current}/${selectedPlan.max_vehicles})`);
    }
    if (usage.users.current > selectedPlan.max_users) {
      violations.push(`utilisateurs (${usage.users.current}/${selectedPlan.max_users})`);
    }
    if (usage.contracts.current > selectedPlan.max_contracts) {
      violations.push(`contrats (${usage.contracts.current}/${selectedPlan.max_contracts})`);
    }
    if (usage.clients.current > selectedPlan.max_clients) {
      violations.push(`clients (${usage.clients.current}/${selectedPlan.max_clients})`);
    }

    // Bloquer si violations
    if (violations.length > 0) {
      toast({
        variant: "destructive",
        title: "Changement de plan impossible",
        description: `Vous dépassez les quotas pour : ${violations.join(', ')}. Veuillez d'abord réduire votre usage.`,
        duration: 6000,
      });
      return;
    }

    // Mettre à jour le plan
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('tenants')
        .update({ plan_id: selectedPlan.id })
        .eq('id', currentTenant.id);

      if (error) throw error;

      toast({
        title: "Plan changé avec succès !",
        description: `Votre nouveau plan "${selectedPlan.name}" est maintenant actif. Veuillez effectuer le paiement par virement bancaire.`,
        duration: 6000,
      });

      // Invalider les queries pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['tenant-plan'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating plan:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de changer de plan",
      });
    } finally {
      setUpdating(false);
    }
  };

  const currentPlanId = currentPlanData?.plan?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-emerald-400">
            Choisissez votre plan d'abonnement
          </DialogTitle>
          <DialogDescription>
            Sélectionnez le plan qui correspond le mieux à vos besoins. Le paiement se fait par virement bancaire.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {plans.map((plan) => {
              const isCurrentPlan = plan.id === currentPlanId;

              return (
                <Card
                  key={plan.id}
                  className={`relative ${
                    isCurrentPlan ? 'border-emerald-500 border-2' : 'border-slate-700'
                  } bg-slate-900 hover:border-emerald-500/50 transition-colors`}
                >
                  {isCurrentPlan && (
                    <Badge className="absolute top-2 right-2 bg-emerald-500">
                      Plan actuel
                    </Badge>
                  )}

                  <CardHeader>
                    <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                    <p className="text-3xl font-bold text-emerald-400">
                      {plan.price} {plan.currency}
                      <span className="text-sm text-gray-400 font-normal">/mois</span>
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Quotas */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Car className="h-4 w-4 text-gray-400" />
                        <span>{plan.max_vehicles} véhicules</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{plan.max_users} utilisateurs</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span>{plan.max_contracts} contrats</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <UserCheck className="h-4 w-4 text-gray-400" />
                        <span>{plan.max_clients} clients</span>
                      </div>
                    </div>

                    {/* Modules */}
                    <div className="pt-2 border-t border-slate-700">
                      <p className="text-xs text-gray-400 mb-2">
                        ✓ Modules de base inclus (Sinistres, Infractions, Alertes, Rapports)
                      </p>
                      <p className={`text-xs font-medium ${plan.module_assistance ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {plan.module_assistance ? '✓' : '✗'} Module Assistance/Assurance
                      </p>
                    </div>

                    <Button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isCurrentPlan || updating}
                      className="w-full"
                      variant={isCurrentPlan ? "outline" : "default"}
                    >
                      {updating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changement...
                        </>
                      ) : isCurrentPlan ? (
                        "Plan actuel"
                      ) : (
                        "Souscrire"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
