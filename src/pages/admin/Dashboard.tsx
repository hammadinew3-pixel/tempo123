import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building, Users, Car, FileText, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AdminDashboard() {
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
        <p className="text-gray-400 text-center">
          Cette console vous permet de superviser l'ensemble des agences hébergées sur la plateforme CRSApp.
        </p>
      </Card>
    </div>
  );
}
