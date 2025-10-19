import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building, Eye, Power, Layers, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AssignPlanDialog } from "@/components/admin/AssignPlanDialog";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TenantsList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<any>(null);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['all-tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          plans (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('tenants')
        .update({ is_active: !is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['all-tenants'] });
      toast.success(
        variables.is_active 
          ? "Agence suspendue avec succès" 
          : "Agence réactivée avec succès"
      );
    },
    onError: (error) => {
      toast.error("Erreur lors de la modification du statut: " + error.message);
    },
  });

  const deleteTenantMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      // Supprimer toutes les données liées au tenant
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tenants'] });
      toast.success("Agence supprimée avec succès");
      setShowDeleteDialog(false);
      setTenantToDelete(null);
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression: " + error.message);
    },
  });

  const handleToggleStatus = (tenant: any) => {
    toggleStatusMutation.mutate({ id: tenant.id, is_active: tenant.is_active });
  };

  const handleDeleteClick = (tenant: any) => {
    setTenantToDelete(tenant);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (tenantToDelete) {
      deleteTenantMutation.mutate(tenantToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-emerald-500" />
          <h1 className="text-3xl font-bold text-white">Liste des Agences</h1>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Building className="h-8 w-8 text-emerald-500" />
          Liste des Agences
        </h1>
        <p className="text-gray-400 text-sm">
          {tenants.length} agence(s) au total
        </p>
      </div>

      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Nom de l'agence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date de création
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-800/50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-emerald-500 mr-2" />
                      <span className="text-white font-medium">{tenant.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                    {tenant.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                    {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={tenant.is_active ? "default" : "destructive"}
                      className={tenant.is_active ? "bg-emerald-500/10 text-emerald-400" : ""}
                    >
                      {tenant.is_active ? "Actif" : "Suspendu"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-slate-700 text-gray-300">
                      {tenant.plans?.name || tenant.subscription_plan || 'Aucun plan'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                        className="text-emerald-400 hover:text-emerald-300 hover:bg-slate-800"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setShowPlanDialog(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 hover:bg-slate-800"
                      >
                        <Layers className="h-4 w-4 mr-1" />
                        Plan
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(tenant)}
                        disabled={toggleStatusMutation.isPending}
                        className={
                          tenant.is_active
                            ? "bg-red-500/10 hover:bg-red-500/20 text-red-400"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                        }
                      >
                        <Power className="h-4 w-4 mr-1" />
                        {tenant.is_active ? "Suspendre" : "Activer"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(tenant)}
                        disabled={deleteTenantMutation.isPending}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {tenants.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Aucune agence enregistrée</p>
        </div>
      )}

      {/* Dialog d'assignation de plan */}
      {selectedTenant && (
        <AssignPlanDialog
          open={showPlanDialog}
          onOpenChange={setShowPlanDialog}
          tenant={selectedTenant}
        />
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'agence "{tenantToDelete?.name}" ?
              Cette action est irréversible et supprimera toutes les données associées
              (utilisateurs, véhicules, clients, contrats, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
