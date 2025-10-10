import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, Users, Car, Download } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToExcel } from '@/lib/exportUtils';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Rapports() {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const [fleetData, setFleetData] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [clientsData, setClientsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFleetReport(),
        loadFinancialReport(),
        loadClientsReport(),
      ]);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFleetReport = async () => {
    const { data: vehicles } = await supabase.from('vehicles').select('*');
    
    if (vehicles) {
      const statusCounts = vehicles.reduce((acc: any, v) => {
        if (v.en_service === false) {
          acc['Hors service'] = (acc['Hors service'] || 0) + 1;
        } else {
          const status = v.statut === 'disponible' ? 'Disponible' : 
                        v.statut === 'loue' ? 'En location' : 
                        v.statut === 'reserve' ? 'Réservé' : 'En panne';
          acc[status] = (acc[status] || 0) + 1;
        }
        return acc;
      }, {});

      const statusData = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
      }));

      setFleetData({
        total: vehicles.length,
        available: vehicles.filter(v => v.statut === 'disponible' && v.en_service !== false).length,
        rented: vehicles.filter(v => v.statut === 'loue').length,
        statusData,
      });
    }
  };

  const loadFinancialReport = async () => {
    const { data: contracts } = await supabase
      .from('contracts')
      .select('*, clients(nom, prenom)')
      .gte('date_debut', dateRange.startDate)
      .lte('date_fin', dateRange.endDate)
      .neq('statut', 'annule');

    if (contracts) {
      const monthlyRevenue = contracts.reduce((acc: any, contract) => {
        const month = format(new Date(contract.date_debut), 'MMM yyyy', { locale: fr });
        acc[month] = (acc[month] || 0) + (contract.total_amount || 0);
        return acc;
      }, {});

      const revenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        revenue: Number(revenue),
      }));

      const totalRevenue = contracts.reduce((sum, c) => sum + (c.total_amount || 0), 0);
      const totalPaid = contracts.reduce((sum, c) => sum + (c.advance_payment || 0), 0);

      setFinancialData({
        totalRevenue,
        totalPaid,
        totalRemaining: totalRevenue - totalPaid,
        revenueData,
        contractCount: contracts.length,
      });
    }
  };

  const loadClientsReport = async () => {
    const { data: clients } = await supabase
      .from('clients')
      .select('*, contracts(id)')
      .gte('created_at', dateRange.startDate)
      .lte('created_at', dateRange.endDate);

    if (clients) {
      const typeData = clients.reduce((acc: any, client) => {
        const type = client.type === 'particulier' ? 'Particuliers' : 'Entreprises';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      const clientTypeData = Object.entries(typeData).map(([name, value]) => ({
        name,
        value,
      }));

      setClientsData({
        total: clients.length,
        newClients: clients.filter(c => new Date(c.created_at) >= new Date(dateRange.startDate)).length,
        clientTypeData,
      });
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  const exportFleetReport = () => {
    if (!fleetData) return;
    exportToExcel(fleetData.statusData, 'rapport_flotte');
  };

  const exportFinancialReport = () => {
    if (!financialData) return;
    exportToExcel(financialData.revenueData, 'rapport_financier');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Chargement des rapports...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Rapports personnalisés
          </h1>
          <p className="text-sm text-muted-foreground">
            Analysez vos données avec des rapports détaillés
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Période du rapport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date début</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Date fin</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadReportData} className="w-full">
                Actualiser les rapports
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="fleet" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fleet">
            <Car className="w-4 h-4 mr-2" />
            Flotte
          </TabsTrigger>
          <TabsTrigger value="financial">
            <TrendingUp className="w-4 h-4 mr-2" />
            Financier
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Users className="w-4 h-4 mr-2" />
            Clients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fleet" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total véhicules</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{fleetData?.total || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{fleetData?.available || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">En location</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">{fleetData?.rented || 0}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Répartition des statuts</CardTitle>
              <Button variant="outline" size="sm" onClick={exportFleetReport}>
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={fleetData?.statusData || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {fleetData?.statusData?.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Revenus totaux</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{financialData?.totalRevenue?.toFixed(2) || 0} DH</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Montant payé</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{financialData?.totalPaid?.toFixed(2) || 0} DH</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Reste à payer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{financialData?.totalRemaining?.toFixed(2) || 0} DH</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Nombre de contrats</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{financialData?.contractCount || 0}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Évolution des revenus</CardTitle>
              <Button variant="outline" size="sm" onClick={exportFinancialReport}>
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={financialData?.revenueData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Revenus (DH)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total clients</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{clientsData?.total || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Nouveaux clients</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{clientsData?.newClients || 0}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Répartition par type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={clientsData?.clientTypeData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="hsl(var(--primary))" name="Nombre de clients" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
