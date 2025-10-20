import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CreditCard, Calendar, Users, Car, FileText, User, CheckCircle, XCircle } from "lucide-react";
import { useTenantPlan } from "@/hooks/useTenantPlan";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";

export default function MonAbonnement() {
  const { data: planData, isLoading } = useTenantPlan();
  const { currentTenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Fetch all available plans
  const { data: plans = [] } = useQuery({
    queryKey: ['available-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch current subscription
  const { data: subscription } = useQuery({
    queryKey: ['current-subscription', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) return null;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!currentTenant?.id,
  });

  // Create subscription request mutation
  const requestChangeMutation = useMutation({
    mutationFn: async (planId: string) => {
      if (!currentTenant?.id) throw new Error("Tenant non trouvé");
      
      const { error } = await supabase
        .from('subscription_requests')
        .insert({
          tenant_id: currentTenant.id,
          current_plan_id: planData?.plan?.id || null,
          requested_plan_id: planId,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Demande envoyée",
        description: "Votre demande de changement de pack a été envoyée au Super Admin.",
      });
      setOpenDialog(false);
      setSelectedPlan(null);
      queryClient.invalidateQueries({ queryKey: ['subscription-requests'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer la demande. Veuillez réessayer.",
      });
      console.error(error);
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-emerald-500" />
          Mon Abonnement
        </h1>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!planData?.plan) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-emerald-500" />
          Mon Abonnement
        </h1>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400 mb-6">
              Aucun abonnement actif pour le moment.
            </p>
            <Button 
              onClick={() => setOpenDialog(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Choisir un plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { plan, usage, modules } = planData;
  const duration = subscription?.duration || 12;
  
  // Calculate price based on duration
  let displayPrice = plan.price;
  let discountAmount = 0;
  
  if (duration === 6) {
    displayPrice = plan.price_6_months || plan.price;
    discountAmount = plan.discount_6_months || 0;
  } else if (duration === 12) {
    displayPrice = plan.price_12_months || plan.price;
    discountAmount = plan.discount_12_months || 0;
  }
  
  const finalPrice = discountAmount > 0 
    ? displayPrice * (1 - discountAmount / 100) 
    : displayPrice;

  const expirationDate = subscription?.end_date 
    ? new Date(subscription.end_date).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    : 'Non définie';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-emerald-500" />
          Mon Abonnement
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre plan et consultez vos quotas
        </p>
      </div>

      {/* Plan actuel */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-2">
            <CardTitle className="text-emerald-400 text-2xl">
              {plan.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>Abonnement {duration} mois — Expire le <strong className="text-white">{expirationDate}</strong></span>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            Actif
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Tarification */}
          <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">💰 Tarification</h3>
            {duration === 6 && (
              <p className="text-gray-300">
                Prix 6 mois : <strong className="text-white">{plan.price_6_months} {plan.currency} HT</strong>
              </p>
            )}
            {duration === 12 && (
              <p className="text-gray-300">
                Prix 12 mois : <strong className="text-white">{plan.price_12_months} {plan.currency} HT</strong>
              </p>
            )}
            {discountAmount > 0 && (
              <p className="text-emerald-400 font-medium">
                🎁 Remise {discountAmount}% → <strong>{Math.round(finalPrice)} {plan.currency} HT</strong>
              </p>
            )}
          </div>

          {/* Quotas d'utilisation */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              📊 Quotas d'utilisation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Véhicules */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Véhicules</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {usage.vehicles.current} <span className="text-sm text-gray-400">/ {usage.vehicles.max}</span>
                </p>
              </div>

              {/* Utilisateurs */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-gray-400">Utilisateurs</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {usage.users.current} <span className="text-sm text-gray-400">/ {usage.users.max}</span>
                </p>
              </div>

              {/* Contrats */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-gray-400">Contrats</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {usage.contracts.current} <span className="text-sm text-gray-400">/ {usage.contracts.max}</span>
                </p>
              </div>

              {/* Clients */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-400">Clients</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {usage.clients.current} <span className="text-sm text-gray-400">/ {usage.clients.max}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Modules inclus */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">🔌 Modules inclus</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Sinistres
              </Badge>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Infractions
              </Badge>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Alertes
              </Badge>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Rapports
              </Badge>
              
              <Badge 
                variant={modules.assistance ? "outline" : "secondary"} 
                className={modules.assistance 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1" 
                  : "bg-slate-700/50 text-slate-400 border-slate-600/20 flex items-center gap-1"
                }
              >
                {modules.assistance ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                Assistance/Assurance
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t border-slate-800">
            <Button
              onClick={() => setOpenDialog(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Demander un changement de pack
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour changer de plan */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Sélectionner un nouveau pack</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {plans.map((p) => (
              <Card
                key={p.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedPlan?.id === p.id
                    ? "border-emerald-500 border-2 bg-emerald-500/10"
                    : "bg-slate-800 border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/80"
                }`}
                onClick={() => setSelectedPlan(p)}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-white">{p.name}</h3>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>💰 6 mois : <strong className="text-white">{p.price_6_months} {p.currency}</strong></p>
                      <p>💰 12 mois : <strong className="text-white">{p.price_12_months} {p.currency}</strong></p>
                      <p>🚗 {p.max_vehicles} véhicules • 👥 {p.max_users} utilisateurs</p>
                      <p>📋 {p.max_contracts} contrats • 🧍 {p.max_clients} clients</p>
                      {p.module_assistance && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mt-2">
                          ✅ Module Assistance inclus
                        </Badge>
                      )}
                    </div>
                  </div>
                  {selectedPlan?.id === p.id && (
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  )}
                </div>
              </Card>
            ))}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpenDialog(false);
                setSelectedPlan(null);
              }}
              className="border-slate-700"
            >
              Annuler
            </Button>
            <Button
              onClick={() => requestChangeMutation.mutate(selectedPlan.id)}
              disabled={!selectedPlan || requestChangeMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {requestChangeMutation.isPending ? "Envoi..." : "Envoyer la demande"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
