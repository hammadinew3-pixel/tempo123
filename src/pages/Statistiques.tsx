import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Car, Users, Calendar, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

type Stats = {
  totalRevenue: number;
  totalContracts: number;
  activeContracts: number;
  totalVehicles: number;
  availableVehicles: number;
  totalClients: number;
  revenueGrowth: number;
  contractsGrowth: number;
};

export default function Statistiques() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalContracts: 0,
    activeContracts: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    totalClients: 0,
    revenueGrowth: 0,
    contractsGrowth: 0,
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const currentMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const currentMonthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      const lastMonthStart = format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');
      const lastMonthEnd = format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');

      // Revenus du mois en cours
      const { data: currentMonthContracts } = await supabase
        .from('contracts')
        .select('total_amount')
        .gte('date_debut', currentMonthStart)
        .lte('date_debut', currentMonthEnd);

      const totalRevenue = currentMonthContracts?.reduce((sum, c) => sum + (c.total_amount || 0), 0) || 0;

      // Revenus du mois dernier pour comparaison
      const { data: lastMonthContracts } = await supabase
        .from('contracts')
        .select('total_amount')
        .gte('date_debut', lastMonthStart)
        .lte('date_debut', lastMonthEnd);

      const lastMonthRevenue = lastMonthContracts?.reduce((sum, c) => sum + (c.total_amount || 0), 0) || 0;
      const revenueGrowth = lastMonthRevenue > 0 
        ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      // Total des contrats
      const { count: totalContracts } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true });

      // Contrats actifs
      const { count: activeContracts } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .in('statut', ['contrat_valide', 'livre']);

      // Croissance des contrats
      const { count: currentMonthCount } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', currentMonthStart);

      const { count: lastMonthCount } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonthStart)
        .lte('created_at', lastMonthEnd);

      const contractsGrowth = lastMonthCount && lastMonthCount > 0
        ? (((currentMonthCount || 0) - lastMonthCount) / lastMonthCount) * 100
        : 0;

      // Véhicules
      const { count: totalVehicles } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });

      const { count: availableVehicles } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'disponible');

      // Clients
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalRevenue,
        totalContracts: totalContracts || 0,
        activeContracts: activeContracts || 0,
        totalVehicles: totalVehicles || 0,
        availableVehicles: availableVehicles || 0,
        totalClients: totalClients || 0,
        revenueGrowth,
        contractsGrowth,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Statistiques</h1>
        <p className="text-sm text-muted-foreground">
          Vue d'ensemble de votre activité
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenus du mois */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus du mois</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} DH</div>
            <p className={`text-xs flex items-center gap-1 ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.revenueGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(stats.revenueGrowth).toFixed(1)}% vs mois dernier
            </p>
          </CardContent>
        </Card>

        {/* Contrats actifs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contrats actifs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeContracts}</div>
            <p className="text-xs text-muted-foreground">
              Sur {stats.totalContracts} contrats au total
            </p>
          </CardContent>
        </Card>

        {/* Véhicules disponibles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Véhicules disponibles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableVehicles}</div>
            <p className="text-xs text-muted-foreground">
              Sur {stats.totalVehicles} véhicules
            </p>
          </CardContent>
        </Card>

        {/* Total clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className={`text-xs flex items-center gap-1 ${stats.contractsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.contractsGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(stats.contractsGrowth).toFixed(1)}% nouveaux contrats
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Taux d'occupation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Taux d'occupation de la flotte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Véhicules loués</span>
              <span className="text-sm text-muted-foreground">
                {stats.totalVehicles - stats.availableVehicles} / {stats.totalVehicles}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300"
                style={{ 
                  width: `${stats.totalVehicles > 0 ? ((stats.totalVehicles - stats.availableVehicles) / stats.totalVehicles) * 100 : 0}%` 
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Taux d'occupation: {stats.totalVehicles > 0 
                ? (((stats.totalVehicles - stats.availableVehicles) / stats.totalVehicles) * 100).toFixed(1) 
                : 0}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
