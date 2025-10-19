import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Ban, CheckCircle } from "lucide-react";

export default function Tenants() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [actionType, setActionType] = useState<'suspend' | 'activate' | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tenants, isLoading } = useQuery({
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

  const updateTenantMutation = useMutation({
    mutationFn: async ({ tenantId, isActive }: { tenantId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('tenants')
        .update({ is_active: isActive })
        .eq('id', tenantId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tenants'] });
      toast({
        title: "Succès",
        description: `Agence ${actionType === 'suspend' ? 'suspendue' : 'réactivée'} avec succès.`,
      });
      setSelectedTenant(null);
      setActionType(null);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de l'agence.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const handleAction = (tenant: any, action: 'suspend' | 'activate') => {
    setSelectedTenant(tenant);
    setActionType(action);
  };

  const confirmAction = () => {
    if (selectedTenant && actionType) {
      updateTenantMutation.mutate({
        tenantId: selectedTenant.id,
        isActive: actionType === 'activate',
      });
    }
  };

  const filteredTenants = tenants?.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.subscription_plan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Gestion des Agences</h1>
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion des Agences</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Limites</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTenants?.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {tenant.plans?.name || tenant.subscription_plan || 'Aucun plan'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  <Badge variant={tenant.is_active ? "default" : "destructive"}>
                    {tenant.is_active ? 'Actif' : 'Suspendu'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {tenant.plans ? (
                      <>
                        {tenant.plans.max_users} users / {tenant.plans.max_vehicles} véhicules
                        <br />
                        {tenant.plans.max_contracts} contrats / {tenant.plans.max_clients} clients
                      </>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {tenant.is_active ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleAction(tenant, 'suspend')}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Suspendre
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAction(tenant, 'activate')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Réactiver
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={!!selectedTenant} onOpenChange={() => setSelectedTenant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'suspend' ? 'Suspendre' : 'Réactiver'} l'agence ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'suspend' 
                ? `Êtes-vous sûr de vouloir suspendre l'agence "${selectedTenant?.name}" ? Tous les utilisateurs perdront l'accès.`
                : `Êtes-vous sûr de vouloir réactiver l'agence "${selectedTenant?.name}" ? Les utilisateurs retrouveront l'accès.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
