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
  ArrowLeft, 
  Building, 
  Layers, 
  Power, 
  Calendar,
  Car,
  Users,
  FileText,
  UserCheck,
  AlertCircle
} from "lucide-react";

export default function TenantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPlanDialog, setShowPlanDialog] = useState(false);

  // Récupérer les détails du tenant avec son plan
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-details', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          plans (*)
        `)
        .eq('id', id)
        .single();

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/tenants')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Building className="h-8 w-8 text-emerald-500" />
              {tenant.name}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Slug: {tenant.slug} • Créé le {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={tenant.is_active ? "default" : "destructive"}
            className={tenant.is_active ? "bg-emerald-500/10 text-emerald-400" : ""}
          >
            {tenant.is_active ? "Actif" : "Suspendu"}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => setShowPlanDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Layers className="h-4 w-4 mr-2" />
          Changer le plan
        </Button>
        <Button
          onClick={() => toggleStatusMutation.mutate()}
          disabled={toggleStatusMutation.isPending}
          variant={tenant.is_active ? "destructive" : "default"}
        >
          <Power className="h-4 w-4 mr-2" />
          {tenant.is_active ? "Suspendre" : "Réactiver"}
        </Button>
      </div>

      {/* Plan actuel */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-emerald-400 text-2xl">
            {plan ? plan.name : "Aucun plan assigné"}
          </CardTitle>
          {plan && (
            <p className="text-gray-400 text-sm">
              {plan.price} {plan.currency} / mois
            </p>
          )}
        </CardHeader>

        {plan && usage && (
          <CardContent className="space-y-6">
            {/* Quotas */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                📊 Utilisation des quotas
              </h4>
              <div className="space-y-4">
                {/* Véhicules */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Véhicules
                    </span>
                    <span className={`font-medium ${usage.vehicles > plan.max_vehicles ? 'text-red-400' : 'text-white'}`}>
                      {usage.vehicles} / {plan.max_vehicles}
                    </span>
                  </div>
                  <Progress value={Math.min((usage.vehicles / plan.max_vehicles) * 100, 100)} className="h-2" />
                  {usage.vehicles > plan.max_vehicles && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Quota dépassé de {usage.vehicles - plan.max_vehicles}
                    </p>
                  )}
                </div>

                {/* Utilisateurs */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Utilisateurs
                    </span>
                    <span className={`font-medium ${usage.users > plan.max_users ? 'text-red-400' : 'text-white'}`}>
                      {usage.users} / {plan.max_users}
                    </span>
                  </div>
                  <Progress value={Math.min((usage.users / plan.max_users) * 100, 100)} className="h-2" />
                  {usage.users > plan.max_users && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Quota dépassé de {usage.users - plan.max_users}
                    </p>
                  )}
                </div>

                {/* Contrats */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Contrats
                    </span>
                    <span className={`font-medium ${usage.contracts > plan.max_contracts ? 'text-red-400' : 'text-white'}`}>
                      {usage.contracts} / {plan.max_contracts}
                    </span>
                  </div>
                  <Progress value={Math.min((usage.contracts / plan.max_contracts) * 100, 100)} className="h-2" />
                  {usage.contracts > plan.max_contracts && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Quota dépassé de {usage.contracts - plan.max_contracts}
                    </p>
                  )}
                </div>

                {/* Clients */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400 flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Clients
                    </span>
                    <span className={`font-medium ${usage.clients > plan.max_clients ? 'text-red-400' : 'text-white'}`}>
                      {usage.clients} / {plan.max_clients}
                    </span>
                  </div>
                  <Progress value={Math.min((usage.clients / plan.max_clients) * 100, 100)} className="h-2" />
                  {usage.clients > plan.max_clients && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Quota dépassé de {usage.clients - plan.max_clients}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modules */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">🔌 Modules activés</h4>
              <div className="flex flex-wrap gap-2">
                {plan.module_assistance && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    🆘 Assistance
                  </Badge>
                )}
                {plan.module_sinistres && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    🚗 Sinistres
                  </Badge>
                )}
                {plan.module_infractions && (
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
                    ⚠️ Infractions
                  </Badge>
                )}
                {plan.module_alertes && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                    🔔 Alertes
                  </Badge>
                )}
                {plan.module_rapports && (
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                    📊 Rapports
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Dialog d'assignation de plan */}
      <AssignPlanDialog
        open={showPlanDialog}
        onOpenChange={setShowPlanDialog}
        tenant={tenant}
        currentUsage={usage}
      />
    </div>
  );
}
