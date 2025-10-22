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
      // Vérifier si le tenant a des données avant de supprimer
      const checks = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('user_tenants').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      ]);

      const totalRecords = checks.reduce((sum, check) => sum + (check.count || 0), 0);
      
      if (totalRecords > 0) {
        throw new Error(
          `Impossible de supprimer cette agence. Elle contient encore ${totalRecords} enregistrement(s). ` +
          `Veuillez d'abord supprimer tous les clients, véhicules, contrats et utilisateurs associés.`
        );
      }

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
    onError: (error: Error) => {
      toast.error(error.message);
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
        <h1 className="text-3xl font-semibold text-black">Liste des Agences</h1>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-black flex items-center gap-3">
            <Building className="h-8 w-8 text-[#c01533]" />
            Liste des Agences
          </h1>
          <p className="text-gray-500 mt-1">
            {tenants.length} agence(s) au total
          </p>
        </div>
      </div>

      <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nom de l'agence
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date de création
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-[#c01533] mr-2" />
                      <span className="text-black font-medium">{tenant.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                    {tenant.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                    {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      className={tenant.is_active 
                        ? "bg-green-50 text-green-600 border border-green-200" 
                        : "bg-red-50 text-red-600 border border-red-200"
                      }
                    >
                      {tenant.is_active ? "Actif" : "Suspendu"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 border border-gray-200">
                      {tenant.plans?.name || tenant.subscription_plan || 'Aucun plan'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                        className="text-[#c01533] hover:text-[#9a0f26] hover:bg-red-50"
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
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Layers className="h-4 w-4 mr-1" />
                        Plan
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleToggleStatus(tenant)}
                        disabled={toggleStatusMutation.isPending}
                        className={
                          tenant.is_active
                            ? "bg-[#c01533] hover:bg-[#9a0f26] text-white"
                            : "bg-green-500 hover:bg-green-600 text-white"
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
                        className="bg-red-50 hover:bg-red-100 text-[#c01533] hover:text-[#9a0f26] font-medium"
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
          <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune agence enregistrée</p>
        </div>
      )}

      {/* Plan Assignment Dialog */}
      {selectedTenant && (
        <AssignPlanDialog
          open={showPlanDialog}
          onOpenChange={setShowPlanDialog}
          tenant={selectedTenant}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer l'agence "{tenantToDelete?.name}" ?
              Cette action est irréversible et supprimera toutes les données associées
              (utilisateurs, véhicules, clients, contrats, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
