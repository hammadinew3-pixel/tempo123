import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [selectedDuration, setSelectedDuration] = useState<number>(12);

  // Fetch all available plans sorted by price
  const { data: plans = [] } = useQuery({
    queryKey: ['available-plans'],
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
    mutationFn: async ({ planId, duration }: { planId: string; duration: number }) => {
      if (!currentTenant?.id) throw new Error("Tenant non trouvé");
      
      const { error } = await supabase
        .from('subscription_requests')
        .insert({
          tenant_id: currentTenant.id,
          current_plan_id: planData?.plan?.id || null,
          requested_plan_id: planId,
          notes: `Durée demandée: ${duration} mois`,
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
      setSelectedDuration(12);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 space-y-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold flex items-center gap-3 text-white">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            Mon Abonnement
          </h1>
          <Skeleton className="h-96 w-full mt-6 bg-slate-800/50" />
        </div>
      </div>
    );
  }

  if (!planData?.plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 space-y-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold flex items-center gap-3 text-white">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            Mon Abonnement
          </h1>
          <Card className="mt-6 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/50 mb-6">
                <CreditCard className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-300 mb-6 text-lg">
                Aucun abonnement actif pour le moment.
              </p>
              <Button 
                onClick={() => setOpenDialog(true)}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 px-8 py-3 text-base font-semibold"
              >
                Choisir un plan
              </Button>
            </CardContent>
          </Card>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 text-white mb-2">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            Mon Abonnement
          </h1>
          <p className="text-gray-400 text-base ml-16">
            Gérez votre plan et consultez vos quotas
          </p>
        </div>

        {/* Plan actuel */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl"></div>
          
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-700/30">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                {plan.name}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <span>Abonnement {duration} mois — Expire le <strong className="text-emerald-400">{expirationDate}</strong></span>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 text-emerald-300 border-emerald-500/30 px-4 py-2 text-sm font-semibold shadow-lg shadow-emerald-500/10">
              ✓ Actif
            </Badge>
          </CardHeader>
          
          <CardContent className="relative space-y-6 pt-6">
            {/* Tarification */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 backdrop-blur rounded-xl p-5 border border-slate-700/30 shadow-inner">
              <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 flex items-center justify-center">
                  💰
                </div>
                Tarification
              </h3>
              <div className="space-y-3">
                {duration === 6 && (
                  <p className="text-gray-200 flex items-center justify-between">
                    <span>Prix 6 mois :</span>
                    <strong className="text-white text-lg">{plan.price_6_months} {plan.currency} HT</strong>
                  </p>
                )}
                {duration === 12 && (
                  <p className="text-gray-200 flex items-center justify-between">
                    <span>Prix 12 mois :</span>
                    <strong className="text-white text-lg">{plan.price_12_months} {plan.currency} HT</strong>
                  </p>
                )}
                {discountAmount > 0 && (
                  <div className="pt-3 mt-3 border-t border-slate-700/30">
                    <p className="text-emerald-300 font-medium flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="text-lg">🎁</span>
                        Remise {discountAmount}%
                      </span>
                      <strong className="text-xl text-emerald-400">{Math.round(finalPrice)} {plan.currency} HT</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quotas d'utilisation */}
            <div>
              <h3 className="text-sm font-semibold text-gray-200 mb-5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                  📊
                </div>
                Quotas d'utilisation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Véhicules */}
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur rounded-xl p-5 border border-blue-500/20 hover:border-blue-500/40 transition-all shadow-lg shadow-blue-500/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Car className="h-5 w-5 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-blue-200">Véhicules</span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {usage.vehicles.current} <span className="text-base text-gray-400 font-normal">/ {usage.vehicles.max === 0 ? 'Illimité' : usage.vehicles.max}</span>
                  </p>
                </div>

                {/* Utilisateurs */}
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur rounded-xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all shadow-lg shadow-purple-500/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-purple-200">Utilisateurs</span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {usage.users.current} <span className="text-base text-gray-400 font-normal">/ {usage.users.max === 0 ? 'Illimité' : usage.users.max}</span>
                  </p>
                </div>

                {/* Contrats */}
                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 backdrop-blur rounded-xl p-5 border border-yellow-500/20 hover:border-yellow-500/40 transition-all shadow-lg shadow-yellow-500/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-yellow-400" />
                    </div>
                    <span className="text-sm font-medium text-yellow-200">Contrats</span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {usage.contracts.current} <span className="text-base text-gray-400 font-normal">/ {usage.contracts.max === 0 ? 'Illimité' : usage.contracts.max}</span>
                  </p>
                </div>

                {/* Clients */}
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur rounded-xl p-5 border border-green-500/20 hover:border-green-500/40 transition-all shadow-lg shadow-green-500/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-green-400" />
                    </div>
                    <span className="text-sm font-medium text-green-200">Clients</span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {usage.clients.current} <span className="text-base text-gray-400 font-normal">/ {usage.clients.max === 0 ? 'Illimité' : usage.clients.max}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Modules inclus */}
            <div>
              <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                  🔌
                </div>
                Modules inclus
              </h3>
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-blue-500/15 text-blue-300 border border-blue-500/30 px-4 py-2 flex items-center gap-2 hover:bg-blue-500/25 transition-all shadow-lg shadow-blue-500/10">
                  <CheckCircle className="h-4 w-4" /> Sinistres
                </Badge>
                <Badge className="bg-orange-500/15 text-orange-300 border border-orange-500/30 px-4 py-2 flex items-center gap-2 hover:bg-orange-500/25 transition-all shadow-lg shadow-orange-500/10">
                  <CheckCircle className="h-4 w-4" /> Infractions
                </Badge>
                <Badge className="bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 px-4 py-2 flex items-center gap-2 hover:bg-yellow-500/25 transition-all shadow-lg shadow-yellow-500/10">
                  <CheckCircle className="h-4 w-4" /> Alertes
                </Badge>
                <Badge className="bg-purple-500/15 text-purple-300 border border-purple-500/30 px-4 py-2 flex items-center gap-2 hover:bg-purple-500/25 transition-all shadow-lg shadow-purple-500/10">
                  <CheckCircle className="h-4 w-4" /> Rapports
                </Badge>
                
                <Badge 
                  className={modules.assistance 
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-4 py-2 flex items-center gap-2 hover:bg-emerald-500/25 transition-all shadow-lg shadow-emerald-500/10" 
                    : "bg-slate-700/30 text-slate-400 border border-slate-600/30 px-4 py-2 flex items-center gap-2"
                  }
                >
                  {modules.assistance ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  Assistance/Assurance
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-6 border-t border-slate-700/30">
              <Button
                onClick={() => setOpenDialog(true)}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 px-8 py-3 text-base font-semibold"
              >
                Demander un changement de pack
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog pour changer de plan */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Sélectionner un nouveau pack</DialogTitle>
          </DialogHeader>

          {/* Sélection de la durée */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <label className="text-sm font-medium text-gray-300">Durée de l'abonnement :</label>
            <Select value={selectedDuration.toString()} onValueChange={(value) => setSelectedDuration(parseInt(value))}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="6" className="text-white hover:bg-slate-700">6 mois</SelectItem>
                <SelectItem value="12" className="text-white hover:bg-slate-700">12 mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {plans.map((p) => {
              const displayPrice = selectedDuration === 6 ? p.price_6_months : p.price_12_months;
              const discount = selectedDuration === 6 ? p.discount_6_months : p.discount_12_months;
              const finalPrice = discount > 0 ? displayPrice * (1 - discount / 100) : displayPrice;
              
              return (
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
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-white">{p.name}</h3>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-400">
                            {Math.round(finalPrice)} {p.currency}
                          </p>
                          <p className="text-xs text-gray-400">pour {selectedDuration} mois</p>
                          {discount > 0 && (
                            <p className="text-xs text-yellow-400">-{discount}% de réduction</p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 space-y-1 mt-3">
                        <p>🚗 {p.max_vehicles === 0 ? 'Véhicules illimités' : `${p.max_vehicles} véhicules`}</p>
                        <p>👥 {p.max_users === 0 ? 'Utilisateurs illimités' : `${p.max_users} utilisateurs`}</p>
                        <p>📋 {p.max_contracts === 0 ? 'Contrats illimités' : `${p.max_contracts} contrats`}</p>
                        <p>🧍 {p.max_clients === 0 ? 'Clients illimités' : `${p.max_clients} clients`}</p>
                        {p.module_assistance && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mt-2">
                            ✅ Module Assistance inclus
                          </Badge>
                        )}
                      </div>
                    </div>
                    {selectedPlan?.id === p.id && (
                      <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0 ml-4" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpenDialog(false);
                setSelectedPlan(null);
                setSelectedDuration(12);
              }}
              className="border-slate-700"
            >
              Annuler
            </Button>
            <Button
              onClick={() => requestChangeMutation.mutate({ planId: selectedPlan.id, duration: selectedDuration })}
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
