import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building, Users, Car, FileText, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['global-stats'],
    queryFn: async () => {
      const [tenants, profiles, vehicles, contracts, revenus] = await Promise.all([
        supabase.from('tenants').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }),
        supabase.from('contracts').select('id', { count: 'exact', head: true }),
        supabase.from('revenus').select('montant'),
      ]);

      const totalRevenue = revenus.data?.reduce((sum, r) => sum + (Number(r.montant) || 0), 0) || 0;

      return {
        totalTenants: tenants.count || 0,
        totalUsers: profiles.count || 0,
        totalVehicles: vehicles.count || 0,
        totalContracts: contracts.count || 0,
        totalRevenue,
      };
    },
  });

  const { data: recentTenants, isLoading: isLoadingTenants } = useQuery({
    queryKey: ['recent-tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  const statCards = [
    {
      title: "Total Agences",
      value: stats?.totalTenants || 0,
      icon: Building,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Utilisateurs",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Véhicules",
      value: stats?.totalVehicles || 0,
      icon: Car,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Contrats",
      value: stats?.totalContracts || 0,
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Revenus Totaux",
      value: `${(stats?.totalRevenue || 0).toLocaleString()} DH`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Tableau de Bord Global</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Tableau de Bord Global</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Agences Récentes</h2>
        {isLoadingTenants ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {recentTenants?.map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{tenant.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    tenant.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {tenant.is_active ? 'Actif' : 'Suspendu'}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                    {tenant.subscription_plan}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
