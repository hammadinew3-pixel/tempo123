import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building, Users, Car, FileText, ShieldCheck, UserCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

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

  const handleTenantClick = (tenant: TenantStats) => {
    setSelectedTenant(tenant);
    setDialogOpen(true);
  };


  const statCards = [
    {
      title: "Total Agences",
      value: stats?.totalTenants || 0,
      icon: Building,
    },
    {
      title: "Total Utilisateurs",
      value: stats?.totalUsers || 0,
      icon: Users,
    },
    {
      title: "Total Véhicules",
      value: stats?.totalVehicles || 0,
      icon: Car,
    },
    {
      title: "Total Contrats",
      value: stats?.totalContracts || 0,
      icon: FileText,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-emerald-500" />
          <h1 className="text-3xl font-bold text-white">Tableau de bord Super Admin</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-emerald-500" />
        <h1 className="text-3xl font-bold text-white">Tableau de bord Super Admin</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="bg-slate-900 border-slate-800 hover:bg-slate-800 transition-colors p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{stat.title}</p>
                <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
              </div>
              <stat.icon className="h-8 w-8 text-emerald-500" />
            </div>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-900 border-slate-800 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Agences créées par mois</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="mois" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="bg-slate-900 border-slate-800 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Liste des Agences</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Agence</TableHead>
                <TableHead className="text-center text-gray-400">Statut</TableHead>
                <TableHead className="text-center text-gray-400">Véhicules</TableHead>
                <TableHead className="text-center text-gray-400">Utilisateurs</TableHead>
                <TableHead className="text-center text-gray-400">Clients</TableHead>
                <TableHead className="text-center text-gray-400">Contrats</TableHead>
                <TableHead className="text-gray-400">Date création</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow
                  key={tenant.tenant_id}
                  className="cursor-pointer hover:bg-slate-800 border-slate-800"
                  onClick={() => handleTenantClick(tenant)}
                >
                  <TableCell className="font-medium text-white">{tenant.tenant_name}</TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={tenant.is_active ? "default" : "destructive"}
                      className={tenant.is_active ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : ""}
                    >
                      {tenant.is_active ? "Actif" : "Suspendu"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-gray-300">{tenant.vehicles_count}</TableCell>
                  <TableCell className="text-center text-gray-300">{tenant.users_count}</TableCell>
                  <TableCell className="text-center text-gray-300">{tenant.clients_count}</TableCell>
                  <TableCell className="text-center text-gray-300">{tenant.contracts_count}</TableCell>
                  <TableCell className="text-gray-400">
                    {new Date(tenant.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Dialog détails tenant */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Building className="h-5 w-5 text-emerald-500" />
              {selectedTenant?.tenant_name}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Statistiques détaillées de l'agence
            </DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-800 border-slate-700">
                  <div className="p-4">
                    <div className="text-sm font-medium flex items-center gap-2 text-gray-400 mb-2">
                      <Car className="h-4 w-4 text-emerald-500" />
                      Véhicules
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedTenant.vehicles_count}</p>
                  </div>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <div className="p-4">
                    <div className="text-sm font-medium flex items-center gap-2 text-gray-400 mb-2">
                      <Users className="h-4 w-4 text-emerald-500" />
                      Utilisateurs
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedTenant.users_count}</p>
                  </div>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <div className="p-4">
                    <div className="text-sm font-medium flex items-center gap-2 text-gray-400 mb-2">
                      <UserCircle className="h-4 w-4 text-emerald-500" />
                      Clients
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedTenant.clients_count}</p>
                  </div>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <div className="p-4">
                    <div className="text-sm font-medium flex items-center gap-2 text-gray-400 mb-2">
                      <FileText className="h-4 w-4 text-emerald-500" />
                      Contrats
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedTenant.contracts_count}</p>
                  </div>
                </Card>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Statut:</span>
                  <Badge 
                    variant={selectedTenant.is_active ? "default" : "destructive"}
                    className={selectedTenant.is_active ? "bg-emerald-500/10 text-emerald-400" : ""}
                  >
                    {selectedTenant.is_active ? "Actif" : "Suspendu"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Date de création:</span>
                  <span className="font-medium text-white">
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
