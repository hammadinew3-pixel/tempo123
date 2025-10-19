import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, Car, FileText, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
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

interface GlobalStats {
  tenants: number;
  users: number;
  vehicles: number;
  contracts: number;
}

interface ChartData {
  mois: string;
  count: number;
}

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

export default function DashboardGlobal() {
  const [stats, setStats] = useState<GlobalStats>({
    tenants: 0,
    users: 0,
    vehicles: 0,
    contracts: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [tenants, setTenants] = useState<TenantStats[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantStats | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch global stats
      const [
        { count: tenantsCount },
        { count: usersCount },
        { count: vehiclesCount },
        { count: contractsCount },
      ] = await Promise.all([
        supabase.from("tenants").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }),
        supabase.from("vehicles").select("*", { count: "exact", head: true }),
        supabase.from("contracts").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        tenants: tenantsCount || 0,
        users: usersCount || 0,
        vehicles: vehiclesCount || 0,
        contracts: contractsCount || 0,
      });

      // Fetch chart data
      const { data: chartResult } = await supabase.rpc("get_tenant_signups_by_month");
      setChartData(chartResult || []);

      // Fetch all tenants with their stats
      const { data: tenantsData } = await supabase
        .from("tenants")
        .select("id, name, is_active, created_at");

      if (tenantsData) {
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
        setTenants(tenantsWithStats);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTenantClick = (tenant: TenantStats) => {
    setSelectedTenant(tenant);
    setDialogOpen(true);
  };

  const statCards = [
    {
      title: "Agences",
      value: stats.tenants,
      icon: Building,
      color: "text-primary",
    },
    {
      title: "Utilisateurs",
      value: stats.users,
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Véhicules",
      value: stats.vehicles,
      icon: Car,
      color: "text-orange-600",
    },
    {
      title: "Contrats",
      value: stats.contracts,
      icon: FileText,
      color: "text-purple-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord global</h1>
        <p className="text-muted-foreground">Vue d'ensemble de toutes les agences</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Graphique des inscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Inscriptions d'agences par mois</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="hsl(var(--primary))" name="Agences créées" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Liste des tenants */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des agences</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agence</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-center">Véhicules</TableHead>
                <TableHead className="text-center">Utilisateurs</TableHead>
                <TableHead className="text-center">Clients</TableHead>
                <TableHead className="text-center">Contrats</TableHead>
                <TableHead>Date création</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow
                  key={tenant.tenant_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleTenantClick(tenant)}
                >
                  <TableCell className="font-medium">{tenant.tenant_name}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={tenant.is_active ? "default" : "destructive"}>
                      {tenant.is_active ? "Actif" : "Suspendu"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{tenant.vehicles_count}</TableCell>
                  <TableCell className="text-center">{tenant.users_count}</TableCell>
                  <TableCell className="text-center">{tenant.clients_count}</TableCell>
                  <TableCell className="text-center">{tenant.contracts_count}</TableCell>
                  <TableCell>
                    {new Date(tenant.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog détails tenant */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {selectedTenant?.tenant_name}
            </DialogTitle>
            <DialogDescription>
              Statistiques détaillées de l'agence
            </DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Car className="h-4 w-4 text-orange-600" />
                      Véhicules
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{selectedTenant.vehicles_count}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-600" />
                      Utilisateurs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{selectedTenant.users_count}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-blue-600" />
                      Clients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{selectedTenant.clients_count}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      Contrats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{selectedTenant.contracts_count}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Statut:</span>
                  <Badge variant={selectedTenant.is_active ? "default" : "destructive"}>
                    {selectedTenant.is_active ? "Actif" : "Suspendu"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Date de création:</span>
                  <span className="font-medium">
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
