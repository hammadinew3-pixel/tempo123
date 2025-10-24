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
  const TVA_PLANS = 20; // TVA fixe pour les abonnements

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
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-primary" />
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
          <CreditCard className="w-8 h-8 text-primary" />
          Mon Abonnement
        </h1>
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-6">
              Aucun abonnement actif pour le moment.
            </p>
            <Button 
              onClick={() => setOpenDialog(true)}
              className="bg-primary hover:bg-primary/90"
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
  
  const finalPriceHT = discountAmount > 0 
    ? displayPrice * (1 - discountAmount / 100) 
    : displayPrice;
  const finalPriceTTC = Math.round(finalPriceHT * 1.20);

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
          <CreditCard className="w-8 h-8 text-primary" />
          Mon Abonnement
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre plan et consultez vos quotas
        </p>
      </div>

      {/* Plan actuel */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-2">
            <CardTitle className="text-primary text-2xl">
              {plan.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Abonnement {duration} mois — Expire le <strong className="text-foreground">{expirationDate}</strong></span>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Actif
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Tarification */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground mb-3">💰 Tarification</h3>
            {duration === 6 && (
              <div className="space-y-1">
                <p className="text-foreground text-sm">
                  Prix 6 mois : <strong>{plan.price_6_months} DH HT</strong>
                </p>
                <p className="text-foreground">
                  Prix TTC : <strong className="text-primary text-lg">{Math.round(plan.price_6_months * 1.20)} DH</strong>
                  <span className="text-xs text-muted-foreground ml-2">(TVA 20% incluse)</span>
                </p>
              </div>
            )}
            {duration === 12 && (
              <div className="space-y-1">
                <p className="text-foreground text-sm">
                  Prix 12 mois : <strong>{plan.price_12_months} DH HT</strong>
                </p>
                <p className="text-foreground">
                  Prix TTC : <strong className="text-primary text-lg">{Math.round(plan.price_12_months * 1.20)} DH</strong>
                  <span className="text-xs text-muted-foreground ml-2">(TVA 20% incluse)</span>
                </p>
              </div>
            )}
            {discountAmount > 0 && (
              <p className="text-primary font-medium">
                🎁 Remise {discountAmount}% → <strong>{Math.round(finalPriceHT)} DH HT</strong>
                <span className="text-sm ml-2">({finalPriceTTC} DH TTC)</span>
              </p>
            )}
          </div>

          {/* Quotas d'utilisation */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              📊 Quotas d'utilisation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Véhicules */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-muted-foreground">Véhicules</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {usage.vehicles.current} <span className="text-sm text-muted-foreground">/ {usage.vehicles.max === 0 ? 'Illimité' : usage.vehicles.max}</span>
                </p>
              </div>

              {/* Utilisateurs */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-muted-foreground">Utilisateurs</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {usage.users.current} <span className="text-sm text-muted-foreground">/ {usage.users.max === 0 ? 'Illimité' : usage.users.max}</span>
                </p>
              </div>

              {/* Contrats */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-muted-foreground">Contrats</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {usage.contracts.current} <span className="text-sm text-muted-foreground">/ {usage.contracts.max === 0 ? 'Illimité' : usage.contracts.max}</span>
                </p>
              </div>

              {/* Clients */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-muted-foreground">Clients</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {usage.clients.current} <span className="text-sm text-muted-foreground">/ {usage.clients.max === 0 ? 'Illimité' : usage.clients.max}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Modules inclus */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">🔌 Modules inclus</h3>
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
                  ? "bg-primary/10 text-primary border-primary/20 flex items-center gap-1" 
                  : "bg-muted text-muted-foreground border-border flex items-center gap-1"
                }
              >
                {modules.assistance ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                Assistance/Assurance
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              onClick={() => setOpenDialog(true)}
              className="bg-primary hover:bg-primary/90"
            >
              Demander un changement de pack
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour changer de plan */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-popover border-border text-foreground max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Sélectionner un nouveau pack</DialogTitle>
          </DialogHeader>

          {/* Sélection de la durée */}
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <label className="text-sm font-medium text-foreground">Durée de l'abonnement :</label>
            <Select value={selectedDuration.toString()} onValueChange={(value) => setSelectedDuration(parseInt(value))}>
              <SelectTrigger className="w-40 bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="6">6 mois</SelectItem>
                <SelectItem value="12">12 mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {plans.map((p) => {
              const displayPriceHT = selectedDuration === 6 ? p.price_6_months : p.price_12_months;
              const discount = selectedDuration === 6 ? p.discount_6_months : p.discount_12_months;
              const finalPriceHT = discount > 0 ? displayPriceHT * (1 - discount / 100) : displayPriceHT;
              const finalPriceTTC = Math.round(finalPriceHT * 1.20);
              
              return (
                <Card
                  key={p.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedPlan?.id === p.id
                      ? "border-primary border-2 bg-primary/10"
                      : "bg-card border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPlan(p)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-foreground">{p.name}</h3>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{Math.round(finalPriceHT)} DH HT</p>
                          <p className="text-2xl font-bold text-primary">
                            {finalPriceTTC} DH
                          </p>
                          <p className="text-xs text-muted-foreground">
                            TTC (TVA 20%) • {selectedDuration} mois
                          </p>
                          {discount > 0 && (
                            <p className="text-xs text-warning">-{discount}% de réduction</p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1 mt-3">
                        <p>🚗 {p.max_vehicles === 0 ? 'Véhicules illimités' : `${p.max_vehicles} véhicules`}</p>
                        <p>👥 {p.max_users === 0 ? 'Utilisateurs illimités' : `${p.max_users} utilisateurs`}</p>
                        <p>📋 {p.max_contracts === 0 ? 'Contrats illimités' : `${p.max_contracts} contrats`}</p>
                        <p>🧍 {p.max_clients === 0 ? 'Clients illimités' : `${p.max_clients} clients`}</p>
                        {p.module_assistance && (
                          <Badge className="bg-primary/20 text-primary border-primary/30 mt-2">
                            ✅ Module Assistance inclus
                          </Badge>
                        )}
                      </div>
                    </div>
                    {selectedPlan?.id === p.id && (
                      <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 ml-4" />
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
              className="border-border"
            >
              Annuler
            </Button>
            <Button
              onClick={() => requestChangeMutation.mutate({ planId: selectedPlan.id, duration: selectedDuration })}
              disabled={!selectedPlan || requestChangeMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {requestChangeMutation.isPending ? "Envoi..." : "Envoyer la demande"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
