import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building, Users, Car, FileText, Power } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";

interface TenantStats {
  tenant_id: string;
  tenant_name: string;
  vehicles_count: number;
  users_count: number;
  clients_count: number;
  contracts_count: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState<TenantStats | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['global-stats'],
    queryFn: async () => {
      const [tenants, profiles, vehicles, contracts] = await Promise.all([
        supabase.from('tenants').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }),
        supabase.from('contracts').select('id', { count: 'exact', head: true }),
      ]);

      return {
        totalTenants: tenants.count || 0,
        totalUsers: profiles.count || 0,
        totalVehicles: vehicles.count || 0,
        totalContracts: contracts.count || 0,
      };
    },
  });

  const { data: chartData } = useQuery({
    queryKey: ['tenant-signups'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_tenant_signups_by_month');
      return data || [];
    },
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-list'],
    queryFn: async () => {
      const { data: tenantsData } = await supabase
        .from("tenants")
        .select("id, name, is_active, created_at");

      if (!tenantsData) return [];

      const tenantsWithStats = await Promise.all(
        tenantsData.map(async (tenant) => {
          const { data: stats } = await supabase.rpc("get_tenant_stats", {
            tenant_uuid: tenant.id,
          });
          return stats?.[0] || {
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            vehicles_count: 0,
            users_count: 0,
            clients_count: 0,
            contracts_count: 0,
            is_active: tenant.is_active,
            created_at: tenant.created_at,
          };
        })
      );
      return tenantsWithStats;
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
      queryClient.invalidateQueries({ queryKey: ['tenants-list'] });
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

  const handleToggleStatus = (tenant: TenantStats, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStatusMutation.mutate({ id: tenant.tenant_id, is_active: tenant.is_active });
  };

  const handleTenantClick = (tenant: TenantStats) => {
    setSelectedTenant(tenant);
    setDialogOpen(true);
  };

  const statCards = [
    {
      title: "Total Agences",
      value: stats?.totalTenants || 0,
      icon: Building,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      title: "Total Utilisateurs",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      title: "Total Véhicules",
      value: stats?.totalVehicles || 0,
      icon: Car,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      title: "Total Contrats",
      value: stats?.totalContracts || 0,
      icon: FileText,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-black">Tableau de bord</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-black">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble de la plateforme</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-black mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 ${stat.bg} rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-black mb-6">Agences créées par mois</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="mois" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                color: "#000",
              }}
            />
            <Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Tenants Table */}
      <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">Liste des Agences</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 hover:bg-transparent">
                <TableHead className="text-gray-600 font-semibold">Agence</TableHead>
                <TableHead className="text-center text-gray-600 font-semibold">Statut</TableHead>
                <TableHead className="text-center text-gray-600 font-semibold">Véhicules</TableHead>
                <TableHead className="text-center text-gray-600 font-semibold">Utilisateurs</TableHead>
                <TableHead className="text-center text-gray-600 font-semibold">Clients</TableHead>
                <TableHead className="text-center text-gray-600 font-semibold">Contrats</TableHead>
                <TableHead className="text-gray-600 font-semibold">Date création</TableHead>
                <TableHead className="text-right text-gray-600 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow
                  key={tenant.tenant_id}
                  className="cursor-pointer hover:bg-gray-50 border-gray-200"
                  onClick={() => handleTenantClick(tenant)}
                >
                  <TableCell className="font-medium text-black">{tenant.tenant_name}</TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      className={tenant.is_active 
                        ? "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100" 
                        : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                      }
                    >
                      {tenant.is_active ? "Actif" : "Suspendu"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-gray-700">{tenant.vehicles_count}</TableCell>
                  <TableCell className="text-center text-gray-700">{tenant.users_count}</TableCell>
                  <TableCell className="text-center text-gray-700">{tenant.clients_count}</TableCell>
                  <TableCell className="text-center text-gray-700">{tenant.contracts_count}</TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(tenant.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={(e) => handleToggleStatus(tenant, e)}
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border-gray-200 text-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-black text-xl">
              <Building className="h-5 w-5 text-red-500" />
              {selectedTenant?.tenant_name}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Statistiques détaillées de l'agence
            </DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-50 border-gray-200 p-4">
                  <div className="text-sm font-medium flex items-center gap-2 text-gray-600 mb-2">
                    <Car className="h-4 w-4 text-red-500" />
                    Véhicules
                  </div>
                  <p className="text-2xl font-bold text-black">{selectedTenant.vehicles_count}</p>
                </Card>

                <Card className="bg-gray-50 border-gray-200 p-4">
                  <div className="text-sm font-medium flex items-center gap-2 text-gray-600 mb-2">
                    <Users className="h-4 w-4 text-red-500" />
                    Utilisateurs
                  </div>
                  <p className="text-2xl font-bold text-black">{selectedTenant.users_count}</p>
                </Card>

                <Card className="bg-gray-50 border-gray-200 p-4">
                  <div className="text-sm font-medium flex items-center gap-2 text-gray-600 mb-2">
                    <Users className="h-4 w-4 text-red-500" />
                    Clients
                  </div>
                  <p className="text-2xl font-bold text-black">{selectedTenant.clients_count}</p>
                </Card>

                <Card className="bg-gray-50 border-gray-200 p-4">
                  <div className="text-sm font-medium flex items-center gap-2 text-gray-600 mb-2">
                    <FileText className="h-4 w-4 text-red-500" />
                    Contrats
                  </div>
                  <p className="text-2xl font-bold text-black">{selectedTenant.contracts_count}</p>
                </Card>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Statut:</span>
                  <Badge 
                    className={selectedTenant.is_active 
                      ? "bg-green-50 text-green-600 border border-green-200" 
                      : "bg-red-50 text-red-600 border border-red-200"
                    }
                  >
                    {selectedTenant.is_active ? "Actif" : "Suspendu"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date de création:</span>
                  <span className="font-medium text-black">
                    {new Date(selectedTenant.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
