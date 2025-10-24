import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AssignPlanDialog } from "@/components/admin/AssignPlanDialog";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Building, 
  Layers, 
  Power, 
  Calendar,
  Car,
  Users,
  FileText,
  UserCheck,
  AlertCircle,
  Pencil
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TenantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showEditNameDialog, setShowEditNameDialog] = useState(false);
  const [newName, setNewName] = useState('');

  // Handler pour rafraîchir après assignation de plan
  const handlePlanAssigned = () => {
    queryClient.invalidateQueries({ queryKey: ['tenant-details', id] });
    queryClient.invalidateQueries({ queryKey: ['tenant-plan'] });
  };

  // Récupérer les détails du tenant avec son plan et sa subscription active
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-details', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          plans (*),
          subscriptions (
            id,
            duration,
            start_date,
            end_date,
            is_active
          )
        `)
        .eq('id', id)
        .eq('subscriptions.is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Compter l'utilisation actuelle
  const { data: usage } = useQuery({
    queryKey: ['tenant-usage', id],
    queryFn: async () => {
      if (!id) return null;

      const [vehiclesRes, usersRes, contractsRes, clientsRes] = await Promise.all([
        supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('tenant_id', id),
        supabase.from('user_tenants').select('id', { count: 'exact', head: true }).eq('tenant_id', id),
        supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('tenant_id', id),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('tenant_id', id),
      ]);

      return {
        vehicles: vehiclesRes.count || 0,
        users: usersRes.count || 0,
        contracts: contractsRes.count || 0,
        clients: clientsRes.count || 0,
      };
    },
    enabled: !!id,
  });

  // Mutation pour changer le statut
  const toggleStatusMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('tenants')
        .update({ is_active: !tenant?.is_active })
        .eq('id', id!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-details', id] });
      queryClient.invalidateQueries({ queryKey: ['all-tenants'] });
      toast({
        title: "Succès",
        description: `Agence ${tenant?.is_active ? 'suspendue' : 'réactivée'} avec succès`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier le statut",
      });
      console.error(error);
    },
  });

  // Mutation pour changer la durée de la subscription
  const changeDurationMutation = useMutation({
    mutationFn: async (newDuration: number) => {
      if (!subscription?.id) throw new Error("Pas de subscription active");

      const startDate = new Date(subscription.start_date);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + newDuration);

      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          duration: newDuration,
          end_date: endDate.toISOString().split('T')[0]
        })
        .eq('id', subscription.id);

      if (error) throw error;
    },
    onSuccess: (_, newDuration) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-details', id] });
      toast({
        title: "Succès",
        description: `Durée modifiée à ${newDuration} mois`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier la durée",
      });
      console.error(error);
    },
  });

  // Mutation pour mettre à jour le nom de l'agence
  const updateTenantNameMutation = useMutation({
    mutationFn: async (updatedName: string) => {
      const trimmedName = updatedName.trim();
      
      if (!trimmedName) {
        throw new Error("Le nom ne peut pas être vide");
      }
      if (trimmedName.length < 3) {
        throw new Error("Le nom doit contenir au moins 3 caractères");
      }
      if (trimmedName.length > 100) {
        throw new Error("Le nom ne peut pas dépasser 100 caractères");
      }
      
      const { error } = await supabase
        .from('tenants')
        .update({ name: trimmedName })
        .eq('id', id!);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-details', id] });
      queryClient.invalidateQueries({ queryKey: ['all-tenants'] });
      setShowEditNameDialog(false);
      setNewName('');
      toast({
        title: "Succès",
        description: "Nom de l'agence modifié avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de modifier le nom",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-6">
        <p className="text-red-400">Agence non trouvée</p>
      </div>
    );
  }

  const plan = tenant.plans;
  const subscription = tenant.subscriptions?.[0];
  const duration = subscription?.duration || 12;
  const endDate = subscription?.end_date;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/tenants')}
            className="text-gray-600 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-black flex items-center gap-2">
              <Building className="h-8 w-8 text-[#c01533]" />
              {tenant.name}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewName(tenant.name);
                  setShowEditNameDialog(true);
                }}
                className="text-gray-400 hover:text-[#c01533] transition-colors ml-2"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Slug: {tenant.slug} • Créé le {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={tenant.is_active ? "default" : "destructive"}
            className={tenant.is_active ? "bg-green-50 text-green-600 border border-green-200" : ""}
          >
            {tenant.is_active ? "Actif" : "Suspendu"}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => setShowPlanDialog(true)}
          className="bg-[#c01533] hover:bg-[#9a0f26] text-white"
        >
          <Layers className="h-4 w-4 mr-2" />
          Changer le plan
        </Button>
        <Button
          onClick={() => toggleStatusMutation.mutate()}
          disabled={toggleStatusMutation.isPending}
          className={tenant.is_active ? "bg-[#c01533] hover:bg-[#9a0f26] text-white" : "bg-green-500 hover:bg-green-600 text-white"}
        >
          <Power className="h-4 w-4 mr-2" />
          {tenant.is_active ? "Suspendre" : "Réactiver"}
        </Button>
      </div>

      {/* Plan actuel */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#c01533] text-2xl">
            {plan ? plan.name : "Aucun plan assigné"}
          </CardTitle>
          {plan && subscription ? (
            <div className="space-y-3 mt-2">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 font-medium">Durée:</label>
                <Select 
                  value={duration.toString()} 
                  onValueChange={(value) => changeDurationMutation.mutate(parseInt(value))}
                  disabled={changeDurationMutation.isPending}
                >
                  <SelectTrigger className="w-32 bg-white border-gray-300 text-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="6" className="text-black hover:bg-gray-100">6 mois</SelectItem>
                    <SelectItem value="12" className="text-black hover:bg-gray-100">12 mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#c01533]" />
                  <span className="text-black font-semibold text-lg">
                    {duration === 6 ? (
                      plan.discount_6_months > 0 ? (
                        <>
                          <span className="line-through text-gray-500 text-sm">{plan.price_6_months}</span>
                          {' '}
                          <span className="text-[#c01533]">
                            {Math.round(plan.price_6_months * (1 - plan.discount_6_months / 100))} {plan.currency}
                          </span>
                          <span className="text-[#c01533] text-xs ml-1">(-{plan.discount_6_months}%)</span>
                        </>
                      ) : (
                        <>{plan.price_6_months} {plan.currency}</>
                      )
                    ) : (
                      plan.discount_12_months > 0 ? (
                        <>
                          <span className="line-through text-gray-500 text-sm">{plan.price_12_months}</span>
                          {' '}
                          <span className="text-[#c01533]">
                            {Math.round(plan.price_12_months * (1 - plan.discount_12_months / 100))} {plan.currency}
                          </span>
                          <span className="text-[#c01533] text-xs ml-1">(-{plan.discount_12_months}%)</span>
                        </>
                      ) : (
                        <>{plan.price_12_months} {plan.currency}</>
                      )
                    )}
                    <span className="text-sm text-gray-600 font-normal"> / {duration} mois</span>
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Expire le :</span>{' '}
                  <span className="text-black">
                    {new Date(endDate).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                  {new Date(endDate) < new Date() && (
                    <Badge variant="destructive" className="ml-2">Expiré</Badge>
                  )}
                </div>
              </div>
            </div>
          ) : plan ? (
            <div className="mt-2">
              <Alert className="bg-orange-50 border-orange-200">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-700">
                  Ce tenant a un plan assigné mais aucune subscription active. Veuillez cliquer sur "Changer le plan" pour assigner une durée d'abonnement.
                </AlertDescription>
              </Alert>
            </div>
          ) : null}
        </CardHeader>

        {plan && usage && (
          <CardContent className="space-y-6">
            {/* Quotas */}
            <div>
              <h4 className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
                📊 Utilisation des quotas
              </h4>
              <div className="space-y-4">
                {/* Véhicules */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Véhicules
                    </span>
                    <span className={`font-medium ${plan.max_vehicles > 0 && usage.vehicles > plan.max_vehicles ? 'text-red-600' : 'text-black'}`}>
                      {usage.vehicles} / {plan.max_vehicles > 0 ? plan.max_vehicles : '∞'}
                    </span>
                  </div>
                  <Progress value={plan.max_vehicles > 0 ? Math.min((usage.vehicles / plan.max_vehicles) * 100, 100) : 0} className="h-2" />
                  {plan.max_vehicles > 0 && usage.vehicles > plan.max_vehicles && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Quota dépassé de {usage.vehicles - plan.max_vehicles}
                    </p>
                  )}
                </div>

                {/* Utilisateurs */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Utilisateurs
                    </span>
                    <span className={`font-medium ${plan.max_users > 0 && usage.users > plan.max_users ? 'text-red-600' : 'text-black'}`}>
                      {usage.users} / {plan.max_users > 0 ? plan.max_users : '∞'}
                    </span>
                  </div>
                  <Progress value={plan.max_users > 0 ? Math.min((usage.users / plan.max_users) * 100, 100) : 0} className="h-2" />
                  {plan.max_users > 0 && usage.users > plan.max_users && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Quota dépassé de {usage.users - plan.max_users}
                    </p>
                  )}
                </div>

                {/* Contrats */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Contrats
                    </span>
                    <span className={`font-medium ${plan.max_contracts > 0 && usage.contracts > plan.max_contracts ? 'text-red-600' : 'text-black'}`}>
                      {usage.contracts} / {plan.max_contracts > 0 ? plan.max_contracts : '∞'}
                    </span>
                  </div>
                  <Progress value={plan.max_contracts > 0 ? Math.min((usage.contracts / plan.max_contracts) * 100, 100) : 0} className="h-2" />
                  {plan.max_contracts > 0 && usage.contracts > plan.max_contracts && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Quota dépassé de {usage.contracts - plan.max_contracts}
                    </p>
                  )}
                </div>

                {/* Clients */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Clients
                    </span>
                    <span className={`font-medium ${plan.max_clients > 0 && usage.clients > plan.max_clients ? 'text-red-600' : 'text-black'}`}>
                      {usage.clients} / {plan.max_clients > 0 ? plan.max_clients : '∞'}
                    </span>
                  </div>
                  <Progress value={plan.max_clients > 0 ? Math.min((usage.clients / plan.max_clients) * 100, 100) : 0} className="h-2" />
                  {plan.max_clients > 0 && usage.clients > plan.max_clients && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Quota dépassé de {usage.clients - plan.max_clients}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modules */}
            <div>
              <h4 className="text-sm font-semibold text-black mb-3">🔌 Modules activés</h4>
              <div className="flex flex-wrap gap-2">
                {/* Modules de base toujours inclus */}
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                  🚗 Sinistres ✓
                </Badge>
                <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                  ⚠️ Infractions ✓
                </Badge>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                  🔔 Alertes ✓
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                  📊 Rapports ✓
                </Badge>
                
                {/* Module premium */}
                <Badge 
                  variant={plan.module_assistance ? "outline" : "secondary"} 
                  className={plan.module_assistance 
                    ? "bg-green-50 text-green-600 border-green-200" 
                    : "bg-gray-100 text-gray-500 border-gray-300"
                  }
                >
                  🆘 Assistance/Assurance {plan.module_assistance ? '✓' : '✗'}
                </Badge>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Dialog d'assignation de plan */}
      <AssignPlanDialog
        open={showPlanDialog}
        onOpenChange={(open) => {
          setShowPlanDialog(open);
          if (!open) handlePlanAssigned();
        }}
        tenant={tenant}
        currentUsage={usage}
      />

      {/* Dialog de modification du nom */}
      <Dialog open={showEditNameDialog} onOpenChange={setShowEditNameDialog}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-[#c01533]">Modifier le nom de l'agence</DialogTitle>
            <DialogDescription className="text-gray-600">
              Changez le nom d'affichage de cette agence.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name" className="text-black">
                Nouveau nom
              </Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nom de l'agence"
                className="bg-white border-gray-300 text-black"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newName.trim().length >= 3) {
                    updateTenantNameMutation.mutate(newName);
                  }
                }}
              />
              <p className="text-xs text-gray-500">
                Minimum 3 caractères, maximum 100 caractères
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditNameDialog(false);
                setNewName('');
              }}
              disabled={updateTenantNameMutation.isPending}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Annuler
            </Button>
            <Button
              onClick={() => updateTenantNameMutation.mutate(newName)}
              disabled={updateTenantNameMutation.isPending || newName.trim().length < 3}
              className="bg-[#c01533] hover:bg-[#9a0f26] text-white"
            >
              {updateTenantNameMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
