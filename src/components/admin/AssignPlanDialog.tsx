import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Car, Users, FileText, UserCheck, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  module_sinistres: boolean;
  module_infractions: boolean;
  module_alertes: boolean;
  module_rapports: boolean;
}

interface AssignPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: any;
  currentUsage?: {
    vehicles: number;
    users: number;
    contracts: number;
    clients: number;
  };
}

export function AssignPlanDialog({ open, onOpenChange, tenant, currentUsage }: AssignPlanDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [forceAssign, setForceAssign] = useState(false);

  useEffect(() => {
    if (open) {
      loadPlans();
      setForceAssign(false);
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

  const handleAssignPlan = async (selectedPlan: Plan) => {
    if (!tenant || !currentUsage) return;

    // Vérifier les violations de quotas
    const violations: string[] = [];

    if (currentUsage.vehicles > selectedPlan.max_vehicles) {
      violations.push(`véhicules (${currentUsage.vehicles}/${selectedPlan.max_vehicles})`);
    }
    if (currentUsage.users > selectedPlan.max_users) {
      violations.push(`utilisateurs (${currentUsage.users}/${selectedPlan.max_users})`);
    }
    if (currentUsage.contracts > selectedPlan.max_contracts) {
      violations.push(`contrats (${currentUsage.contracts}/${selectedPlan.max_contracts})`);
    }
    if (currentUsage.clients > selectedPlan.max_clients) {
      violations.push(`clients (${currentUsage.clients}/${selectedPlan.max_clients})`);
    }

    // Bloquer si violations ET que le super-admin n'a pas forcé
    if (violations.length > 0 && !forceAssign) {
      toast({
        variant: "destructive",
        title: "Changement de plan impossible",
        description: `L'agence dépasse les quotas pour : ${violations.join(', ')}. Cochez "Forcer l'assignation" pour continuer.`,
        duration: 8000,
      });
      return;
    }

    // Mettre à jour le plan
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('tenants')
        .update({ plan_id: selectedPlan.id })
        .eq('id', tenant.id);

      if (error) throw error;

      toast({
        title: "Plan assigné avec succès !",
        description: `Le plan "${selectedPlan.name}" a été assigné à l'agence "${tenant.name}".${violations.length > 0 ? ' ⚠️ Quota dépassé' : ''}`,
        duration: 6000,
      });

      queryClient.invalidateQueries({ queryKey: ['all-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-details'] });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning plan:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'assigner le plan",
      });
    } finally {
      setUpdating(false);
    }
  };

  const currentPlanId = tenant?.plan_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-emerald-400">
            Assigner un plan à "{tenant?.name}"
          </DialogTitle>
          <DialogDescription>
            Sélectionnez le plan pour cette agence. Vous pouvez forcer l'assignation même si les quotas sont dépassés.
          </DialogDescription>
        </DialogHeader>

        {currentUsage && (
          <Alert className="bg-blue-900/20 border-blue-500/50">
            <AlertDescription className="text-blue-200">
              <strong>Utilisation actuelle :</strong> {currentUsage.vehicles} véhicules, {currentUsage.users} users, {currentUsage.contracts} contrats, {currentUsage.clients} clients
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center space-x-2 mb-4">
          <Checkbox 
            id="force-assign" 
            checked={forceAssign}
            onCheckedChange={(checked) => setForceAssign(checked as boolean)}
          />
          <Label 
            htmlFor="force-assign" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 text-orange-400"
          >
            <AlertTriangle className="h-4 w-4" />
            Forcer l'assignation (ignorer les quotas dépassés)
          </Label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {plans.map((plan) => {
              const isCurrentPlan = plan.id === currentPlanId;
              const hasViolations = currentUsage && (
                currentUsage.vehicles > plan.max_vehicles ||
                currentUsage.users > plan.max_users ||
                currentUsage.contracts > plan.max_contracts ||
                currentUsage.clients > plan.max_clients
              );

              return (
                <Card
                  key={plan.id}
                  className={`relative ${
                    isCurrentPlan ? 'border-emerald-500 border-2' : 
                    hasViolations && !forceAssign ? 'border-red-500/50' : 
                    'border-slate-700'
                  } bg-slate-900 hover:border-emerald-500/50 transition-colors`}
                >
                  {isCurrentPlan && (
                    <Badge className="absolute top-2 right-2 bg-emerald-500">
                      Plan actuel
                    </Badge>
                  )}
                  {hasViolations && !isCurrentPlan && (
                    <Badge className="absolute top-2 right-2 bg-red-500">
                      Quota dépassé
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
                    <div className="space-y-2 text-sm">
                      <div className={`flex items-center gap-2 ${currentUsage && currentUsage.vehicles > plan.max_vehicles ? 'text-red-400' : 'text-gray-300'}`}>
                        <Car className="h-4 w-4 text-gray-400" />
                        <span>{plan.max_vehicles} véhicules</span>
                      </div>
                      <div className={`flex items-center gap-2 ${currentUsage && currentUsage.users > plan.max_users ? 'text-red-400' : 'text-gray-300'}`}>
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{plan.max_users} utilisateurs</span>
                      </div>
                      <div className={`flex items-center gap-2 ${currentUsage && currentUsage.contracts > plan.max_contracts ? 'text-red-400' : 'text-gray-300'}`}>
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span>{plan.max_contracts} contrats</span>
                      </div>
                      <div className={`flex items-center gap-2 ${currentUsage && currentUsage.clients > plan.max_clients ? 'text-red-400' : 'text-gray-300'}`}>
                        <UserCheck className="h-4 w-4 text-gray-400" />
                        <span>{plan.max_clients} clients</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-700">
                      <p className="text-xs text-gray-400 mb-2">Modules inclus :</p>
                      <div className="flex flex-wrap gap-1">
                        {plan.module_assistance && <Badge variant="outline" className="text-xs">🆘</Badge>}
                        {plan.module_sinistres && <Badge variant="outline" className="text-xs">🚗</Badge>}
                        {plan.module_infractions && <Badge variant="outline" className="text-xs">⚠️</Badge>}
                        {plan.module_alertes && <Badge variant="outline" className="text-xs">🔔</Badge>}
                        {plan.module_rapports && <Badge variant="outline" className="text-xs">📊</Badge>}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleAssignPlan(plan)}
                      disabled={isCurrentPlan || updating || (hasViolations && !forceAssign)}
                      className="w-full"
                      variant={isCurrentPlan ? "outline" : "default"}
                    >
                      {updating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Assignation...
                        </>
                      ) : isCurrentPlan ? (
                        "Plan actuel"
                      ) : hasViolations && !forceAssign ? (
                        "Quota dépassé"
                      ) : (
                        "Assigner ce plan"
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
