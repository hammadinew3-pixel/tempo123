import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  CartesianGrid,
  Legend
} from "recharts";
import { DollarSign, TrendingUp, Package } from "lucide-react";

interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  amount: number;
  duration: number;
  status: string;
  created_at: string;
  start_date: string;
  end_date: string;
}

interface Plan {
  id: string;
  name: string;
}

interface Tenant {
  id: string;
  name: string;
}

interface Stats {
  total: number;
  actifs: number;
  nouveaux: number;
}

interface MonthlyData {
  mois: string;
  montant: number;
}

interface PlanData {
  name: string;
  value: number;
}

interface TransactionRow extends Subscription {
  plan_name: string;
  tenant_name: string;
}

export default function RevenusAdmin() {
  const [stats, setStats] = useState<Stats>({ total: 0, actifs: 0, nouveaux: 0 });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [plansData, setPlansData] = useState<PlanData[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subscriptions with plans and tenants
        const { data: subscriptions, error: subsError } = await supabase
          .from("subscriptions")
          .select(`
            *,
            plans!inner(name),
            tenants!inner(name)
          `)
          .eq("status", "active");

        if (subsError) throw subsError;

        if (!subscriptions) {
          setLoading(false);
          return;
        }

        // Calculate stats
        const total = subscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);
        const actifs = subscriptions.length;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const nouveaux = subscriptions.filter((sub) => {
          const createdDate = new Date(sub.created_at);
          return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
        }).length;

        setStats({ total, actifs, nouveaux });

        // Group by month for the last 12 months
        const monthlyRevenue: { [key: string]: number } = {};
        const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
        
        subscriptions.forEach((sub) => {
          const date = new Date(sub.created_at);
          const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`;
          monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (sub.amount || 0);
        });

        const sortedMonthly = Object.entries(monthlyRevenue)
          .map(([mois, montant]) => ({ mois, montant }))
          .slice(-12);

        setMonthlyData(sortedMonthly);

        // Group by plan
        const planRevenue: { [key: string]: number } = {};
        subscriptions.forEach((sub: any) => {
          const planName = sub.plans?.name || "Inconnu";
          planRevenue[planName] = (planRevenue[planName] || 0) + (sub.amount || 0);
        });

        const planDataArray = Object.entries(planRevenue).map(([name, value]) => ({ name, value }));
        setPlansData(planDataArray);

        // Format transactions
        const formattedTransactions: TransactionRow[] = subscriptions
          .map((sub: any) => ({
            ...sub,
            plan_name: sub.plans?.name || "Inconnu",
            tenant_name: sub.tenants?.name || "Inconnu",
          }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 50);

        setTransactions(formattedTransactions);
      } catch (error) {
        console.error("Erreur lors du chargement des revenus:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--secondary))", "hsl(var(--accent))"];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-primary" />
          Revenus - Abonnements
        </h1>
        <p className="text-muted-foreground mt-2">Vue d'ensemble des revenus générés par les abonnements</p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenu total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-muted-foreground mt-1">Abonnements actifs</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Abonnements actifs
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.actifs}</div>
            <p className="text-xs text-muted-foreground mt-1">En cours</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nouveaux ce mois
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.nouveaux}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{stats.nouveaux} depuis le début du mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Évolution mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="mois" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="montant" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  name="Montant"
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Répartition par pack</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={plansData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {plansData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Liste des transactions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Transactions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Agence</TableHead>
                  <TableHead className="text-muted-foreground">Pack</TableHead>
                  <TableHead className="text-muted-foreground">Durée</TableHead>
                  <TableHead className="text-muted-foreground">Montant</TableHead>
                  <TableHead className="text-muted-foreground">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Aucune transaction trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="border-border hover:bg-muted/50">
                      <TableCell className="text-foreground">
                        {new Date(transaction.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-foreground font-medium">
                        {transaction.tenant_name}
                      </TableCell>
                      <TableCell className="text-foreground">{transaction.plan_name}</TableCell>
                      <TableCell className="text-foreground">{transaction.duration} mois</TableCell>
                      <TableCell className="text-foreground font-semibold">
                        {formatCurrency(transaction.amount || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={transaction.status === "active" ? "default" : "secondary"}
                          className={
                            transaction.status === "active"
                              ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                              : ""
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
